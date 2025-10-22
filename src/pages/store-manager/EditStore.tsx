import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ImageUpload from '../../components/ui/ImageUpload';
import { ArrowLeft, Clock } from 'lucide-react';
import { useTimeZoneStore } from '../../stores/useTimeZoneStore';
import { TIME_ZONES, formatTime, convertTimeToTimeZone } from '../../utils/timeZoneUtils';

interface StoreEditContextType {
  store: any;
  storeId: string;
}

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

const StoreManagerEditStore: React.FC = () => {
  const { store, storeId } = useOutletContext<StoreEditContextType>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>(DEFAULT_HOURS);
  const { adminTimeZone } = useTimeZoneStore();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo_url: '',
    location: '',
    floor: 1,
    category: '',
    username: '',
    phone_number: '',
    channel_link: ''
  });

  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name,
        description: store.description || '',
        logo_url: store.logo_url || '',
        location: store.location,
        floor: store.floor,
        category: store.category,
        username: store.username || '',
        phone_number: store.phone_number || '',
        channel_link: store.channel_link || ''
      });
      
      fetchWorkingHours();
    }
  }, [store]);

  const fetchWorkingHours = async () => {
    try {
      const { data, error } = await supabase
        .from('store_hours')
        .select('*')
        .eq('store_id', storeId)
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
      setError(error.message);
    }
  };
  
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (name === 'floor') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 1
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageChange = (url: string) => {
    setFormData(prev => ({
      ...prev,
      logo_url: url
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
        .eq('store_id', storeId);

      // Convert hours back to MMT for storage
      const mmtHours = workingHours.map(hours => ({
        ...hours,
        opens_at: adminTimeZone === TIME_ZONES.MMT 
          ? hours.opens_at 
          : convertTimeToTimeZone(hours.opens_at, adminTimeZone, TIME_ZONES.MMT),
        closes_at: adminTimeZone === TIME_ZONES.MMT
          ? hours.closes_at
          : convertTimeToTimeZone(hours.closes_at, adminTimeZone, TIME_ZONES.MMT),
        store_id: storeId
      }));

      // Insert new hours
      const { error } = await supabase
        .from('store_hours')
        .insert(mmtHours);

      if (error) throw error;

      setSuccess('Working hours updated successfully');
    } catch (error: any) {
      console.error('Error saving working hours:', error);
      setError('Failed to update working hours: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Store name is required';
    if (!formData.category) return 'Category is required';
    if (!formData.location.trim()) return 'Location is required';
    if (formData.floor < 1) return 'Floor must be greater than 0';
    
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
    setSuccess(null);

    try {
      const { error } = await supabase
        .from('stores')
        .update({
          name: formData.name,
          description: formData.description,
          logo_url: formData.logo_url,
          location: formData.location,
          floor: formData.floor,
          category: formData.category,
          phone_number: formData.phone_number,
          channel_link: formData.channel_link,
          updated_at: new Date().toISOString()
        })
        .eq('id', storeId);

      if (error) throw error;

      setSuccess('Store updated successfully');

      // Update the store data in the parent component
      // This would typically be handled by a context or state management
      setTimeout(() => {
        window.location.reload();
      }, 1500);
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
          onClick={() => navigate('/storemanager')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
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
            
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
                {success}
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
                  {STORE_CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <p className="text-sm text-gray-500 mb-2">
                @{formData.username} (Cannot be changed by store managers)
              </p>
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

              <Input
                label="Floor"
                name="floor"
                type="number"
                min={1}
                value={formData.floor}
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

            <div className="mt-4 bg-yellow-50 border border-yellow-100 rounded-md p-4">
              <h3 className="text-sm font-medium text-yellow-800">Note</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Payment methods and notification settings can only be managed by the store owner or admin.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/storemanager')}
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
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-600">Closed</span>
                </label>

                {!hours.is_closed && (
                  <>
                    <input
                      type="time"
                      value={hours.opens_at}
                      onChange={(e) => handleHoursChange(index, 'opens_at', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="time"
                      value={hours.closes_at}
                      onChange={(e) => handleHoursChange(index, 'closes_at', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
              className="bg-green-600 hover:bg-green-700"
            >
              Save Working Hours
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StoreManagerEditStore;