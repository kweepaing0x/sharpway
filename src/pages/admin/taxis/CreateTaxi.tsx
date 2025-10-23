import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import ImageUpload from '../../../components/ui/ImageUpload';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

interface TaxiFormData {
  driver_name: string;
  description: string;
  photo_url: string;
  vehicle_type: string;
  phone_number: string;
  telegram_contact: string;
  location: string;
  username: string;
  availability_status: boolean;
}

interface ManagerFormData {
  create_manager: boolean;
  manager_email: string;
  manager_password: string;
}

const VEHICLE_TYPES = ['motorcycle', 'car'];

const CreateTaxi: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const usernameCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { isSuperAdmin } = useAuth();

  const [formData, setFormData] = useState<TaxiFormData>({
    driver_name: '',
    description: '',
    photo_url: '',
    vehicle_type: '',
    phone_number: '',
    telegram_contact: '',
    location: '',
    username: '',
    availability_status: true
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
        .from('taxis')
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
      } else if (name === 'availability_status') {
        setFormData(prev => ({
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

      if (name === 'driver_name') {
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
      photo_url: url
    }));
  };

  const validateForm = () => {
    if (!formData.driver_name.trim()) return 'Driver name is required';
    if (!formData.username.trim()) return 'Username is required';
    if (!usernameAvailable) return 'Username is not available, please choose another one';
    if (checkingUsername) return 'Please wait while we check username availability';
    if (!formData.vehicle_type) return 'Vehicle type is required';
    if (!formData.location.trim()) return 'Location is required';
    if (!formData.phone_number.trim()) return 'Phone number is required';
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

  const createTaxiManager = async (taxiId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-taxi-manager`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            email: managerData.manager_email,
            password: managerData.manager_password,
            taxi_id: taxiId
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create manager');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error in createTaxiManager:', error);
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

      const { data: taxi, error: taxiError } = await supabase
        .from('taxis')
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

      if (taxiError) throw taxiError;

      if (managerData.create_manager) {
        await createTaxiManager(taxi.id);
      }

      navigate('/admin/taxis');
    } catch (error: any) {
      console.error('Error creating taxi:', error);
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
          onClick={() => navigate('/admin/taxis')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Taxis
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Add New Taxi Driver</h1>
        <p className="mt-1 text-sm text-gray-500">
          Add a new taxi driver to your system
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Taxi Driver Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Driver Name"
                name="driver_name"
                value={formData.driver_name}
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
                      : 'Username will be used in your taxi profile URL'
                  }
                  error={formData.username && !usernameAvailable ? 'This username is already taken' : undefined}
                />
                {formData.username && (
                  <p className="mt-1 text-sm text-gray-500">
                    Your taxi profile URL will be: /taxi/{formData.username}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Driver Photo
              </label>
              <ImageUpload
                value={formData.photo_url}
                onChange={handleImageChange}
                onError={setError}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Brief description about the driver and services..."
              />
            </div>

            <div>
              <label htmlFor="vehicle_type" className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Type <span className="text-red-500">*</span>
              </label>
              <select
                name="vehicle_type"
                value={formData.vehicle_type}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Select vehicle type</option>
                {VEHICLE_TYPES.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              required
              fullWidth
              placeholder="e.g., Yangon, Mandalay"
            />

            <Input
              label="Phone Number"
              name="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={handleInputChange}
              required
              fullWidth
              placeholder="+95 9 123 456 789"
            />

            <Input
              label="Telegram Contact"
              name="telegram_contact"
              value={formData.telegram_contact}
              onChange={handleInputChange}
              required
              fullWidth
              placeholder="@username or t.me/username"
              helperText="Enter your Telegram username or link"
            />

            <div className="flex items-center">
              <input
                type="checkbox"
                name="availability_status"
                checked={formData.availability_status}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="availability_status" className="ml-2 block text-sm text-gray-700">
                Available for booking
              </label>
            </div>

            {isSuperAdmin && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Manager Account (Optional)</h3>
                
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    name="create_manager"
                    checked={managerData.create_manager}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="create_manager" className="ml-2 block text-sm text-gray-700">
                    Create a manager account for this taxi
                  </label>
                </div>

                {managerData.create_manager && (
                  <div className="space-y-4 pl-6 border-l-2 border-blue-200">
                    <Input
                      label="Manager Email"
                      name="manager_email"
                      type="email"
                      value={managerData.manager_email}
                      onChange={handleInputChange}
                      required={managerData.create_manager}
                      fullWidth
                      placeholder="manager@example.com"
                    />

                    <Input
                      label="Manager Password"
                      name="manager_password"
                      type="password"
                      value={managerData.manager_password}
                      onChange={handleInputChange}
                      required={managerData.create_manager}
                      fullWidth
                      placeholder="Minimum 6 characters"
                      helperText="Manager will use this to log in and manage the taxi"
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/admin/taxis')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading || checkingUsername}
            >
              {loading ? 'Creating...' : 'Create Taxi Driver'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default CreateTaxi;

