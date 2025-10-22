import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { MarqueeAnnouncement } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Plus, Edit, Trash2, Eye, EyeOff, Megaphone } from 'lucide-react';

const MarqueeAnnouncementsManager: React.FC = () => {
  const [announcements, setAnnouncements] = useState<MarqueeAnnouncement[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    content: '',
    target_page: 'home' as 'home' | 'store',
    store_id: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    fetchAnnouncements();
    fetchStores();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('marquee_announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAnnouncements(data || []);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching announcements:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      setStores(data || []);
    } catch (error: any) {
      console.error('Error fetching stores:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.content.trim()) return 'Announcement content is required';
    if (formData.target_page === 'store' && !formData.store_id) return 'Store selection is required for store-specific announcements';
    if (formData.start_date && formData.end_date && new Date(formData.start_date) >= new Date(formData.end_date)) {
      return 'End date must be after start date';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      const announcementData = {
        content: formData.content.trim(),
        target_page: formData.target_page,
        store_id: formData.target_page === 'store' ? formData.store_id : null,
        start_date: formData.start_date || new Date().toISOString(),
        end_date: formData.end_date || null
      };

      if (editingId) {
        const { error } = await supabase
          .from('marquee_announcements')
          .update(announcementData)
          .eq('id', editingId);

        if (error) throw error;

        setSuccess('Announcement updated successfully');
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from('marquee_announcements')
          .insert([announcementData]);

        if (error) throw error;

        setSuccess('Announcement created successfully');
      }

      setFormData({
        content: '',
        target_page: 'home',
        store_id: '',
        start_date: '',
        end_date: ''
      });
      
      fetchAnnouncements();
    } catch (error: any) {
      console.error('Error saving announcement:', error);
      setError(error.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleEdit = (announcement: MarqueeAnnouncement) => {
    setFormData({
      content: announcement.content,
      target_page: announcement.target_page,
      store_id: announcement.store_id || '',
      start_date: announcement.start_date ? new Date(announcement.start_date).toISOString().slice(0, 16) : '',
      end_date: announcement.end_date ? new Date(announcement.end_date).toISOString().slice(0, 16) : ''
    });
    setEditingId(announcement.id);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('marquee_announcements')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setAnnouncements(announcements.map(a => 
        a.id === id ? { ...a, is_active: !currentStatus } : a
      ));
      
      setSuccess(`Announcement ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      console.error('Error toggling announcement status:', error);
      setError(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    setDeletingId(id);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase
        .from('marquee_announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuccess('Announcement deleted successfully');
      setAnnouncements(announcements.filter(a => a.id !== id));
    } catch (error: any) {
      console.error('Error deleting announcement:', error);
      setError(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      content: '',
      target_page: 'home',
      store_id: '',
      start_date: '',
      end_date: ''
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Marquee Announcements</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage scrolling announcements that appear on the home page and store pages.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative flex items-center">
          <Megaphone className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
          {success}
        </div>
      )}

      {/* Add/Edit Announcement Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            {editingId ? 'Edit Announcement' : 'Add New Announcement'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Announcement Content
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="Enter your announcement text..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Page
                </label>
                <select
                  name="target_page"
                  value={formData.target_page}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="home">Home Page</option>
                  <option value="store">Specific Store</option>
                </select>
              </div>

              {formData.target_page === 'store' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Store
                  </label>
                  <select
                    name="store_id"
                    value={formData.store_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Choose a store...</option>
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Start Date (Optional)"
                name="start_date"
                type="datetime-local"
                value={formData.start_date}
                onChange={handleInputChange}
                fullWidth
              />

              <Input
                label="End Date (Optional)"
                name="end_date"
                type="datetime-local"
                value={formData.end_date}
                onChange={handleInputChange}
                fullWidth
              />
            </div>

            <div className="flex space-x-2">
              <Button
                type="submit"
                variant="primary"
                disabled={isAdding}
              >
                {isAdding ? 'Saving...' : (editingId ? 'Update Announcement' : 'Create Announcement')}
              </Button>
              
              {editingId && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={cancelEdit}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Announcements List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Announcements ({announcements.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No announcements created yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          announcement.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {announcement.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {announcement.target_page === 'home' ? 'Home Page' : 'Store Page'}
                        </span>
                      </div>
                      <p className="text-gray-900 mb-2">{announcement.content}</p>
                      <div className="text-sm text-gray-500">
                        <p>Created: {new Date(announcement.created_at).toLocaleDateString()}</p>
                        {announcement.start_date && (
                          <p>Starts: {new Date(announcement.start_date).toLocaleDateString()}</p>
                        )}
                        {announcement.end_date && (
                          <p>Ends: {new Date(announcement.end_date).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleToggleActive(announcement.id, announcement.is_active)}
                        className={`p-2 rounded-md ${
                          announcement.is_active
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={announcement.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {announcement.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleEdit(announcement)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        disabled={deletingId === announcement.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        title="Delete"
                      >
                        {deletingId === announcement.id ? (
                          <div className="animate-spin h-4 w-4 border-b-2 border-red-500 rounded-full"></div>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MarqueeAnnouncementsManager;


