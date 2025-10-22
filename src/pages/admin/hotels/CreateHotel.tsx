import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import ImageUpload from '../../../components/ui/ImageUpload';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

interface HotelFormData {
  name: string;
  description: string;
  logo_url: string;
  location: string;
  category: string;
  telegram_contact: string;
  phone_number: string;
  channel_url: string;
  username: string;
}

interface ManagerFormData {
  create_manager: boolean;
  manager_email: string;
  manager_password: string;
}

const HOTEL_CATEGORIES = [
  'Luxury',
  'Business',
  'Budget',
  'Boutique',
  'Resort',
  'Other'
];

const CreateHotel: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const usernameCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { isSuperAdmin } = useAuth();

  const [formData, setFormData] = useState<HotelFormData>({
    name: '',
    description: '',
    logo_url: '',
    location: '',
    category: '',
    telegram_contact: '',
    phone_number: '',
    channel_url: '',
    username: ''
  });

  const [managerData, setManagerData] = useState<ManagerFormData>({
    create_manager: false,
    manager_email: '',
    manager_password: ''
  });

  useEffect(() => {
    if (isSuperAdmin) {
      setManagerData(prev => ({ ...prev, create_manager: true }));
    }

    return () => {
      if (usernameCheckTimerRef.current) {
        clearTimeout(usernameCheckTimerRef.current);
      }
    };
  }, [isSuperAdmin]);

  const generateUsername = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const checkUsername = async (username: string): Promise<boolean> => {
    if (!username) return true;

    setCheckingUsername(true);
    try {
      const { data, error } = await supabase
        .from('hotels')
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

  const validateForm = () => {
    if (!formData.name.trim()) return 'Hotel name is required';
    if (!formData.username.trim()) return 'Username is required';
    if (!usernameAvailable) return 'Username is not available, please choose another one';
    if (checkingUsername) return 'Please wait while we check username availability';
    if (!formData.category) return 'Category is required';
    if (!formData.location.trim()) return 'Location is required';
    if (!formData.telegram_contact.trim()) return 'Telegram contact is required';

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

    return null;
  };

  const createHotelManager = async (hotelId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-hotel-manager`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            email: managerData.manager_email,
            password: managerData.manager_password,
            hotel_id: hotelId
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create manager');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error in createHotelManager:', error);
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

      const { data: hotel, error: hotelError } = await supabase
        .from('hotels')
        .insert([
          {
            ...formData,
            owner_id: user.id,
            is_active: true,
            approval_status: 'approved'
          }
        ])
        .select()
        .single();

      if (hotelError) throw hotelError;

      if (managerData.create_manager) {
        await createHotelManager(hotel.id);
      }

      navigate('/admin/hotels');
    } catch (error: any) {
      console.error('Error creating hotel:', error);
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
          onClick={() => navigate('/admin/hotels')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Hotels
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Create New Hotel</h1>
        <p className="mt-1 text-sm text-gray-500">
          Add a new hotel to your system
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Hotel Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Hotel Name"
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
                      : 'Username will be used in your hotel URL'
                  }
                  error={formData.username && !usernameAvailable ? 'This username is already taken' : undefined}
                />
                {formData.username && (
                  <p className="mt-1 text-sm text-gray-500">
                    Your hotel URL will be: /hotel/{formData.username}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hotel Logo
              </label>
              <ImageUpload
                value={formData.logo_url}
                onChange={handleImageChange}
                onError={setError}
                bucket="mall-images"
                folder="hotels"
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
                {HOTEL_CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Telegram Contact"
                name="telegram_contact"
                value={formData.telegram_contact}
                onChange={handleInputChange}
                required
                fullWidth
                placeholder="@username"
              />
              <Input
                label="Channel URL"
                name="channel_url"
                value={formData.channel_url}
                onChange={handleInputChange}
                fullWidth
                placeholder="https://t.me/channel"
              />
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
                  disabled={isSuperAdmin}
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
              onClick={() => navigate('/admin/hotels')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create Hotel
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default CreateHotel;
