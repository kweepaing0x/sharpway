import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { StoreManagerAuthProvider } from './contexts/StoreManagerAuthContext';
import { HotelManagerAuthProvider } from './contexts/HotelManagerAuthContext';
import { TaxiManagerAuthProvider } from './contexts/TaxiManagerAuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NavigationStackProvider } from './contexts/NavigationStackContext';
import ProtectedRoute from './components/ProtectedRoute.tsx';

// Lazy load components with better chunking
const UnifiedSearchPage = lazy(() => import('./pages/public/UnifiedSearchPage'));
const StoresPage = lazy(() => import('./pages/public/StoresPage'));
const HotelsPage = lazy(() => import('./pages/public/HotelsPage'));
const HotelProfilePage = lazy(() => import('./pages/public/HotelProfilePage'));
const TaxisPage = lazy(() => import('./pages/public/TaxisPage'));
const ProfilePage = lazy(() => import('./pages/public/ProfilePage'));
const StorePage = lazy(() => import('./pages/public/StorePage'));
const CheckoutPage = lazy(() => import('./pages/public/CheckoutPage'));
const SuccessPage = lazy(() => import('./pages/public/SuccessPage'));

// Admin components
const Login = lazy(() => import("./pages/admin/Login"));
const AdminLayout = lazy(() => import('./components/layout/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const StoresList = lazy(() => import('./pages/admin/stores/StoresList'));
const CreateStore = lazy(() => import('./pages/admin/stores/CreateStore'));
const EditStore = lazy(() => import('./pages/admin/stores/EditStore'));
const ApprovalQueue = lazy(() => import('./pages/admin/stores/ApprovalQueue'));
const ManagersList = lazy(() => import('./pages/admin/managers/ManagersList'));
const CreateManager = lazy(() => import('./pages/admin/managers/CreateManager'));
const FraudList = lazy(() => import('./pages/admin/FraudList'));
const MarqueeAnnouncementsManager = lazy(() => import('./pages/admin/MarqueeAnnouncementsManager'));
const PopUpAdsManager = lazy(() => import('./pages/admin/PopUpAdsManager'));
const GoogleIndexingSettings = lazy(() => import('./pages/admin/GoogleIndexingSettings'));
const ProductsList = lazy(() => import('./pages/admin/products/ProductsList'));
const CreateProduct = lazy(() => import('./pages/admin/products/CreateProduct'));
const EditProduct = lazy(() => import('./pages/admin/products/EditProduct'));
const SettingsPage = lazy(() => import('./pages/admin/settings/SettingsPage'));
const CategoriesManagement = lazy(() => import('./pages/admin/categories/CategoriesManagement'));
const SponsoredContentManager = lazy(() => import('./pages/admin/SponsoredContentManager'));
const HotelsList = lazy(() => import('./pages/admin/hotels/HotelsList'));
const CreateHotel = lazy(() => import('./pages/admin/hotels/CreateHotel'));
const TaxisList = lazy(() => import('./pages/admin/taxis/TaxisList'));

// Store Manager components
const StoreManagerLogin = lazy(() => import('./pages/store-manager/StoreManagerLogin'));
const StoreManagerLayout = lazy(() => import('./components/layout/StoreManagerLayout'));
const StoreManagerDashboard = lazy(() => import("./pages/store-manager/Dashboard"));
const StoreManagerProducts = lazy(() => import("./pages/store-manager/Products"));
const StoreManagerOrders = lazy(() => import("./pages/store-manager/Orders"));
const StoreManagerSettings = lazy(() => import("./pages/store-manager/Settings"));
const StoreManagerCreateProduct = lazy(() => import("./pages/store-manager/CreateProduct"));
const StoreManagerEditProduct = lazy(() => import("./pages/store-manager/EditProduct"));

// Optimized loading component
const AppLoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <NavigationStackProvider>
        <AuthProvider>
          <StoreManagerAuthProvider>
            <HotelManagerAuthProvider>
              <TaxiManagerAuthProvider>
                <Router>
              <Suspense fallback={<AppLoadingSpinner />}>
                <Routes>
                {/* Public Routes */}
                <Route path="/" element={<UnifiedSearchPage />} />
                <Route path="/stores" element={<StoresPage />} />
                <Route path="/hotels" element={<HotelsPage />} />
                <Route path="/hotel/:username" element={<HotelProfilePage />} />
                <Route path="/taxis" element={<TaxisPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/success" element={<SuccessPage />} />
                <Route path="/:storeUsername" element={<StorePage />} />

                {/* Admin Login */}
                <Route path="/admin/login" element={<Login />} />
                
                {/* Store Manager Login */}
                <Route path="/store-manager/login" element={<StoreManagerLogin />} />

                {/* Admin Routes */}
                <Route path="/admin" element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Dashboard />} />
                  <Route path="stores" element={<StoresList />} />
                  <Route path="stores/new" element={<CreateStore />} />
                  <Route path="stores/:id/edit" element={<EditStore />} />
                  <Route path="stores/approval" element={<ApprovalQueue />} />
                  <Route path="managers" element={<ManagersList />} />
                  <Route path="managers/new" element={<CreateManager />} />
                  <Route path="fraud-list" element={<FraudList />} />
                  <Route path="announcements" element={<MarqueeAnnouncementsManager />} />
                  <Route path="ads" element={<PopUpAdsManager />} />
                  <Route path="sponsored-content" element={<SponsoredContentManager />} />
                  <Route path="google-indexing" element={<GoogleIndexingSettings />} />
                  <Route path="products" element={<ProductsList />} />
                  <Route path="products/new" element={<CreateProduct />} />
                  <Route path="products/:id/edit" element={<EditProduct />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="categories" element={<CategoriesManagement />} />
                  <Route path="hotels" element={<HotelsList />} />
                  <Route path="hotels/new" element={<CreateHotel />} />
                  <Route path="taxis" element={<TaxisList />} />
                </Route>
                
                {/* Store Manager Routes */}
                <Route path="/store-manager" element={<StoreManagerLayout />}>
                  <Route index element={<StoreManagerDashboard />} />
                  <Route path="products" element={<StoreManagerProducts />} />
                  <Route path="products/new" element={<StoreManagerCreateProduct />} />
                  <Route path="products/:id/edit" element={<StoreManagerEditProduct />} />
                  <Route path="orders" element={<StoreManagerOrders />} />
                  <Route path="settings" element={<StoreManagerSettings />} />
                </Route>

                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
                </Router>
              </TaxiManagerAuthProvider>
            </HotelManagerAuthProvider>
          </StoreManagerAuthProvider>
        </AuthProvider>
      </NavigationStackProvider>
    </ThemeProvider>
  );
}

export default App;