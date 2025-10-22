import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import { Product, ProductCategory, ProductArrangement } from '../../../types';
import { Plus, Search, Filter, Edit, Trash2, Eye, SlidersHorizontal, RefreshCw } from 'lucide-react';
import Button from '../../../components/ui/Button';
import PriceDisplay from '../../../components/PriceDisplay';

const ProductsList: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [stores, setStores] = useState<any[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [arrangements, setArrangements] = useState<ProductArrangement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [editingArrangement, setEditingArrangement] = useState<string | null>(null);
  const [updatingStock, setUpdatingStock] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null);
  const [arrangementForm, setArrangementForm] = useState({
    display_order: 0,
    is_visible: true,
    starts_at: '',
    ends_at: ''
  });

  const fetchCategories = useCallback(async () => {
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
  }, []);

  const fetchArrangements = useCallback(async (productId: string) => {
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
  }, []);

  const fetchStoresAndProducts = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      
      // Fetch all stores for admin
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('id, name')
        .order('name');

      if (storesError) throw storesError;
      setStores(storesData || []);

      // Fetch all products for admin
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          stores!inner(
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;
      setProducts(productsData || []);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check authentication and fetch products and stores
  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) throw authError;
        if (!user) {
          navigate('/admin/login');
          return;
        }

        await fetchStoresAndProducts(user.id);
      } catch (error: any) {
        console.error('Authentication error:', error);
        navigate('/admin/login');
      }
    };

    checkAuthAndFetchData();
  }, [navigate, fetchStoresAndProducts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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

    setDeletingProduct(id);
    setError(null);

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state immediately
      setProducts(prevProducts => prevProducts.filter(product => product.id !== id));
      setError(null);
    } catch (error: any) {
      console.error('Error deleting product:', error);
      setError(error.message);
      // Refresh data on error to ensure consistency
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await fetchStoresAndProducts(user.id);
    } finally {
      setDeletingProduct(null);
    }
  };

  // Toggle product stock status
  const handleToggleStock = async (product: Product) => {
    setUpdatingStock(product.id);
    setError(null);
    
    try {
      const newStockStatus = !product.in_stock;
      
      const { error } = await supabase
        .from('products')
        .update({ 
          in_stock: newStockStatus,
          stock_quantity: newStockStatus ? 1 : 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id);

      if (error) throw error;

      // Update local state immediately
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p.id === product.id ? { 
            ...p, 
            in_stock: newStockStatus,
            stock_quantity: newStockStatus ? 1 : 0,
            updated_at: new Date().toISOString()
          } : p
        )
      );
      setError(null);
    } catch (error: any) {
      console.error('Error updating product status:', error);
      setError(error.message);
      // Refresh data on error to ensure consistency
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await fetchStoresAndProducts(user.id);
    } finally {
      setUpdatingStock(null);
    }
  };

  // Filter products based on search term and selected store
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStore = !selectedStore || product.store_id === selectedStore;
    
    return matchesSearch && matchesStore;
  });

  const refreshData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await fetchStoresAndProducts(user.id);
      await fetchCategories();
    }
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage all products across your stores
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link to="/admin/products/new">
            <Button variant="primary">
              <Plus className="h-4 w-4 mr-1" />
              Add Product
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
            placeholder="Search products..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select
          value={selectedStore}
          onChange={(e) => setSelectedStore(e.target.value)}
          className="block w-full sm:w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value="">All Stores</option>
          {stores.map(store => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>

        <Button variant="secondary">
          <SlidersHorizontal className="h-4 w-4 mr-1" />
          More Filters
        </Button>
        
        <Button 
          variant="secondary" 
          onClick={refreshData}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
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
                      to={`/admin/products/${product.id}/edit`}
                      className="p-1 bg-white rounded-full shadow hover:bg-gray-100"
                    >
                      <Edit className="h-4 w-4 text-blue-600" />
                    </Link>
                    <button 
                      onClick={() => handleDeleteProduct(product.id)}
                      disabled={deletingProduct === product.id}
                      className="p-1 bg-white rounded-full shadow hover:bg-gray-100 disabled:opacity-50"
                    >
                      {deletingProduct === product.id ? (
                        <div className="animate-spin h-4 w-4 border-b-2 border-red-600 rounded-full"></div>
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-600" />
                      )}
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
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                    {product.category}
                  </span>
                  <button
                    onClick={() => handleToggleStock(product)}
                    disabled={updatingStock === product.id}
                    className={`text-sm ${
                      updatingStock === product.id
                        ? 'text-gray-500 cursor-not-allowed'
                        : product.in_stock 
                        ? 'text-green-600 hover:text-green-700' 
                        : 'text-red-600 hover:text-red-700'
                    }`}
                  >
                    {updatingStock === product.id ? (
                      <span className="flex items-center">
                        <div className="animate-spin h-3 w-3 border-b-2 border-current rounded-full mr-1"></div>
                        Updating...
                      </span>
                    ) : (
                      product.in_stock ? 'In Stock' : 'Out of Stock'
                    )}
                  </button>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Store: {(product as any).stores.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center text-gray-500">
          No products found matching your search criteria.
        </div>
      )}
    </div>
  );
};

export default ProductsList;

