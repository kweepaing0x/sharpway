import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { Plus, Search, UserCheck, UserX, Key, Trash2, RefreshCw } from 'lucide-react';

const ManagersList: React.FC = () => {
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [resetPasswordId, setResetPasswordId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchManagers = useCallback(async () => {
    try {
      setLoading(true);
      console.log('ManagersList: Starting to fetch managers...');
      
      // First, let's try to fetch store managers with a more explicit query
      const { data: storeManagers, error: storeManagersError } = await supabase
        .from('store_managers')
        .select(`
          id,
          user_id,
          store_id,
          is_active,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (storeManagersError) {
        console.error('ManagersList: Error fetching store_managers:', storeManagersError);
        throw storeManagersError;
      }

      console.log('ManagersList: Raw store_managers data:', storeManagers);

      if (!storeManagers || storeManagers.length === 0) {
        console.log('ManagersList: No store managers found');
        setManagers([]);
        setError(null);
        setLoading(false);
        return;
      }

      // Get user IDs and store IDs for separate queries
      const userIds = storeManagers.map(sm => sm.user_id);
      const storeIds = storeManagers.map(sm => sm.store_id);

      console.log('ManagersList: User IDs to fetch:', userIds);
      console.log('ManagersList: Store IDs to fetch:', storeIds);

      // Fetch users separately
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, role, created_at')
        .in('id', userIds)
        .eq('role', 'store-manager');

      if (usersError) {
        console.error('ManagersList: Error fetching users:', usersError);
        throw usersError;
      }

      console.log('ManagersList: Users data:', users);

      // Fetch stores separately
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id, name, location, is_active')
        .in('id', storeIds);

      if (storesError) {
        console.error('ManagersList: Error fetching stores:', storesError);
        throw storesError;
      }

      console.log('ManagersList: Stores data:', stores);

      // Combine the data manually
      const combinedManagers = storeManagers.map(manager => {
        const user = users?.find(u => u.id === manager.user_id);
        const store = stores?.find(s => s.id === manager.store_id);
        
        return {
          ...manager,
          users: user ? { email: user.email, role: user.role } : null,
          stores: store ? { name: store.name, location: store.location } : null
        };
      });

      console.log('ManagersList: Combined managers data:', combinedManagers);

      // Filter out any entries where user or store data might be missing
      const validManagers = combinedManagers.filter(manager => {
        const isValid = manager.users && manager.users.email && manager.stores && manager.stores.name;
        if (!isValid) {
          console.log('ManagersList: Filtering out invalid manager:', manager);
        }
        return isValid;
      });

      console.log('ManagersList: Valid managers after filtering:', validManagers);

      setManagers(validManagers);
      setError(null);
    } catch (error: any) {
      console.error('ManagersList: Error in fetchManagers:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchManagers();
  }, [fetchManagers]);

  const toggleManagerStatus = async (id: string, isActive: boolean) => {
    console.log('ManagersList: Toggling manager status:', { id, isActive });
    setProcessingId(id);
    setError(null);
    
    try {
      const newStatus = !isActive;
      
      const { error } = await supabase
        .from('store_managers')
        .update({ is_active: newStatus })
        .eq('id', id);

      if (error) {
        console.error('ManagersList: Error updating manager status:', error);
        throw error;
      }

      console.log('ManagersList: Manager status updated successfully');

      // Update local state immediately
      setManagers(prevManagers => 
        prevManagers.map(manager => 
          manager.id === id ? { ...manager, is_active: newStatus } : manager
        )
      );
      
      setSuccessMessage(`Manager status ${newStatus ? 'activated' : 'deactivated'} successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('ManagersList: Error updating manager status:', error);
      setError(error.message);
      // Refresh data on error to ensure consistency
      await fetchManagers();
    } finally {
      setProcessingId(null);
    }
  };

  const deleteManager = async (managerId: string, userId: string) => {
    if (!confirm('Are you sure you want to delete this manager? This action cannot be undone.')) {
      return;
    }

    console.log('ManagersList: Deleting manager:', { managerId, userId });
    setProcessingId(managerId);
    setError(null);
    
    try {
      // Call the delete-manager edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-manager`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            userId,
            managerId
          }),
        }
      );

      console.log('ManagersList: Delete response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('ManagersList: Delete error response:', errorData);
        throw new Error(errorData.error || 'Failed to delete manager');
      }
      
      console.log('ManagersList: Manager deleted successfully');

      // Update local state immediately to remove the deleted manager
      setManagers(prevManagers => 
        prevManagers.filter(manager => manager.id !== managerId)
      );
      
      setSuccessMessage('Manager deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('ManagersList: Error deleting manager:', error);
      setError(error.message);
      // Refresh data on error to ensure consistency
      await fetchManagers();
    } finally {
      setProcessingId(null);
    }
  };

  const resetPassword = async (userId: string) => {
    if (!newPassword) {
      setError('Password cannot be empty');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    console.log('ManagersList: Resetting password for user:', userId);
    setProcessingId(userId);
    setError(null);
    
    try {
      // Call the reset-manager-password edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-manager-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            userId,
            newPassword
          }),
        }
      );

      console.log('ManagersList: Reset password response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('ManagersList: Reset password error response:', errorData);
        throw new Error(errorData.error || 'Failed to reset password');
      }

      console.log('ManagersList: Password reset successfully');

      setResetPasswordId(null);
      setNewPassword('');
      setSuccessMessage('Password reset successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('ManagersList: Error resetting password:', error);
      setError(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Filter to include all managers but highlight active ones
  const filteredManagers = managers.filter(manager =>
    (manager.users?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manager.stores?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store Managers</h1>
          <p className="mt-1 text-sm text-gray-500">
            Add or remove store manager access
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link to="/admin/managers/new">
            <Button variant="primary">
              <Plus className="h-4 w-4 mr-1" />
              Add Manager
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button 
              className="text-red-700 hover:text-red-900"
              onClick={() => setError(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
          <div className="flex justify-between items-center">
            <span>{successMessage}</span>
            <button 
              className="text-green-700 hover:text-green-900"
              onClick={() => setSuccessMessage(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative rounded-md flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search managers..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Button 
          variant="secondary" 
          onClick={fetchManagers}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading managers...</p>
        </div>
      ) : filteredManagers.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredManagers.map((manager) => (
              <li key={manager.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {manager.users?.email?.[0].toUpperCase() || 'M'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            {manager.users?.email || 'No Email'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Managing: {manager.stores?.name || 'No Store'} 
                            {manager.stores?.location ? ` (${manager.stores.location})` : ''}
                          </p>
                          <p className="text-xs text-gray-400">
                            User ID: {manager.user_id} | Manager ID: {manager.id}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        manager.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {manager.is_active ? 'Active' : 'Inactive'}
                      </span>
                      
                      {/* Reset Password Button */}
                      {resetPasswordId === manager.user_id ? (
                        <div className="flex items-center space-x-2">
                          <input 
                            type="password" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New password"
                            className="text-sm border rounded-md px-2 py-1"
                            minLength={6}
                          />
                          <button
                            onClick={() => resetPassword(manager.user_id)}
                            disabled={processingId === manager.user_id}
                            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                            {processingId === manager.user_id ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => {
                              setResetPasswordId(null);
                              setNewPassword('');
                            }}
                            className="px-2 py-1 bg-gray-200 text-gray-800 text-xs rounded hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setResetPasswordId(manager.user_id)}
                          disabled={processingId === manager.user_id}
                          className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded hover:bg-blue-100 flex items-center disabled:opacity-50"
                        >
                          <Key className="h-3 w-3 mr-1" />
                           Reset Password
                        </button>
                      )}
                      
                      {/* Toggle Status Button */}
                      <Button
                        variant={manager.is_active ? 'danger' : 'primary'}
                        onClick={() => toggleManagerStatus(manager.id, manager.is_active)}
                        isLoading={processingId === manager.id}
                        disabled={processingId === manager.id}
                        className="text-sm px-2 py-1 h-auto"
                      >
                        {processingId === manager.id ? (
                          <div className="animate-spin h-3 w-3 border-b-2 border-current rounded-full mr-1"></div>
                        ) : manager.is_active ? (
                          <UserX className="h-3 w-3 mr-1" />
                        ) : (
                          <UserCheck className="h-3 w-3 mr-1" />
                        )}
                        {processingId === manager.id ? 'Updating...' : (manager.is_active ? 'Deactivate' : 'Activate')}
                      </Button>
                      
                      {/* Delete Button */}
                      <Button
                        variant="danger"
                        onClick={() => deleteManager(manager.id, manager.user_id)}
                        isLoading={processingId === manager.id}
                        disabled={processingId === manager.id}
                        className="text-sm px-2 py-1 h-auto"
                      >
                        {processingId === manager.id ? (
                          <div className="animate-spin h-3 w-3 border-b-2 border-current rounded-full mr-1"></div>
                        ) : (
                          <Trash2 className="h-3 w-3 mr-1" />
                        )}
                        {processingId === manager.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No store managers found.</p>
            <p className="text-sm text-gray-400 mt-2">
              {managers.length === 0 
                ? "Try creating a store with a manager account first." 
                : "No managers match your search criteria."}
            </p>
            <Link to="/admin/managers/new" className="mt-4 inline-block">
              <Button variant="primary">Add your first manager</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ManagersList;

