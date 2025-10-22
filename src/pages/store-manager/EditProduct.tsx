import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ImageUpload from '../../components/ui/ImageUpload';
import { ArrowLeft } from 'lucide-react';

interface StoreManagerContext {
  store: any;
  storeId: string;
}

interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

const PRODUCT_CATEGORIES = [
  'Clothing',
  'Electronics',
  'Food & Beverages',
  'Home & Living',
  'Health & Beauty',
  'Sports & Leisure',
  'Books & Stationery',
  'Services',
  'Other'
];

const StoreManagerEditProduct: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { store, storeId } = useOutletContext<StoreManagerContext>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    category: '',
    stock_quantity: '0'
  });

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
    fetchProductCategories();
  }, [id, storeId]);

  const fetchProductCategories = async () => {
    setLoadingCategories(true);
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setProductCategories(data || []);
    } catch (err) {
      console.error('Error fetching product categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('store_id', storeId) // Ensure product belongs to current store
        .single();

      if (error) throw error;

      if (!data) {
        throw new Error('Product not found or you do not have permission to edit it');
      }

      setFormData({
        name: data.name,
        description: data.description || '',
        price: data.price.toString(),
        image_url: data.image_url || '',
        category: data.category,
        stock_quantity: data.stock_quantity.toString()
      });
    } catch (error: any) {
      console.error('Error fetching product:', error);
      setError(error.message);
      navigate('/store-manager/products');
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (url: string) => {
    setFormData(prev => ({
      ...prev,
      image_url: url
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Product name is required';
    if (!formData.category) return 'Category is required';
    if (!formData.price || parseFloat(formData.price) < 0) {
      return 'Please enter a valid price';
    }
    if (parseInt(formData.stock_quantity) < 0) {
      return 'Stock quantity cannot be negative';
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

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('products')
        .update({
          ...formData,
          price: parseFloat(formData.price),
          stock_quantity: parseInt(formData.stock_quantity),
          in_stock: parseInt(formData.stock_quantity) > 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('store_id', storeId); // Ensure we're only updating products for this store

      if (error) throw error;

      navigate('/store-manager/products');
    } catch (error: any) {
      console.error('Error updating product:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/store-manager/products')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update your product information
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            )}

            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-800">
              <p className="font-medium">Store: {store?.name}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Product Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                fullWidth
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                  required
                >
                  <option value="">Select a category</option>
                  {loadingCategories ? (
                    <option value="" disabled>Loading categories...</option>
                  ) : productCategories.length > 0 ? (
                    productCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))
                  ) : (
                    PRODUCT_CATEGORIES.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Image
              </label>
              <ImageUpload
                value={formData.image_url}
                onChange={handleImageChange}
                onError={setError}
                bucket="products"
                folder="products"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleInputChange}
                required
                fullWidth
              />

              <Input
                label="Stock Quantity"
                name="stock_quantity"
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={handleInputChange}
                required
                fullWidth
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/store-manager/products')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default StoreManagerEditProduct;