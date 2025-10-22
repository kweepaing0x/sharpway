import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import ImageUpload from '../../../components/ui/ImageUpload';
import { ArrowLeft, Clock, Mail, Lock } from 'lucide-react';
import { useTimeZoneStore } from '../../../stores/useTimeZoneStore';
import { TIME_ZONES, convertTimeToTimeZone } from '../../../utils/timeZoneUtils';
import { useAuth } from '../../../contexts/AuthContext';

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

interface ManagerFormData {
  create_manager: boolean;
  manager_email: string;
  manager_password: string;
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

const CreateStore: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>(DEFAULT_HOURS);
  const { adminTimeZone } = useTimeZoneStore();
  const usernameCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { isSuperAdmin } = useAuth();
  const [storeCategories, setStoreCategories] = useState<StoreCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

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
  
  const [managerData, setManagerData] = useState<ManagerFormData>({
    create_manager: false,
    manager_email: '',
    manager_password: ''
  });

  const [walletAddresses, setWalletAddresses] = useState({
    kpay: '',
    usdt: ''
  });

  useEffect(() => {
    if (isSuperAdmin) {
      setManagerData(prev => ({ ...prev, create_manager: true }));
    }

    checkAuth();
    fetchStoreCategories();
    
    return () => {
      if (usernameCheckTimerRef.current) {
        clearTimeout(usernameCheckTimerRef.current);
      }
    };
  }, [isSuperAdmin]);

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

