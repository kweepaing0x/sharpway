import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Product, ProductCategory, ProductArrangement } from '../../types';
import { Plus, Search, Edit, Trash2, Eye, SlidersHorizontal, RefreshCw } from 'lucide-react';
import Button from '../../components/ui/Button';
import PriceDisplay from '../../components/PriceDisplay';

const StoreManagerProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [managedStores, setManagedStores] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [arrangements, setArrangements] = useState<ProductArrangement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [editingArrangement, setEditingArrangement] = useState<string | null>(null);
  const [arrangementForm, setArrangementForm] = useState({
    display_order: 0,
    is_visible: true,
    starts_at: '',
    ends_at: ''
  });

  const fetchManagedStores = useCallback(async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      
      const { data, error } = await supabase
        .from('store_managers')
        .select(`
          *,
          stores!inner(*)
        `)
        .eq('user_id', user?.id)
        .eq('is_active', true);

      if (error) throw error;

      const stores = data?.map(item => item.stores) || [];
      setManagedStores(stores);
      
      if (stores.length > 0 && !selectedStore) {
        setSelectedStore(stores[0].id);
      }
    } catch (error: any) {
      console.error('Error fetching managed stores:', error);
      setError(error.message);
    }
  }, [selectedStore]);

  // Fetch store manager's stores
  useEffect(() => {
    fetchManagedStores();
  }, [fetchManagedStores]);

  const fetchProducts = useCallback(async () => {
    if (!selectedStore) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          stores!inner(
            id,
            name
          )
        `)
        .eq('store_id', selectedStore)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [selectedStore]);

  // Fetch products when selected store changes or on explicit refresh
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [selectedStore, fetchProducts]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      setError(error.message);
    }
  };

  const fetchArrangements = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_arrangements')
        .select('*')
        .eq('product_id', productId)
        .order('display_order');

      if (error) throw error;
      setArrangements(data || []);
    } catch (error: any) {
      console.error('Error fetching arrangements:', error);
      setError(error.message);
    }
  };

  const handleArrangementSubmit = async (productId: string, storeId: string) => {
    if (!selectedCategory) return;

    try {
      const { error } = await supabase
        .from('product_arrangements')
        .upsert({
          id: editingArrangement || undefined,
          product_id: productId,
          category_id: selectedCategory,
          store_id: storeId,
          display_order: arrangementForm.display_order,
          is_visible: arrangementForm.is_visible,
          starts_at: arrangementForm.starts_at || null,
          ends_at: arrangementForm.ends_at || null
        });

      if (error) throw error;

      // Refresh arrangements
      await fetchArrangements(productId);
      
      // Reset form
      setEditingArrangement(null);
      setSelectedCategory('');
      setArrangementForm({
        display_order: 0,
        is_visible: true,
        starts_at: '',
        ends_at: ''
      });
    } catch (error: any) {
      console.error('Error saving arrangement:', error);
      setError(error.message);
    }
  };

  const handleRemoveArrangement = async (arrangementId: string, productId: string) => {
    try {
      const { error } = await supabase
        .from('product_arrangements')
        .delete()
        .eq('id', arrangementId);

      if (error) throw error;

      // Refresh arrangements
      await fetchArrangements(productId);
    } catch (error: any) {
      console.error('Error removing arrangement:', error);
      setError(error.message);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state and re-fetch to ensure consistency
      setProducts(products.filter(product => product.id !== id));
      fetchProducts(); // Re-fetch products after deletion
      setError(null);
    } catch (error: any) {
      console.error('Error deleting product:', error);
      setError(error.message);
    }
  };

  // Toggle product stock status
  const handleToggleStock = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          in_stock: !product.in_stock,
          stock_quantity: !product.in_stock ? 1 : 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id);

      if (error) throw error;

      // Update local state and re-fetch to ensure consistency
      setProducts(products.map(p => 
        p.id === product.id ? { 
          ...p, 
          in_stock: !p.in_stock,
          stock_quantity: !p.in_stock ? 1 : 0,
          updated_at: new Date().toISOString()
        } : p
      ));
      fetchProducts(); // Re-fetch products after update
      setError(null);
    } catch (error: any) {
      console.error('Error updating product status:', error);
      setError(error.message);
    }
  };

  // Filter products based on search term
  const filteredProducts = products.filter(product => {
    return (
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage products for your stores
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link to="/store-manager/products/new">
            <Button variant="primary" className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-1" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {/* Store selector and search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <select
          value={selectedStore}
          onChange={(e) => setSelectedStore(e.target.value)}
          className="block w-full sm:w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
        >
          {managedStores.map(store => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>

        <div className="relative rounded-md flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            placeholder="Search products..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Button variant="secondary" onClick={fetchProducts}> {/* Added onClick for refresh */}
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading products...</p>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div 
              key={product.id} 
              className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200"
            >
              <div className="relative h-48 bg-gray-200">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <div className="flex space-x-1">
                    <Link 
                      to={`/store-manager/products/${product.id}/edit`}
                      className="p-1 bg-white rounded-full shadow hover:bg-gray-100"
                    >
                      <Edit className="h-4 w-4 text-green-600" />
                    </Link>
                    <button 
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-1 bg-white rounded-full shadow hover:bg-gray-100"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>
                {!product.in_stock && (
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  </div>
                  <PriceDisplay amount={product.price} />
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                    {product.category}
                  </span>
                  <button
                    onClick={() => handleToggleStock(product)}
                    className={`text-sm ${
                      product.in_stock 
                        ? 'text-green-600 hover:text-green-700' 
                        : 'text-red-600 hover:text-red-700'
                    }`}
                  >
                    {product.in_stock ? 'In Stock' : 'Out of Stock'}
                  </button>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Store: {(product as any).stores.name}
                </div>
                
                {/* Product Arrangements */}
                <div className="mt-4 border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Product Arrangements</h4>
                  
                  {/* Current Arrangements */}
                  <div className="space-y-2 mb-4">
                    {arrangements
                      .filter(arr => arr.product_id === product.id)
                      .map(arrangement => {
                        const category = categories.find(c => c.id === arrangement.category_id);
                        return (
                          <div key={arrangement.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <div>
                              <span className="font-medium">{category?.name}</span>
                              <span className="text-sm text-gray-500 ml-2">
                                Order: {arrangement.display_order}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setEditingArrangement(arrangement.id);
                                  setSelectedCategory(arrangement.category_id);
                                  setArrangementForm({
                                    display_order: arrangement.display_order,
                                    is_visible: arrangement.is_visible,
                                    starts_at: arrangement.starts_at || '',
                                    ends_at: arrangement.ends_at || ''
                                  });
                                }}
                                className="text-green-600 hover:text-green-800"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleRemoveArrangement(arrangement.id, product.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                    })}
                  </div>
                  
                  {/* Add/Edit Form */}
                  <div className="space-y-3 bg-gray-50 p-3 rounded">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                      >
                        <option value="">Select a category</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Display Order</label>
                      <input
                        type="number"
                        value={arrangementForm.display_order}
                        onChange={(e) => setArrangementForm(prev => ({ ...prev, display_order: parseInt(e.target.value) }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                      />
                    </div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={arrangementForm.is_visible}
                        onChange={(e) => setArrangementForm(prev => ({ ...prev, is_visible: e.target.checked }))}
                        className="h-4 w-4 text-green-600 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-900">Is Visible</span>
                    </label>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Starts At</label>
                      <input
                        type="datetime-local"
                        value={arrangementForm.starts_at}
                        onChange={(e) => setArrangementForm(prev => ({ ...prev, starts_at: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Ends At</label>
                      <input
                        type="datetime-local"
                        value={arrangementForm.ends_at}
                        onChange={(e) => setArrangementForm(prev => ({ ...prev, ends_at: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                      />
                    </div>
                    <Button 
                      onClick={() => handleArrangementSubmit(product.id, (product as any).stores.id)} 
                      variant="secondary"
                      className="w-full"
                    >
                      {editingArrangement ? 'Update Arrangement' : 'Add Arrangement'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center text-gray-500">
          No products found for the selected store.
        </div>
      )}
    </div>
  );
};

export default StoreManagerProducts;