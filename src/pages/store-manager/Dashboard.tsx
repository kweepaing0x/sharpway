import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { ShoppingBag, DollarSign, Clock, Users, BarChart2 } from 'lucide-react';
import { isStoreOpen, formatTime } from '../../utils/timeZoneUtils';

interface DashboardContextType {
  store: any;
  storeId: string;
}

const StoreManagerDashboard: React.FC = () => {
  const { store, storeId } = useOutletContext<DashboardContextType>();
  const [stats, setStats] = useState({
    productCount: 0,
    orders: {
      total: 0,
      pending: 0,
      completed: 0
    },
    topProducts: [] as any[]
  });
  const [workingHours, setWorkingHours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (storeId) {
      fetchStats();
      fetchWorkingHours();
    }
  }, [storeId]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch product count
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('store_id', storeId);
      
      if (productsError) throw productsError;

      // In a real app, you'd fetch all these stats from the database
      // For now, we'll use placeholder data
      setStats({
        productCount: products?.length || 0,
        orders: {
          total: 24,
          pending: 3,
          completed: 21
        },
        topProducts: [
          { name: 'Premium T-Shirt', quantity: 45 },
          { name: 'Slim Fit Jeans', quantity: 32 },
          { name: 'Winter Jacket', quantity: 28 },
          { name: 'Running Shoes', quantity: 25 }
        ]
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkingHours = async () => {
    try {
      const { data, error } = await supabase
        .from('store_hours')
        .select('*')
        .eq('store_id', storeId)
        .order('day_of_week');

      if (error) throw error;
      
      const processedData = data?.map(hour => ({
        ...hour,
        opens_at: hour.opens_at?.slice(0, 5),
        closes_at: hour.closes_at?.slice(0, 5)
      })) || [];
      
      setWorkingHours(processedData);
    } catch (error) {
      console.error('Error fetching working hours:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
        <p className="mt-4 text-gray-500">Loading dashboard data...</p>
      </div>
    );
  }

  const storeIsOpen = isStoreOpen(workingHours);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome to your store management dashboard
        </p>
      </div>

      {/* Store Status */}
      <Card className={`${storeIsOpen ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <CardContent className="p-6">
          <div className="flex items-center">
            <Clock className={`h-6 w-6 ${storeIsOpen ? 'text-green-600' : 'text-red-600'} mr-3`} />
            <div>
              <h3 className="text-lg font-medium">
                Store Status: <span className={storeIsOpen ? 'text-green-700' : 'text-red-700'}>
                  {storeIsOpen ? 'Open' : 'Closed'}
                </span>
              </h3>
              {workingHours.length > 0 && !storeIsOpen && (
                <p className="text-sm mt-1">
                  Next opening: {(() => {
                    const now = new Date();
                    const today = now.getDay();
                    // Find the next day that's not closed
                    let nextOpenDay = workingHours.find(hours => 
                      (hours.day_of_week > today || (hours.day_of_week === today && hours.closes_at > now.toTimeString().slice(0, 5))) && 
                      !hours.is_closed
                    );
                    if (!nextOpenDay) {
                      // If not found, find the first opening day in the week
                      nextOpenDay = workingHours.find(hours => !hours.is_closed);
                    }
                    if (nextOpenDay) {
                      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                      return `${days[nextOpenDay.day_of_week]} ${formatTime(nextOpenDay.opens_at)}`;
                    }
                    return 'Not available';
                  })()}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Products */}
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 truncate">
                Total Products
              </p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {stats.productCount}
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <ShoppingBag className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        {/* Orders */}
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 truncate">
                Pending Orders
              </p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {stats.orders.pending}
              </p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 truncate">
                Monthly Revenue
              </p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                ฿{(54750).toLocaleString()}
              </p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Store Hours */}
      <Card>
        <CardHeader>
          <CardTitle>Working Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workingHours.map((hours: any) => {
              const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][hours.day_of_week];
              return (
                <div key={hours.id} className="flex justify-between py-2 border-b border-gray-100">
                  <span className="font-medium">{dayName}</span>
                  <span>
                    {hours.is_closed ? (
                      <span className="text-red-600">Closed</span>
                    ) : (
                      `${formatTime(hours.opens_at)} - ${formatTime(hours.closes_at)}`
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {stats.topProducts.map((product, index) => (
              <li key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium">{product.name}</span>
                <div className="flex items-center space-x-2">
                  <div className="relative w-32 h-2 bg-gray-200 rounded">
                    <div 
                      className="absolute h-2 bg-green-500 rounded" 
                      style={{ 
                        width: `${(product.quantity / Math.max(...stats.topProducts.map(p => p.quantity))) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-500">{product.quantity} sold</span>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default StoreManagerDashboard;