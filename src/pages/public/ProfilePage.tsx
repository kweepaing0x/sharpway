import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Settings, ShoppingBag, Hotel, Car } from 'lucide-react';
import Button from '../../components/ui/Button';
import BottomNavigation from '../../components/layout/BottomNavigation';
import { useAuth } from '../../contexts/AuthContext';
import { useStoreManagerAuth } from '../../contexts/StoreManagerAuthContext';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user: adminUser, signOut: adminSignOut } = useAuth();
  const { user: managerUser, signOut: managerSignOut } = useStoreManagerAuth();

  const isLoggedIn = !!adminUser || !!managerUser;
  const userEmail = adminUser?.email || managerUser?.email;

  const handleSignOut = async () => {
    if (adminUser) {
      await adminSignOut();
      navigate('/admin/login');
    } else if (managerUser) {
      await managerSignOut();
      navigate('/store-manager/login');
    }
  };

  const handleManagerDashboard = () => {
    if (adminUser) {
      navigate('/admin');
    } else if (managerUser) {
      navigate('/store-manager');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Profile</h1>

        {isLoggedIn ? (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center">
                  <User className="h-8 w-8 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {userEmail}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {adminUser ? 'Administrator' : 'Manager'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleManagerDashboard}
                  variant="primary"
                  className="w-full justify-start"
                >
                  <Settings className="h-5 w-5 mr-3" />
                  Go to Dashboard
                </Button>

                <Button
                  onClick={handleSignOut}
                  variant="secondary"
                  className="w-full justify-start text-red-600 hover:text-red-700"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                <User className="h-10 w-10 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Welcome!
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Sign in to access your dashboard and manage your services
              </p>

              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/admin/login')}
                  variant="primary"
                  className="w-full"
                >
                  Admin Sign In
                </Button>
                <Button
                  onClick={() => navigate('/store-manager/login')}
                  variant="secondary"
                  className="w-full"
                >
                  Manager Sign In
                </Button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Links
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => navigate('/stores')}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Stores</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Browse all stores
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/hotels')}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <Hotel className="h-6 w-6 text-green-600 dark:text-green-400" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Hotels</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Find hotels and rooms
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/taxis')}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <Car className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Taxis</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Book taxi services
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;
