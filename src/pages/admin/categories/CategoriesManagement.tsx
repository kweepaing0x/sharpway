import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

interface Category {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const CategoriesManagement: React.FC = () => {
  const [storeCategories, setStoreCategories] = useState<Category[]>([]);
  const [productCategories, setProductCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<{ id: string; type: 'store' | 'product' } | null>(null);
  const [newCategory, setNewCategory] = useState<{ name: string; description: string; type: 'store' | 'product' } | null>(null);

  // Helper to make authenticated fetch requests to Edge Functions
  const authenticatedFetch = async (endpoint: string, options: RequestInit) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...(options.headers || {}),
    };
    
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Something went wrong');
    }
    return response.json();
  };

  // Fetch categories using Edge Functions
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Fetch store categories
        const storeCats = await authenticatedFetch('store-category-manager', { method: 'GET' });
        setStoreCategories(storeCats || []);

        // Fetch product categories
        const productCats = await authenticatedFetch('product-category-manager', { method: 'GET' });
        setProductCategories(productCats || []);

        setError(null);
      } catch (error: any) {
        console.error('Error fetching categories:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Create new category using Edge Functions
  const handleCreateCategory = async () => {
    if (!newCategory) return;

    try {
      const endpoint = newCategory.type === 'store' ? 'store-category-manager' : 'product-category-manager';
      const data = await authenticatedFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          name: newCategory.name,
          description: newCategory.description,
          is_active: true
        })
      });

      // Update local state
      if (newCategory.type === 'store') {
        setStoreCategories([...storeCategories, data[0]]); // Edge function returns array
      } else {
        setProductCategories([...productCategories, data[0]]); // Edge function returns array
      }

      setNewCategory(null);
      setError(null);
    } catch (error: any) {
      console.error('Error creating category:', error);
      setError(error.message);
    }
  };

  // Update category using Edge Functions
  const handleUpdateCategory = async (id: string, type: 'store' | 'product', updates: Partial<Category>) => {
    try {
      const endpoint = type === 'store' ? 'store-category-manager' : 'product-category-manager';
      await authenticatedFetch(endpoint, {
        method: 'PUT',
        body: JSON.stringify({ id, ...updates })
      });

      // Update local state
      if (type === 'store') {
        setStoreCategories(storeCategories.map(cat => 
          cat.id === id ? { ...cat, ...updates } : cat
        ));
      } else {
        setProductCategories(productCategories.map(cat => 
          cat.id === id ? { ...cat, ...updates } : cat
        ));
      }

      setEditingCategory(null);
      setError(null);
    } catch (error: any) {
      console.error('Error updating category:', error);
      setError(error.message);
    }
  };

  // Delete category using Edge Functions
  const handleDeleteCategory = async (id: string, type: 'store' | 'product') => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      const endpoint = type === 'store' ? 'store-category-manager' : 'product-category-manager';
      await authenticatedFetch(endpoint, {
        method: 'DELETE',
        body: JSON.stringify({ id })
      });

      // Update local state
      if (type === 'store') {
        setStoreCategories(storeCategories.filter(cat => cat.id !== id));
      } else {
        setProductCategories(productCategories.filter(cat => cat.id !== id));
      }

      setError(null);
    } catch (error: any) {
      console.error('Error deleting category:', error);
      setError(error.message);
    }
  };

  // Toggle category status
  const handleToggleStatus = async (category: Category, type: 'store' | 'product') => {
    await handleUpdateCategory(category.id, type, { is_active: !category.is_active });
  };

  const CategoryTable: React.FC<{ 
    categories: Category[]; 
    type: 'store' | 'product'; 
    title: string 
  }> = ({ categories, type, title }) => (
    <div className="bg-white shadow-md overflow-hidden sm:rounded-md">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <Button
            variant="primary"
            onClick={() => setNewCategory({ name: '', description: '', type })}
            className="text-sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add {type === 'store' ? 'Store' : 'Product'} Category
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  No {type} categories found.
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingCategory?.id === category.id && editingCategory?.type === type ? (
                      <input
                        type="text"
                        defaultValue={category.name}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        onBlur={(e) => handleUpdateCategory(category.id, type, { name: e.target.value })}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateCategory(category.id, type, { name: e.currentTarget.value });
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">{category.name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingCategory?.id === category.id && editingCategory?.type === type ? (
                      <input
                        type="text"
                        defaultValue={category.description || ''}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        onBlur={(e) => handleUpdateCategory(category.id, type, { description: e.target.value })}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateCategory(category.id, type, { description: e.currentTarget.value });
                          }
                        }}
                      />
                    ) : (
                      <div className="text-sm text-gray-500">{category.description || '-'}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStatus(category, type)}
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        category.is_active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {category.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {editingCategory?.id === category.id && editingCategory?.type === type ? (
                        <button
                          onClick={() => setEditingCategory(null)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Cancel"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setEditingCategory({ id: category.id, type })}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteCategory(category.id, type)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-gray-500">Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Categories Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage store and product categories
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {/* New Category Modal */}
      {newCategory && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Add New {newCategory.type === 'store' ? 'Store' : 'Product'} Category
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Category name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Category description (optional)"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => setNewCategory(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateCategory}
                  disabled={!newCategory.name.trim()}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Create Category
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CategoryTable 
        categories={storeCategories} 
        type="store" 
        title="Store Categories" 
      />

      <CategoryTable 
        categories={productCategories} 
        type="product" 
        title="Product Categories" 
      />
    </div>
  );
};

export default CategoriesManagement;