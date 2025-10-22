import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import ImageUpload from '../../../components/ui/ImageUpload';
import { ArrowLeft, Clock } from 'lucide-react';
import { useTimeZoneStore } from '../../../stores/useTimeZoneStore';
import { TIME_ZONES, formatTime, convertTimeToTimeZone } from '../../../utils/timeZoneUtils';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

interface WorkingHours {
  id?: string;
  day_of_week: number;
  opens_at: string;
  closes_at: string;
  is_closed: boolean;
}

const DEFAULT_HOURS: WorkingHours[] = DAYS_OF_WEEK.map(day => ({
  day_of_week: day.value,
  opens_at: '10:00',
  closes_at: '22:00',
  is_closed: false
}));

interface StoreFormData {
  name: string;
  description: string;
  logo_url: string;
  location: string;
  category: string;
  telegram_bot_token: string;
  telegram_chat_id: string;
  username: string;
  payment_methods: {
    kpay: boolean;
    usdt: boolean;
    cod: boolean;
    wallet_addresses: Record<string, string>;
  };
  phone_number: string;
  channel_link: string;
}

interface StoreCategory {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

const STORE_CATEGORIES = [
  'Fashion',
  'Electronics',
  'Food & Beverage',
  'Home & Living',
  'Health & Beauty',
  'Sports & Leisure',
  'Books & Stationery',
  'Services',
  'Other'
];

const EditStore: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>(DEFAULT_HOURS);
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const { adminTimeZone } = useTimeZoneStore();
  const [storeCategories, setStoreCategories] = useState<StoreCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Reset manager password
  const handleResetManagerPassword = async () => {
    if (!window.confirm('Are you sure you want to reset the store manager password? This will generate a new temporary password.')) {
      return;
    }

    setResettingPassword(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-manager-password`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ storeId: id }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password');
      }

      setSuccess('Manager password has been reset successfully. The new temporary password has been sent to the manager.');
    } catch (error: any) {
      console.error('Error resetting manager password:', error);
      setError(`Failed to reset manager password: ${error.message}`);
    } finally {
      setResettingPassword(false);
    }
  };

  const [formData, setFormData] = useState<StoreFormData>({
    name: '',
    description: '',
    logo_url: '',
    location: '',
    category: '',
    telegram_bot_token: '',
    telegram_chat_id: '',
    username: '',
    payment_methods: {
      kpay: false,
      usdt: false,
      cod: false,
      wallet_addresses: {}
    },
    phone_number: '',
    channel_link: ''
  });

  const [walletAddresses, setWalletAddresses] = useState({
    kpay: '',
    usdt: ''
  });

  useEffect(() => {
    fetchStore();
    fetchWorkingHours();
    fetchStoreCategories();
  }, [id]);

  const fetchStoreCategories = async () => {
    setLoadingCategories(true);
    try {
      const { data, error } = await supabase
        .from('store_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setStoreCategories(data || []);
    } catch (err) {
      console.error('Error fetching store categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchWorkingHours = async () => {
    try {
      const { data, error } = await supabase
        .from('store_hours')
        .select('*')
        .eq('store_id', id)
        .order('day_of_week');

      if (error) throw error;

      if (data && data.length > 0) {
        // Display hours in admin's selected time zone
        const convertedHours = data.map((hour: any) => ({
          ...hour,
          opens_at: adminTimeZone === TIME_ZONES.MMT 
            ? hour.opens_at 
            : convertTimeToTimeZone(hour.opens_at, TIME_ZONES.MMT, adminTimeZone),
          closes_at: adminTimeZone === TIME_ZONES.MMT
            ? hour.closes_at
            : convertTimeToTimeZone(hour.closes_at, TIME_ZONES.MMT, adminTimeZone)
        }));
        setWorkingHours(convertedHours);
      }
    } catch (error: any) {
      console.error('Error fetching working hours:', error);
    }
  };

  const checkUsername = async (username: string, currentStoreId: string) => {
    if (!username) return;
    
    setCheckingUsername(true);
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('username')
        .eq('username', username)
        .neq('id', currentStoreId) // Exclude current store
        .single();

      setUsernameAvailable(!data);
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
    } catch (error) {
      console.error('Error checking username:', error);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleHoursChange = (index: number, field: keyof WorkingHours, value: string | boolean) => {
    setWorkingHours(prev => prev.map((hours, i) => 
      i === index ? { ...hours, [field]: value } : hours
    ));
  };

  const validateHours = (hours: WorkingHours[]) => {
    for (const hour of hours) {
      if (!hour.is_closed) {
        if (!hour.opens_at || !hour.closes_at) {
          return 'Opening and closing times are required for open days';
        }
      }
    }
    return null;
  };

  const fetchStore = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;

      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) {
        throw new Error('Store not found');
      }

      if (data.owner_id !== user?.id) {
        throw new Error('Unauthorized');
      }

      setFormData({
        name: data.name,
        description: data.description || '',
        logo_url: data.logo_url || '',
        location: data.location,
        category: data.category,
        telegram_bot_token: data.telegram_bot_token || '',
        telegram_chat_id: data.telegram_chat_id || '',
        username: data.username || '',
        payment_methods: {
          kpay: data.payment_methods.kpay || false,
          usdt: data.payment_methods.usdt || false,
          cod: data.payment_methods.cod || false,
          wallet_addresses: data.payment_methods.wallet_addresses || {}
        },
        phone_number: data.phone_number || '',
        channel_link: data.channel_link || ''
      });

      setWalletAddresses({
        kpay: data.payment_methods.wallet_addresses?.kpay || '',
        usdt: data.payment_methods.wallet_addresses?.usdt || ''
      });
    } catch (error: any) {
      console.error('Error fetching store:', error);
      setError(error.message);
      navigate('/admin/stores');
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        payment_methods: {
          ...prev.payment_methods,
          [name]: checkbox.checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      if (name === 'username') {
        checkUsername(value, id || '');
      }
    }
  };

  const handleImageChange = (url: string) => {
    setFormData(prev => ({
      ...prev,
      logo_url: url
    }));
  };

  const handleWalletAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setWalletAddresses(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveWorkingHours = async () => {
    const validationError = validateHours(workingHours);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Delete existing hours
      await supabase
        .from('store_hours')
        .delete()
        .eq('store_id', id);

      // Convert hours back to MMT for storage
      const mmtHours = workingHours.map(hours => ({
        ...hours,
        opens_at: adminTimeZone === TIME_ZONES.MMT 
          ? hours.opens_at 
          : convertTimeToTimeZone(hours.opens_at, adminTimeZone, TIME_ZONES.MMT),
        closes_at: adminTimeZone === TIME_ZONES.MMT
          ? hours.closes_at
          : convertTimeToTimeZone(hours.closes_at, adminTimeZone, TIME_ZONES.MMT),
        store_id: id
      }));

      // Insert new hours
      const { error } = await supabase
        .from('store_hours')
        .insert(mmtHours);

      if (error) throw error;

      setSuccess('Working hours updated successfully');
    } catch (error: any) {
      console.error('Error saving working hours:', error);
      setError('Failed to update working hours');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Store name is required';
    if (!formData.username.trim()) return 'Username is required';
    if (!usernameAvailable) return 'Username is not available';
    if (!formData.category) return 'Category is required';
    if (!formData.location.trim()) return 'Location is required';
    
    if (formData.payment_methods.kpay && !walletAddresses.kpay) {
      return 'KPay wallet address is required when KPay is enabled';
    }
    if (formData.payment_methods.usdt && !walletAddresses.usdt) {
      return 'USDT wallet address is required when USDT is enabled';
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
      const payment_methods = {
        ...formData.payment_methods,
        wallet_addresses: {
          kpay: formData.payment_methods.kpay ? walletAddresses.kpay : '',
          usdt: formData.payment_methods.usdt ? walletAddresses.usdt : ''
        }
      };

      const { error } = await supabase
        .from('stores')
        .update({
          ...formData,
          payment_methods,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      navigate('/admin/stores');
    } catch (error: any) {
      console.error('Error updating store:', error);
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
          onClick={() => navigate('/admin/stores')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Stores
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Store</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update your store information
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Store Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Store Name"
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
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  required
                >
                  <option value="">Select a category</option>
                  {loadingCategories ? (
                    <option value="" disabled>Loading categories...</option>
                  ) : storeCategories.length > 0 ? (
                    storeCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))
                  ) : (
                    STORE_CATEGORIES.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
            
            <div className="relative">
              <Input
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                fullWidth
                helperText={
                  checkingUsername
                    ? 'Checking availability...'
                    : formData.username
                    ? usernameAvailable
                      ? 'Username is available'
                      : 'Username is not available'
                    : 'Username will be used in your store URL'
                }
                error={formData.username && !usernameAvailable ? 'This username is already taken' : undefined}
              />
              {formData.username && (
                <p className="mt-1 text-sm text-gray-500">
                  Your store URL will be: /@{formData.username}
                </p>
              )}
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Store Logo
              </label>
              <ImageUpload
                value={formData.logo_url}
                onChange={handleImageChange}
                onError={setError}
                bucket="mall-images"
                folder="stores"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
                fullWidth
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Phone Number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                fullWidth
                helperText="Optional"
              />

              <Input
                label="Channel Link"
                name="channel_link"
                value={formData.channel_link}
                onChange={handleInputChange}
                fullWidth
                helperText="Optional - Social media or channel URL"
              />
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Store Manager Password Reset
              </h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  Use this feature to reset the store manager's password. A new temporary password will be generated and sent to the manager.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={handleResetManagerPassword}
                disabled={resettingPassword}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                {resettingPassword ? 'Resetting...' : 'Reset Manager Password'}
              </Button>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Telegram Integration
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Telegram Bot Token"
                  name="telegram_bot_token"
                  value={formData.telegram_bot_token}
                  onChange={handleInputChange}
                  fullWidth
                />

                <Input
                  label="Telegram Chat ID"
                  name="telegram_chat_id"
                  value={formData.telegram_chat_id}
                  onChange={handleInputChange}
                  fullWidth
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Payment Methods
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  {[
                    { key: 'kpay', label: 'KPay' },
                    { key: 'usdt', label: 'USDT' },
                    { key: 'cod', label: 'Cash on Delivery' }
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name={key}
                          checked={formData.payment_methods[key as keyof typeof formData.payment_methods]}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                      {(key === 'kpay' || key === 'usdt') && 
                        formData.payment_methods[key] && (
                        <Input
                          name={key}
                          value={walletAddresses[key as keyof typeof walletAddresses]}
                          onChange={handleWalletAddressChange}
                          placeholder={`Enter ${label} wallet address`}
                          className="mt-2"
                          required
                          fullWidth
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/admin/stores')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
            >
              Save Changes
            </Button>
          </CardFooter>
        </form>

        <CardHeader className="border-t">
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Working Hours (Myanmar Time)
            {adminTimeZone !== TIME_ZONES.MMT && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                Displayed in {adminTimeZone === TIME_ZONES.ICT ? 'Thailand Time' : adminTimeZone}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && !success && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
              {success}
            </div>
          )}

          <div className="bg-blue-50 p-4 mb-6 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> All working hours are stored in Myanmar Time (MMT), but displayed in your selected admin time zone.
              When you save changes, they'll be automatically converted back to Myanmar Time.
            </p>
          </div>

          <div className="space-y-4">
            {workingHours.map((hours, index) => (
              <div key={hours.day_of_week} className="flex items-center space-x-4">
                <div className="w-32">
                  <span className="font-medium">
                    {DAYS_OF_WEEK[hours.day_of_week].label}
                  </span>
                </div>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={hours.is_closed}
                    onChange={(e) => handleHoursChange(index, 'is_closed', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-600">Closed</span>
                </label>

                {!hours.is_closed && (
                  <>
                    <input
                      type="time"
                      value={hours.opens_at}
                      onChange={(e) => handleHoursChange(index, 'opens_at', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="time"
                      value={hours.closes_at}
                      onChange={(e) => handleHoursChange(index, 'closes_at', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Button
              variant="primary"
              onClick={saveWorkingHours}
              isLoading={loading}
            >
              Save Working Hours
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditStore;