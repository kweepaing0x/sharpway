import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import { Plus, Search, Filter, Edit, Trash2, AlertCircle } from 'lucide-react';
import Button from '../../../components/ui/Button';

interface Hotel {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  location: string;
  category: string;
  channel_url: string;
  telegram_contact: string;
  phone_number: string;
  is_active: boolean;
  approval_status: string;
  username: string;
  display_order: number | null;
}

const HotelsList: React.FC = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [deletingHotel, setDeletingHotel] = useState<string | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const fetchHotels = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('hotels')
        .select('*')
        .order('display_order', { ascending: true, nullsLast: true })
        .order('name');

      if (error) throw error;

      setHotels(data || []);

      const { count, error: countError } = await supabase
        .from('hotels')
        .select('*', { count: 'exact' })
        .eq('approval_status', 'pending');

      if (countError) throw countError;

      setPendingCount(count || 0);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching hotels:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpdateDisplayOrder = async (hotelId: string, order: number | null) => {
    setUpdatingOrder(hotelId);
    try {
      const { error } = await supabase
        .from('hotels')
        .update({ display_order: order })
        .eq('id', hotelId);

      if (error) throw error;

      setHotels(prevHotels =>
        prevHotels.map(h =>
          h.id === hotelId ? { ...h, display_order: order } : h
        )
      );
      setError(null);
    } catch (error: any) {
      console.error('Error updating display order:', error);
      setError(error.message);
      await fetchHotels();
    } finally {
      setUpdatingOrder(null);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  const deleteHotelManagers = async (hotelId: string) => {
    try {
      const { data: managers, error: fetchError } = await supabase
        .from('hotel_managers')
        .select('id, user_id')
        .eq('hotel_id', hotelId);

      if (fetchError) throw fetchError;

      for (const manager of managers || []) {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-hotel-manager`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              userId: manager.user_id,
              managerId: manager.id
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error deleting manager:', errorData);
        }
      }

      return true;
    } catch (error) {
      console.error('Error deleting hotel managers:', error);
      return false;
    }
  };

  const handleDeleteHotel = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this hotel? This will also delete all associated hotel managers.')) return;

    setDeletingHotel(id);
    setError(null);

    try {
      const managersDeleted = await deleteHotelManagers(id);

      if (!managersDeleted) {
        console.warn('Some managers may not have been deleted properly');
      }

      const { error } = await supabase
        .from('hotels')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setHotels(prevHotels => prevHotels.filter(hotel => hotel.id !== id));
      setError(null);
    } catch (error: any) {
      console.error('Error deleting hotel:', error);
      setError(`Failed to delete hotel: ${error.message}. If this problem persists, please contact support.`);
      await fetchHotels();
    } finally {
      setDeletingHotel(null);
    }
  };

  const handleToggleStatus = async (hotel: Hotel) => {
    setUpdatingStatus(hotel.id);
    setError(null);

    try {
      const newStatus = !hotel.is_active;

      const { error } = await supabase
        .from('hotels')
        .update({ is_active: newStatus })
        .eq('id', hotel.id);

      if (error) throw error;

      setHotels(prevHotels =>
        prevHotels.map(h =>
          h.id === hotel.id ? { ...h, is_active: newStatus } : h
        )
      );
      setError(null);
    } catch (error: any) {
      console.error('Error updating hotel status:', error);
      setError(error.message);
      await fetchHotels();
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filteredHotels = hotels.filter(hotel =>
    hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hotel.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hotel.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hotels</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage all hotels in your system
          </p>
        </div>
        <div className="mt-4 sm:mt-0 space-y-2 sm:space-y-0 sm:space-x-2">
          {pendingCount > 0 && (
            <Link to="/admin/hotels/approval">
              <Button variant="secondary" className="w-full sm:w-auto">
                <AlertCircle className="h-4 w-4 mr-1 text-yellow-500" />
                Review Pending ({pendingCount})
              </Button>
            </Link>
          )}
          <Link to="/admin/hotels/new">
            <Button variant="primary" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-1" />
              Add Hotel
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

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative rounded-md flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            placeholder="Search hotels..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Button variant="secondary">
          <Filter className="h-4 w-4 mr-1" />
          Filter
        </Button>

        <Button
          variant="secondary"
          onClick={fetchHotels}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <div className="bg-white shadow-md overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading hotels...</p>
          </div>
        ) : filteredHotels.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hotel
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Display Order
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredHotels.map((hotel) => (
                  <tr key={hotel.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {hotel.logo_url ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={hotel.logo_url}
                              alt={hotel.name}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-medium">
                                {hotel.name.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {hotel.name}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {hotel.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="1"
                          max="999"
                          value={hotel.display_order || ''}
                          onChange={(e) => handleUpdateDisplayOrder(hotel.id, parseInt(e.target.value) || null)}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Order"
                          disabled={updatingOrder === hotel.id}
                        />
                        {hotel.display_order && hotel.display_order <= 10 && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {hotel.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {hotel.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleStatus(hotel)}
                          disabled={updatingStatus === hotel.id}
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            updatingStatus === hotel.id
                              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                              : hotel.is_active
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {updatingStatus === hotel.id ? (
                            <span className="flex items-center">
                              <div className="animate-spin h-3 w-3 border-b-2 border-gray-500 rounded-full mr-1"></div>
                              Updating...
                            </span>
                          ) : (
                            hotel.is_active ? 'Active' : 'Inactive'
                          )}
                        </button>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          hotel.approval_status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : hotel.approval_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {hotel.approval_status.charAt(0).toUpperCase() + hotel.approval_status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/admin/hotels/${hotel.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit"
                        >
                          <Edit className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteHotel(hotel.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                          disabled={deletingHotel === hotel.id}
                        >
                          {deletingHotel === hotel.id ? (
                            <div className="animate-spin h-5 w-5 border-b-2 border-red-500 rounded-full"></div>
                          ) : (
                            <Trash2 className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            No hotels found matching your search criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelsList;
