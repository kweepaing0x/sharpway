import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { PopUpAd } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ImageUpload from '../../components/ui/ImageUpload';
import { Plus, Edit, Trash2, Eye, EyeOff, Monitor } from 'lucide-react';

const PopUpAdsManager: React.FC = () => {
  const [ads, setAds] = useState<PopUpAd[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    image_url: '',
    link_url: '',
    target_page: 'home' as 'home' | 'store',
    store_id: '',
    start_date: '',
    end_date: '',
    display_frequency: 'once_per_session' as 'once_per_session' | 'every_visit'
  });

  useEffect(() => {
    fetchAds();
    fetchStores();
  }, []);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pop_up_ads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAds(data || []);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching ads:', error);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (url: string) => {
    setFormData(prev => ({
      ...prev,
      image_url: url
    }));
  };

  const validateForm = () => {
    if (!formData.image_url.trim()) return 'Ad image is required';
    if (formData.target_page === 'store' && !formData.store_id) return 'Store selection is required for store-specific ads';
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
      const adData = {
        image_url: formData.image_url.trim(),
        link_url: formData.link_url.trim() || null,
        target_page: formData.target_page,
        store_id: formData.target_page === 'store' ? formData.store_id : null,
        start_date: formData.start_date || new Date().toISOString(),
        end_date: formData.end_date || null,
        display_frequency: formData.display_frequency
      };

      if (editingId) {
        const { error } = await supabase
          .from('pop_up_ads')
          .update(adData)
          .eq('id', editingId);

        if (error) throw error;

        setSuccess('Pop-up ad updated successfully');
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from('pop_up_ads')
          .insert([adData]);

        if (error) throw error;

        setSuccess('Pop-up ad created successfully');
      }

      setFormData({
        image_url: '',
        link_url: '',
        target_page: 'home',
        store_id: '',
        start_date: '',
        end_date: '',
        display_frequency: 'once_per_session'
      });
      
      fetchAds();
    } catch (error: any) {
      console.error('Error saving ad:', error);
      setError(error.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleEdit = (ad: PopUpAd) => {
    setFormData({
      image_url: ad.image_url,
      link_url: ad.link_url || '',
      target_page: ad.target_page,
      store_id: ad.store_id || '',
      start_date: ad.start_date ? new Date(ad.start_date).toISOString().slice(0, 16) : '',
      end_date: ad.end_date ? new Date(ad.end_date).toISOString().slice(0, 16) : '',
      display_frequency: ad.display_frequency
    });
    setEditingId(ad.id);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('pop_up_ads')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setAds(ads.map(a => 
        a.id === id ? { ...a, is_active: !currentStatus } : a
      ));
      
      setSuccess(`Pop-up ad ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      console.error('Error toggling ad status:', error);
      setError(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this pop-up ad?')) {
      return;
    }

    setDeletingId(id);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase
        .from('pop_up_ads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuccess('Pop-up ad deleted successfully');
      setAds(ads.filter(a => a.id !== id));
    } catch (error: any) {
      console.error('Error deleting ad:', error);
      setError(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      image_url: '',
      link_url: '',
      target_page: 'home',
      store_id: '',
      start_date: '',
      end_date: '',
      display_frequency: 'once_per_session'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pop-up Ads Manager</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage pop-up advertisements that appear on the home page and store pages.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative flex items-center">
          <Monitor className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
          {success}
        </div>
      )}

      {/* Add/Edit Ad Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            {editingId ? 'Edit Pop-up Ad' : 'Add New Pop-up Ad'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ad Image
              </label>
              <ImageUpload
                value={formData.image_url}
                onChange={handleImageUpload}
                onError={setError}
                bucket="mall-images"
                folder="ads"
              />
            </div>

            <Input
              label="Link URL (Optional)"
              name="link_url"
              type="url"
              value={formData.link_url}
              onChange={handleInputChange}
              placeholder="https://example.com"
              fullWidth
              helperText="Where users will be redirected when they click the ad"
            />

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Frequency
              </label>
              <select
                name="display_frequency"
                value={formData.display_frequency}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="once_per_session">Once per session</option>
                <option value="every_visit">Every visit</option>
              </select>
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
                {isAdding ? 'Saving...' : (editingId ? 'Update Ad' : 'Create Ad')}
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

      {/* Ads List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Pop-up Ads ({ads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : ads.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No pop-up ads created yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ads.map((ad) => (
                <div key={ad.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="space-y-3">
                    <div className="aspect-video bg-gray-100 rounded-md overflow-hidden">
                      <img
                        src={ad.image_url}
                        alt="Ad preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        ad.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {ad.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {ad.target_page === 'home' ? 'Home Page' : 'Store Page'}
                      </span>
                    </div>

                    <div className="text-sm text-gray-500">
                      <p>Frequency: {ad.display_frequency.replace('_', ' ')}</p>
                      {ad.link_url && (
                        <p className="truncate">Link: {ad.link_url}</p>
                      )}
                      <p>Created: {new Date(ad.created_at).toLocaleDateString()}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleActive(ad.id, ad.is_active)}
                          className={`p-2 rounded-md ${
                            ad.is_active
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={ad.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {ad.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleEdit(ad)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleDelete(ad.id)}
                        disabled={deletingId === ad.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        title="Delete"
                      >
                        {deletingId === ad.id ? (
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

export default PopUpAdsManager;