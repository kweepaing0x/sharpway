import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Store, Layout, ShoppingBag, DollarSign, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    storeCount: 0,
    productCount: 0,
    activeStores: 0,
    topCategories: [] as { category: string, count: number }[]
  });

  useEffect(() => {
    const fetchStats = async () => {
      // In a real app, you would fetch actual data from Supabase
      // For now, we'll use placeholder data
      
      try {
        // Example of how you would fetch real data:
        // const { data: stores, error: storesError } = await supabase
        //   .from('stores')
        //   .select('*');
        
        // if (storesError) throw storesError;
        
        // Placeholder data
        setStats({
          storeCount: 24,
          productCount: 1287,
          activeStores: 22,
          topCategories: [
            { category: 'Fashion', count: 8 },
            { category: 'Food', count: 6 },
            { category: 'Electronics', count: 5 },
            { category: 'Home', count: 3 }
          ]
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome to your mall management dashboard
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Stores */}
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 truncate">
                Total Stores
              </p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {stats.storeCount}
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <Store className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        {/* Total Products */}
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

        {/* Active Stores */}
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 truncate">
                Active Stores
              </p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {stats.activeStores}/{stats.storeCount}
              </p>
            </div>
            <div className="bg-indigo-100 rounded-full p-3">
              <Layout className="h-6 w-6 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        {/* Revenue (Placeholder) */}
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 truncate">
                Monthly Revenue
              </p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                $124,675
              </p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Analytics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Store Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Store Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {stats.topCategories.map((category, index) => (
                <li key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{category.category}</span>
                  <div className="relative w-full max-w-xs h-2 bg-gray-200 rounded ml-3">
                    <div 
                      className="absolute h-2 bg-blue-500 rounded" 
                      style={{ 
                        width: `${(category.count / Math.max(...stats.topCategories.map(c => c.count))) * 100}%`
                      }}
                    />
                  </div>
                  <span className="ml-3 text-sm text-gray-500">{category.count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'New store added', name: 'Fashion Trends', time: '2 hours ago' },
                { action: 'Product updated', name: 'Premium Headphones', time: '5 hours ago' },
                { action: 'Store deactivated', name: 'Temp Pop-Up Shop', time: '1 day ago' },
                { action: 'New products added', name: 'Electronics Hub', time: '2 days ago' },
              ].map((activity, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <div className="flex text-xs text-gray-500">
                      <p>{activity.name}</p>
                      <span className="mx-1">•</span>
                      <p>{activity.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;