  const checkAuth = async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      navigate('/admin/login', { replace: true });
    }
  };

  const generateUsername = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/\s+/g, '');
  };

  const checkUsername = async (username: string): Promise<boolean> => {
    if (!username) return true;
    
    setCheckingUsername(true);
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      const isAvailable = !data;
      setUsernameAvailable(isAvailable);
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking username:', error);
        return true;
      }
      
      return isAvailable;
    } catch (error) {
      console.error('Error checking username:', error);
      return true;
    } finally {
      setCheckingUsername(false);
    }
  };

  const debouncedCheckUsername = (username: string) => {
    if (usernameCheckTimerRef.current) {
      clearTimeout(usernameCheckTimerRef.current);
    }
    
    usernameCheckTimerRef.current = setTimeout(() => {
      checkUsername(username);
    }, 300);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      if (name === 'create_manager') {
        setManagerData(prev => ({
          ...prev,
          [name]: checkbox.checked
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          payment_methods: {
            ...prev.payment_methods,
            [name]: checkbox.checked
          }
        }));
      }
    } else if (name.startsWith('manager_')) {
      setManagerData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));

      if (name === 'name') {
        const username = generateUsername(value);
        setFormData(prev => ({ ...prev, username }));
        debouncedCheckUsername(username);
      }

      if (name === 'username') {
        debouncedCheckUsername(value);
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

  const validateForm = () => {
    if (!formData.name.trim()) return 'Store name is required';
    if (!formData.username.trim()) return 'Username is required';
    if (!usernameAvailable) return 'Username is not available, please choose another one';
    if (checkingUsername) return 'Please wait while we check username availability';
    if (!formData.category) return 'Category is required';
    if (!formData.location.trim()) return 'Location is required';
    
    if (formData.payment_methods.kpay && !walletAddresses.kpay) {
      return 'KPay wallet address is required when KPay is enabled';
    }
    if (formData.payment_methods.usdt && !walletAddresses.usdt) {
      return 'USDT wallet address is required when USDT is enabled';
    }
    
    if (managerData.create_manager) {
      if (!managerData.manager_email) {
        return 'Manager email is required';
      }
      if (!managerData.manager_password) {
        return 'Manager password is required';
      }
      if (managerData.manager_password.length < 6) {
        return 'Manager password must be at least 6 characters';
      }
    }
    
    return validateHours(workingHours);
  };

  const createStoreManager = async (storeId: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Supabase URL or Anon Key is not defined in environment variables.');
        throw new Error('Supabase environment variables are missing.');
      }

      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/create-manager`;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      };
      const body = JSON.stringify({
        email: managerData.manager_email,
        password: managerData.manager_password,
        store_id: storeId
      });

      console.log('Attempting to call create-manager edge function:');
      console.log('URL:', edgeFunctionUrl);
      console.log('Headers:', headers);
      console.log('Body:', body);

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: headers,
        body: body,
      });

      console.log('Response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text(); // Get raw text to avoid JSON parsing issues
        console.error('Raw error response from edge function:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || `Failed to create manager: ${response.statusText}`);
        } catch (parseError) {
          throw new Error(`Failed to create manager: ${response.statusText}. Raw response: ${errorText}`);
        }
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error in createStoreManager:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError(null);
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    const isUsernameAvailable = await checkUsername(formData.username);
    if (!isUsernameAvailable) {
      setError('Username is not available. Please choose a different one.');
      return;
    }

    setLoading(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error('Authentication error');
      if (!user) {
        navigate('/admin/login', { replace: true });
        return;
      }

      const payment_methods = {
        ...formData.payment_methods,
        wallet_addresses: {
          kpay: formData.payment_methods.kpay ? walletAddresses.kpay : '',
          usdt: formData.payment_methods.usdt ? walletAddresses.usdt : ''
        }
      };

      const { data: store, error: storeError } = await supabase
        .from('stores')
        .insert([
          {
            ...formData,
            payment_methods,
            owner_id: user.id,
            is_active: true,
            approval_status: 'approved'
          }
        ])
        .select()
        .single();

      if (storeError) throw storeError;

      const mmtHours = workingHours.map(hours => ({
        ...hours,
        opens_at: adminTimeZone === TIME_ZONES.MMT 
          ? hours.opens_at 
          : convertTimeToTimeZone(hours.opens_at, adminTimeZone, TIME_ZONES.MMT),
        closes_at: adminTimeZone === TIME_ZONES.MMT
          ? hours.closes_at
          : convertTimeToTimeZone(hours.closes_at, adminTimeZone, TIME_ZONES.MMT),
        store_id: store.id
      }));

      const { error: hoursError } = await supabase
        .from('store_hours')
        .insert(mmtHours);

      if (hoursError) throw hoursError;

      if (managerData.create_manager) {
        await createStoreManager(store.id);
      }

      navigate('/admin/stores');
    } catch (error: any) {
      console.error('Error creating store:', error);
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
        <h1 className="text-2xl font-bold text-gray-900">Create New Store</h1>
        <p className="mt-1 text-sm text-gray-500">
          Add a new store to your mall
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

            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Store Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                fullWidth
              />

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
                fullWidth
              />
              <Input
                label="Phone Number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                fullWidth
              />
            </div>

            <Input
              label="Telegram Channel Link"
              name="channel_link"
              value={formData.channel_link}
              onChange={handleInputChange}
              fullWidth
              placeholder="e.g., https://t.me/yourchannel"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <h3 className="text-lg font-medium text-gray-900 mt-6">Payment Methods</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="kpay"
                  checked={formData.payment_methods.kpay}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-900">KPay</span>
              </label>
              {formData.payment_methods.kpay && (
                <Input
                  label="KPay Wallet Address"
                  name="kpay"
                  value={walletAddresses.kpay}
                  onChange={handleWalletAddressChange}
                  fullWidth
                  required
                />
              )}
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="usdt"
                  checked={formData.payment_methods.usdt}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-900">USDT</span>
              </label>
              {formData.payment_methods.usdt && (
                <Input
                  label="USDT Wallet Address"
                  name="usdt"
                  value={walletAddresses.usdt}
                  onChange={handleWalletAddressChange}
                  fullWidth
                  required
                />
              )}
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="cod"
                  checked={formData.payment_methods.cod}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-900">Cash on Delivery (COD)</span>
              </label>
            </div>

            <h3 className="text-lg font-medium text-gray-900 mt-6">Working Hours</h3>
            <div className="space-y-4">
              {DAYS_OF_WEEK.map((day, index) => (
                <div key={day.value} className="flex items-center space-x-4">
                  <div className="w-24 text-sm font-medium text-gray-700">
                    {day.label}
                  </div>
                  <input
                    type="checkbox"
                    checked={workingHours[index].is_closed}
                    onChange={(e) => handleHoursChange(index, 'is_closed', e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-900">Closed</span>
                  {!workingHours[index].is_closed && (
                    <>
                      <Input
                        type="time"
                        value={workingHours[index].opens_at}
                        onChange={(e) => handleHoursChange(index, 'opens_at', e.target.value)}
                        className="w-32"
                      />
                      <span className="text-sm text-gray-500">to</span>
                      <Input
                        type="time"
                        value={workingHours[index].closes_at}
                        onChange={(e) => handleHoursChange(index, 'closes_at', e.target.value)}
                        className="w-32"
                      />
                    </>
                  )}
                </div>
              ))}
            </div>

            <h3 className="text-lg font-medium text-gray-900 mt-6">Manager Account</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="create_manager"
                  checked={managerData.create_manager}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  disabled={isSuperAdmin} // Disable if superadmin, as it's always true
                />
                <span className="ml-2 text-sm text-gray-900">Create Manager Account</span>
              </label>
              {managerData.create_manager && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <Input
                    label="Manager Email"
                    name="manager_email"
                    type="email"
                    value={managerData.manager_email}
                    onChange={handleInputChange}
                    required
                    fullWidth
                  />
                  <Input
                    label="Manager Password"
                    name="manager_password"
                    type="password"
                    value={managerData.manager_password}
                    onChange={handleInputChange}
                    required
                    fullWidth
                  />
                </div>
              )}
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
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create Store
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default CreateStore;