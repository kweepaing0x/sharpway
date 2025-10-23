import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Store, Layout, ShoppingBag, DollarSign, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface Stats {
  storeCount: number;
  productCount: number;
  activeStores: number;
  totalRevenue: number;
  topCategories: { category: string; count: number }[];
}

interface RecentActivity {
  action: string;
  name: string;
  time: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    storeCount: 0,
    productCount: 0,
    activeStores: 0,
    totalRevenue: 0,
    topCategories: []
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all stores
        const { data: allStores, error: storesError } = await supabase
          .from('stores')
          .select('id, is_active, category, created_at');
        
        if (storesError) throw storesError;

        // Fetch all products
        const { data: allProducts, error: productsError } = await supabase
          .from('products')
          .select('id, store_id');
        
        if (productsError) throw productsError;

        // Fetch orders for revenue calculation
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('total_amount, status, created_at')
          .in('status', ['paid', 'completed']);
        
        if (ordersError) throw ordersError;

        // Calculate stats
        const storeCount = allStores?.length || 0;
        const activeStores = allStores?.filter(store => store.is_active).length || 0;
        const productCount = allProducts?.length || 0;
        
        // Calculate total revenue from completed/paid orders
        const totalRevenue = orders?.reduce((sum, order) => {
          return sum + (parseFloat(order.total_amount?.toString() || '0'));
        }, 0) || 0;

        // Calculate top categories
        const categoryCounts = allStores?.reduce((acc, store) => {
          if (store.category) {
            acc[store.category] = (acc[store.category] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>) || {};

        const topCategories = Object.entries(categoryCounts)
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Fetch recent activity from recent stores and products
        const recentStores = allStores
          ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 2) || [];

        const { data: recentProducts, error: recentProductsError } = await supabase
          .from('products')
          .select('name, created_at, updated_at')
          .order('updated_at', { ascending: false })
          .limit(2);

        if (recentProductsError) throw recentProductsError;

        const activities: RecentActivity[] = [];
        
        // Add recent stores
        recentStores.forEach(store => {
          const storeData = allStores?.find(s => s.id === store.id);
          if (storeData) {
            const timeAgo = getTimeAgo(new Date(store.created_at));
            activities.push({
              action: 'New store added',
              name: storeData.category || 'Unknown',
              time: timeAgo
            });
          }
        });

        // Add recent products
        recentProducts?.forEach(product => {
          const timeAgo = getTimeAgo(new Date(product.updated_at));
          activities.push({
            action: 'Product updated',
            name: product.name,
            time: timeAgo
          });
        });

        setRecentActivity(activities.slice(0, 4));

        setStats({
          storeCount,
          productCount,
          activeStores,
          totalRevenue,
          topCategories
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Loading dashboard data...
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-red-500">{error}</p>
        </div>
      </div>
    );
  }

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

        {/* Total Revenue */}
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 truncate">
                Total Revenue
              </p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                ฿{stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
            {stats.topCategories.length > 0 ? (
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
            ) : (
              <p className="text-sm text-gray-500">No store categories available</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
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
            ) : (
              <p className="text-sm text-gray-500">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;