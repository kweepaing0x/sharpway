import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';

interface FraudUser {
  id?: string;
  telegram_username: string;
  comment: string;
  created_at?: string;
}

const FraudList: React.FC = () => {
  const [fraudUsers, setFraudUsers] = useState<FraudUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [newFraudUser, setNewFraudUser] = useState<FraudUser>({
    telegram_username: '',
    comment: ''
  });

  useEffect(() => {
    fetchFraudUsers();
  }, []);

  const fetchFraudUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fraud_list')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFraudUsers(data || []);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching fraud users:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewFraudUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!newFraudUser.telegram_username.trim()) {
      return 'Telegram username is required';
    }
    if (!newFraudUser.comment.trim()) {
      return 'Comment is required';
    }
    return null;
  };

  const handleAddFraudUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsAdding(true);
    setError(null);
    setSuccess(null);

    try {
      // Clean username (remove @ if present)
      const cleanUsername = newFraudUser.telegram_username.replace('@', '');

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('fraud_list')
        .select('id')
        .eq('telegram_username', cleanUsername)
        .maybeSingle();

      if (existingUser) {
        setError('This Telegram username is already in the fraud list');
        return;
      }

      const { error } = await supabase
        .from('fraud_list')
        .insert([{
          telegram_username: cleanUsername,
          comment: newFraudUser.comment.trim()
        }]);

      if (error) throw error;

      setSuccess('Fraud user added successfully');
      setNewFraudUser({ telegram_username: '', comment: '' });
      fetchFraudUsers();
    } catch (error: any) {
      console.error('Error adding fraud user:', error);
      setError(error.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteFraudUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this user from the fraud list?')) {
      return;
    }

    setDeletingId(id);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase
        .from('fraud_list')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuccess('Fraud user removed successfully');
      setFraudUsers(fraudUsers.filter(user => user.id !== id));
    } catch (error: any) {
      console.error('Error deleting fraud user:', error);
      setError(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fraud List Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage the list of fraudulent Telegram users. When these users place orders, stores will receive notifications.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
          {success}
        </div>
      )}

      {/* Add New Fraud User */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Add Fraud User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddFraudUser} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Telegram Username"
                name="telegram_username"
                value={newFraudUser.telegram_username}
                onChange={handleInputChange}
                placeholder="@username or username"
                required
                fullWidth
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comment
                </label>
                <textarea
                  name="comment"
                  value={newFraudUser.comment}
                  onChange={handleInputChange}
                  placeholder="Reason for adding to fraud list..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={isAdding}
              className="bg-red-600 hover:bg-red-700"
            >
              {isAdding ? 'Adding...' : 'Add to Fraud List'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Fraud Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Fraud Users ({fraudUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : fraudUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No fraud users in the list</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Telegram Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Added Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fraudUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            @{user.telegram_username}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs">
                          {user.comment}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteFraudUser(user.id!)}
                          disabled={deletingId === user.id}
                          className="text-red-600 hover:text-red-900"
                          title="Remove from fraud list"
                        >
                          {deletingId === user.id ? (
                            <div className="animate-spin h-5 w-5 border-b-2 border-red-500 rounded-full"></div>
                          ) : (
                            <Trash2 className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FraudList;