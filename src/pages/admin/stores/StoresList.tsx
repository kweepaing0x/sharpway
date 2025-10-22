import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import { Store } from '../../../types';
import { Plus, Search, Filter, Edit, Trash2, Eye, AlertCircle, BadgeCheck } from 'lucide-react';
import Button from '../../../components/ui/Button';

const StoresList: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [deletingStore, setDeletingStore] = useState<string | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Fetch stores function
  const fetchStores = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all stores
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('display_order', { ascending: true, nullsLast: true })
        .order('name');
      
      if (error) throw error;
      
      setStores(data || []);

      // Get count of pending stores
      const { count, error: countError } = await supabase
        .from('stores')
        .select('*', { count: 'exact' })
        .eq('approval_status', 'pending');

      if (countError) throw countError;
      
      setPendingCount(count || 0);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching stores:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update display order
  const handleUpdateDisplayOrder = async (storeId: string, order: number | null) => {
    setUpdatingOrder(storeId);
    try {
      const { error } = await supabase
        .from('stores')
        .update({ display_order: order })
        .eq('id', storeId);

      if (error) throw error;

      // Update local state immediately
      setStores(prevStores => 
        prevStores.map(s => 
          s.id === storeId ? { ...s, display_order: order } : s
        )
      );
      setError(null);
    } catch (error: any) {
      console.error('Error updating display order:', error);
      setError(error.message);
      // Refresh data on error to ensure consistency
      await fetchStores();
    } finally {
      setUpdatingOrder(null);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  // Delete store managers associated with a store
  const deleteStoreManagers = async (storeId: string) => {
    try {
      // 1. Fetch all managers for this store
      const { data: managers, error: fetchError } = await supabase
        .from('store_managers')
        .select('id, user_id')
        .eq('store_id', storeId);

      if (fetchError) throw fetchError;

      // 2. Delete each manager
      for (const manager of managers || []) {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-manager`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              userId: manager.user_id,
              managerId: manager.id
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error deleting manager:', errorData);
          // Continue with other managers even if one fails
        }
      }

      return true;
    } catch (error) {
      console.error('Error deleting store managers:', error);
      return false;
    }
  };

  // Delete store
  const handleDeleteStore = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this store? This will also delete all associated store managers.')) return;

    setDeletingStore(id);
    setError(null);

    try {
      // First delete all associated store managers
      const managersDeleted = await deleteStoreManagers(id);
      
      if (!managersDeleted) {
        console.warn('Some managers may not have been deleted properly');
      }

      // Then delete the store
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state immediately
      setStores(prevStores => prevStores.filter(store => store.id !== id));
      setError(null);
    } catch (error: any) {
      console.error('Error deleting store:', error);
      setError(`Failed to delete store: ${error.message}. If this problem persists, please contact support.`);
      // Refresh data on error to ensure consistency
      await fetchStores();
    } finally {
      setDeletingStore(null);
    }
  };

  // Toggle store status
  const handleToggleStatus = async (store: StoreType) => {
    setUpdatingStatus(store.id);
    setError(null);
    
    try {
      const newStatus = !store.is_active;
      
      const { error } = await supabase
        .from('stores')
        .update({ is_active: newStatus })
        .eq('id', store.id);

      if (error) throw error;

      // Update local state immediately
      setStores(prevStores => 
        prevStores.map(s => 
          s.id === store.id ? { ...s, is_active: newStatus } : s
        )
      );
      setError(null);
    } catch (error: any) {
      console.error('Error updating store status:', error);
      setError(error.message);
      // Refresh data on error to ensure consistency
      await fetchStores();
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Toggle store verification
  const handleToggleVerification = async (store: StoreType) => {
    setVerifying(store.id);
    setError(null);
    
    try {
      const newVerificationStatus = !store.is_verified;
      
      const { error } = await supabase
        .from('stores')
        .update({ is_verified: newVerificationStatus })
        .eq('id', store.id);

      if (error) throw error;

      // Update local state immediately
      setStores(prevStores => 
        prevStores.map(s => 
          s.id === store.id ? { ...s, is_verified: newVerificationStatus } : s
        )
      );
      setError(null);
    } catch (error: any) {
      console.error('Error updating store verification:', error);
      setError(error.message);
      // Refresh data on error to ensure consistency
      await fetchStores();
    } finally {
      setVerifying(null);
    }
  };

  // Filter stores based on search term
  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stores</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage all stores in your mall
          </p>
        </div>
        <div className="mt-4 sm:mt-0 space-y-2 sm:space-y-0 sm:space-x-2">
          {pendingCount > 0 && (
            <Link to="/admin/stores/approval">
              <Button variant="secondary" className="w-full sm:w-auto">
                <AlertCircle className="h-4 w-4 mr-1 text-yellow-500" />
                Review Pending ({pendingCount})
              </Button>
            </Link>
          )}
          <Link to="/admin/stores/new">
            <Button variant="primary" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-1" />
              Add Store
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative rounded-md flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            placeholder="Search stores..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Button variant="secondary">
          <Filter className="h-4 w-4 mr-1" />
          Filter
        </Button>
        
        <Button 
          variant="secondary" 
          onClick={fetchStores}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Stores list */}
      <div className="bg-white shadow-md overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading stores...</p>
          </div>
        ) : filteredStores.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Store
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Display Order
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStores.map((store) => (
                  <tr key={store.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {store.logo_url ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={store.logo_url}
                              alt={store.name}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-medium">
                                {store.name.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">
                              {store.name}
                            </div>
                            {store.is_verified && (
                              <BadgeCheck className="h-4 w-4 ml-1 text-blue-500" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {store.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="1"
                          max="999"
                          value={store.display_order || ''}
                          onChange={(e) => handleUpdateDisplayOrder(store.id, parseInt(e.target.value) || null)}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Order"
                          disabled={updatingOrder === store.id}
                        />
                        {store.display_order && store.display_order <= 10 && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                            📌 Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {store.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Floor {store.floor} - {store.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleStatus(store)}
                          disabled={updatingStatus === store.id}
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            updatingStatus === store.id
                              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                              : store.is_active
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {updatingStatus === store.id ? (
                            <span className="flex items-center">
                              <div className="animate-spin h-3 w-3 border-b-2 border-gray-500 rounded-full mr-1"></div>
                              Updating...
                            </span>
                          ) : (
                            store.is_active ? 'Active' : 'Inactive'
                          )}
                        </button>
                        <button
                          onClick={() => handleToggleVerification(store)}
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            store.is_verified
                              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                          disabled={verifying === store.id}
                        >
                          {verifying === store.id ? (
                            <span className="flex items-center">
                              <div className="animate-spin h-3 w-3 border-b-2 border-blue-500 rounded-full mr-1"></div>
                              Updating...
                            </span>
                          ) : (
                            <>
                              {store.is_verified ? 'Verified' : 'Unverified'}
                            </>
                          )}
                        </button>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          store.approval_status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : store.approval_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {store.approval_status.charAt(0).toUpperCase() + store.approval_status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link 
                          to={`/admin/stores/${store.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="View"
                        >
                          <Eye className="h-5 w-5" />
                        </Link>
                        <Link 
                          to={`/admin/stores/${store.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit"
                        >
                          <Edit className="h-5 w-5" />
                        </Link>
                        <button 
                          onClick={() => handleDeleteStore(store.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                          disabled={deletingStore === store.id}
                        >
                          {deletingStore === store.id ? (
                            <div className="animate-spin h-5 w-5 border-b-2 border-red-500 rounded-full"></div>
                          ) : (
                            <Trash2 className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            No stores found matching your search criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default StoresList;