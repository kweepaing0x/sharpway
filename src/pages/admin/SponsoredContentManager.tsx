import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { SponsoredContent } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ImageUpload from '../../components/ui/ImageUpload';
import { Plus, Edit, Trash2, Eye, EyeOff, Star } from 'lucide-react';

const SponsoredContentManager: React.FC = () => {
  const [items, setItems] = useState<SponsoredContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    redirect_url: '',
    display_order: 0,
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sponsored_content')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;

      setItems(data || []);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching sponsored content:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'display_order' ? parseInt(value) || 0 : value
    }));
  };

  const handleImageUpload = (url: string) => {
    setFormData(prev => ({
      ...prev,
      image_url: url
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) return 'Title is required';
    if (!formData.image_url.trim()) return 'Image is required';
    if (!formData.redirect_url.trim()) return 'Redirect URL is required';
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
      const itemData = {
        title: formData.title.trim(),
        image_url: formData.image_url.trim(),
        redirect_url: formData.redirect_url.trim(),
        display_order: formData.display_order,
        start_date: formData.start_date || new Date().toISOString(),
        end_date: formData.end_date || null
      };

      if (editingId) {
        const { error } = await supabase
          .from('sponsored_content')
          .update(itemData)
          .eq('id', editingId);

        if (error) throw error;

        setSuccess('Sponsored content updated successfully');
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from('sponsored_content')
          .insert([itemData]);

        if (error) throw error;

        setSuccess('Sponsored content created successfully');
      }

      setFormData({
        title: '',
        image_url: '',
        redirect_url: '',
        display_order: 0,
        start_date: '',
        end_date: ''
      });

      fetchItems();
    } catch (error: any) {
      console.error('Error saving sponsored content:', error);
      setError(error.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleEdit = (item: SponsoredContent) => {
    setFormData({
      title: item.title,
      image_url: item.image_url,
      redirect_url: item.redirect_url,
      display_order: item.display_order,
      start_date: item.start_date ? new Date(item.start_date).toISOString().slice(0, 16) : '',
      end_date: item.end_date ? new Date(item.end_date).toISOString().slice(0, 16) : ''
    });
    setEditingId(item.id);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('sponsored_content')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setItems(items.map(item =>
        item.id === id ? { ...item, is_active: !currentStatus } : item
      ));

      setSuccess(`Sponsored content ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      console.error('Error toggling status:', error);
      setError(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this sponsored content?')) {
      return;
    }

    setDeletingId(id);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase
        .from('sponsored_content')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuccess('Sponsored content deleted successfully');
      setItems(items.filter(item => item.id !== id));
    } catch (error: any) {
      console.error('Error deleting sponsored content:', error);
      setError(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      title: '',
      image_url: '',
      redirect_url: '',
      display_order: 0,
      start_date: '',
      end_date: ''
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sponsored Content Manager</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage featured carousel content that appears on the home page.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded relative flex items-center">
          <Star className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded relative">
          {success}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            {editingId ? 'Edit Sponsored Content' : 'Add New Sponsored Content'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter content title"
              required
              fullWidth
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Content Image
              </label>
              <ImageUpload
                value={formData.image_url}
                onChange={handleImageUpload}
                onError={setError}
                bucket="mall-images"
                folder="sponsored"
              />
            </div>

            <Input
              label="Redirect URL"
              name="redirect_url"
              type="url"
              value={formData.redirect_url}
              onChange={handleInputChange}
              placeholder="https://example.com"
              required
              fullWidth
              helperText="Where users will be redirected when they click the content"
            />

            <Input
              label="Display Order"
              name="display_order"
              type="number"
              value={formData.display_order.toString()}
              onChange={handleInputChange}
              placeholder="0"
              fullWidth
              helperText="Lower numbers appear first in the carousel"
            />

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
                {isAdding ? 'Saving...' : (editingId ? 'Update Content' : 'Create Content')}
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

      <Card>
        <CardHeader>
          <CardTitle>Sponsored Content ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No sponsored content created yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <div key={item.id} className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <div className="space-y-3">
                    <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                        {item.redirect_url}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        item.is_active
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      }`}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        Order: {item.display_order}
                      </span>
                    </div>

                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <p>Created: {new Date(item.created_at).toLocaleDateString()}</p>
                      {item.end_date && (
                        <p>Expires: {new Date(item.end_date).toLocaleDateString()}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t dark:border-gray-700">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleActive(item.id, item.is_active)}
                          className={`p-2 rounded-md ${
                            item.is_active
                              ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                              : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                          }`}
                          title={item.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {item.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                        title="Delete"
                      >
                        {deletingId === item.id ? (
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

export default SponsoredContentManager;
