import React, { Suspense, useState, useEffect } from 'react';
import { Outlet, useNavigate, Navigate } from 'react-router-dom';
import { Menu, Bell, Store, ShoppingBag, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { useStoreManagerAuth } from '../../contexts/StoreManagerAuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabaseClient';
import Button from '../ui/Button';

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex flex-col flex-1 items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
    <p className="mt-4 text-gray-500">Loading...</p>
  </div>
);

// Sidebar component for store manager
const StoreManagerSidebar: React.FC<{
  isOpen: boolean;
  onClose?: () => void;
  stores: any[];
  currentStoreId: string;
  setCurrentStoreId: (id: string) => void;
  onSignOut: () => void;
}> = ({
  isOpen,
  onClose = () => {},
  stores,
  currentStoreId,
  setCurrentStoreId,
  onSignOut
}) => {
  const navigate = useNavigate();

  const handleStoreSelect = (storeId: string) => {
    setCurrentStoreId(storeId);
    onClose(); // Close sidebar on selection
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose(); // Close sidebar on navigation
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>
      )}

      {/* Sidebar component for both mobile and desktop */}
      <div className={`
        ${isOpen ? 'fixed inset-0 flex z-40' : 'hidden'}
        lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-50
      `}>
        <div className={`
          flex-1 flex flex-col min-h-0 bg-green-700
          w-full lg:w-64
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}>
          <div className="flex items-center justify-between h-16 flex-shrink-0 px-4 bg-green-800">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">Store Manager</h1>
            </div>
            <button
              className="lg:hidden text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={onClose}
            >
              <span className="sr-only">Close sidebar</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {stores.length > 0 ? (
                <>
                  <div className="px-2 pb-2 text-sm font-medium text-green-100 mb-2 border-b border-green-600">
                    Your Stores
                  </div>
                  {stores.map(store => (
                    <button
                      key={store.id}
                      onClick={() => handleStoreSelect(store.id)}
                      className={`
                        ${currentStoreId === store.id ? 'bg-green-800 text-white' : 'text-green-100 hover:bg-green-600'}
                        group flex items-center px-2 py-2 text-base font-medium rounded-md w-full
                        transition-colors duration-150
                      `}
                    >
                      <Store className="mr-3 h-6 w-6" />
                      {store.name}
                    </button>
                  ))}

                  <div className="px-2 py-3 mt-4 border-t border-green-600">
                    <div className="space-y-4">
                      <button
                        onClick={() => handleNavigation('/store-manager/products')}
                        className="text-green-100 hover:bg-green-600 group flex items-center px-2 py-2 text-base font-medium rounded-md w-full"
                      >
                        <ShoppingBag className="mr-3 h-6 w-6" />
                        Products
                      </button>
                      <button
                        onClick={() => handleNavigation('/store-manager/products/new')}
                        className="text-green-100 hover:bg-green-600 group flex items-center px-2 py-2 text-base font-medium rounded-md w-full"
                      >
                        <ShoppingBag className="mr-3 h-6 w-6" />
                        Add New Product
                      </button>
                      <button
                        onClick={() => handleNavigation('/store-manager/orders')}
                        className="text-green-100 hover:bg-green-600 group flex items-center px-2 py-2 text-base font-medium rounded-md w-full"
                      >
                        <ShoppingBag className="mr-3 h-6 w-6" />
                        Orders
                      </button>
                      <button
                        onClick={() => handleNavigation('/store-manager/settings')}
                        className="text-green-100 hover:bg-green-600 group flex items-center px-2 py-2 text-base font-medium rounded-md w-full"
                      >
                        <Settings className="mr-3 h-6 w-6" />
                        Settings
                      </button>
                      <button
                        onClick={() => {
                          onSignOut();
                          onClose(); // Close sidebar when signing out
                        }}
                        className="text-green-100 hover:bg-green-600 group flex items-center px-2 py-2 text-base font-medium rounded-md w-full"
                      >
                        <LogOut className="mr-3 h-6 w-6" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="px-2 py-4 text-center text-green-100">
                  <p>No stores assigned</p>
                </div>
              )}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};

// Header component for store manager
const StoreManagerHeader: React.FC<{
  onMenuClick: () => void;
  currentStore: any;
  onSignOut: () => void;
}> = ({
  onMenuClick,
  currentStore,
  onSignOut
}) => {
  const { manager } = useStoreManagerAuth(); // Use useStoreManagerAuth to get manager details
  const { currentTheme, toggleTheme } = useTheme();

  return (
    <header className="bg-theme-header shadow-sm z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <button
              type="button"
              className="px-4 border-r border-theme text-theme-secondary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500 lg:hidden"
              onClick={onMenuClick}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6 text-theme-secondary" aria-hidden="true" />
            </button>

            {currentStore && (
              <div className="flex items-center ml-4">
                <Store className="h-6 w-6 text-green-600 mr-2" />
                <h2 className="text-lg font-medium text-theme-primary">
                  {currentStore.name}
                </h2>
              </div>
            )}
          </div>

          <div className="flex items-center">
            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              onClick={toggleTheme}
              className="p-2 text-theme-secondary hover:text-theme-primary hover:bg-theme-tertiary transition-colors duration-200 mr-2"
              aria-label={`Switch to ${currentTheme === 'light' ? 'dark' : 'light'} mode`}
            >
              {currentTheme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>

            <button
              type="button"
              className="ml-4 p-2 text-theme-secondary hover:text-theme-primary"
            >
              <span className="sr-only">View notifications</span>
              <Bell className="h-6 w-6" />
            </button>

            {/* Profile dropdown */}
            <div className="ml-4 flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-lg font-medium text-white">
                    {manager?.user_id?.substring(0, 1).toUpperCase() || 'M'}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <button
                  type="button"
                  className="max-w-xs bg-white rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  id="user-menu-button"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium text-gray-700">
                      {manager?.user_id || 'Store Manager'}
                    </span>
                    <button
                      onClick={onSignOut}
                      className="flex items-center text-xs text-gray-500 hover:text-red-500"
                    >
                      <LogOut className="h-3 w-3 mr-1" />
                      Sign out
                    </button>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// Main layout component for store manager
const StoreManagerLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [currentStoreId, setCurrentStoreId] = useState<string>('');
  const [currentStore, setCurrentStore] = useState<any>(null);
  const navigate = useNavigate();
  const { manager, store, loading, logout } = useStoreManagerAuth();

  // Define a signOut function that will be passed to the components
  const handleSignOut = async () => {
    await logout();
    navigate('/store-manager/login');
  };

  // Fetch stores assigned to this manager
  useEffect(() => {
    const fetchStores = async () => {
      if (!manager) return; // Only fetch if manager is available

      try {
        const { data, error } = await supabase
          .from('store_managers')
          .select(`
            *,
            stores(*)
          `)
          .eq('user_id', manager.user_id)
          .eq('is_active', true);

        if (error) throw error;

        const storeData = data?.map(item => item.stores) || [];
        setStores(storeData);

        if (storeData.length > 0) {
          // If there's a store in the URL, prioritize it
          const urlStoreId = new URLSearchParams(window.location.search).get('storeId');
          const initialStore = urlStoreId && storeData.find(s => s.id === urlStoreId)
            ? storeData.find(s => s.id === urlStoreId)
            : storeData[0];
          
          setCurrentStoreId(initialStore.id);
          setCurrentStore(initialStore);
        } else {
          // No stores assigned
          console.warn('No stores assigned to this manager.');
          // Redirect to login if no stores are assigned, as the layout cannot function without a store
          navigate('/store-manager/login', { replace: true });
        }
      } catch (error: any) {
        console.error('Error fetching stores:', error);
        // Redirect to login on error fetching stores
        navigate('/store-manager/login', { replace: true });
      }
    };

    if (!loading && manager) { // Only fetch stores once manager is loaded
      fetchStores();
    }
  }, [manager, loading, navigate]); // Re-run when manager or loading changes

  // Update current store when currentStoreId changes
  useEffect(() => {
    if (currentStoreId && stores.length > 0) {
      const foundStore = stores.find(s => s.id === currentStoreId);
      if (foundStore) {
        setCurrentStore(foundStore);
      }
    }
  }, [currentStoreId, stores]);

  if (loading) {
    return <LoadingSpinner />;
  }

  // If not a manager or no store assigned, redirect to login
  // This check should happen after loading is complete and stores have been fetched
  if (!manager || !store) {
    // If manager is loaded but no stores are found, the useEffect above will handle redirection
    // This ensures that if a manager logs in but has no assigned stores, they are redirected.
    return <Navigate to="/store-manager/login" replace />;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-theme-secondary">
      {/* Sidebar for mobile and desktop */}
      <StoreManagerSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        stores={stores}
        currentStoreId={currentStoreId}
        setCurrentStoreId={setCurrentStoreId}
        onSignOut={handleSignOut}
      />

      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <StoreManagerHeader
          onMenuClick={() => setSidebarOpen(true)}
          currentStore={currentStore}
          onSignOut={handleSignOut}
        />

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {currentStore && (
                <Suspense fallback={<LoadingSpinner />}>
                  <Outlet context={{ store: currentStore, storeId: currentStoreId }} />
                </Suspense>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StoreManagerLayout;