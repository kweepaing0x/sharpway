import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { X, LayoutDashboard, Store, ShoppingBag, Users, Settings, UserCog, AlertTriangle, Megaphone, Monitor, Search, ListTree, Star, Hotel, Car } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose = () => {}
}) => {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose(); // Close sidebar when navigation occurs
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
          flex-1 flex flex-col min-h-0 bg-blue-700
          w-full lg:w-64
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}>
          <div className="flex items-center justify-between h-16 flex-shrink-0 px-4 bg-blue-800 dark:bg-blue-900">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">Mall Admin</h1>
            </div>
            <button
              className="lg:hidden text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={onClose}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1 bg-blue-700 dark:bg-blue-800">
              {/* Dashboard */}
              <NavLink
                to="/admin"
                end
                className={({ isActive }) => `
                  ${isActive ? 'bg-blue-800 text-white dark:bg-blue-900' : 'text-blue-100 hover:bg-blue-600 dark:hover:bg-blue-700'}
                  group flex items-center px-2 py-2 text-base font-medium rounded-md
                  transition-colors duration-150
                `}
                onClick={() => onClose()}
              >
                <LayoutDashboard className="mr-3 h-6 w-6" />
                Dashboard
              </NavLink>

              {/* Stores */}
              <NavLink
                to="/admin/stores"
                className={({ isActive }) => `
                  ${isActive ? 'bg-blue-800 text-white dark:bg-blue-900' : 'text-blue-100 hover:bg-blue-600 dark:hover:bg-blue-700'}
                  group flex items-center px-2 py-2 text-base font-medium rounded-md
                  transition-colors duration-150
                `}
                onClick={() => onClose()}
              >
                <Store className="mr-3 h-6 w-6" />
                Stores
              </NavLink>

              {/* Products */}
              <NavLink
                to="/admin/products"
                className={({ isActive }) => `
                  ${isActive ? 'bg-blue-800 text-white dark:bg-blue-900' : 'text-blue-100 hover:bg-blue-600 dark:hover:bg-blue-700'}
                  group flex items-center px-2 py-2 text-base font-medium rounded-md
                  transition-colors duration-150
                `}
                onClick={() => onClose()}
              >
                <ShoppingBag className="mr-3 h-6 w-6" />
                Products
              </NavLink>

              {/* Categories */}
              <NavLink
                to="/admin/categories"
                className={({ isActive }) => `
                  ${isActive ? 'bg-blue-800 text-white dark:bg-blue-900' : 'text-blue-100 hover:bg-blue-600 dark:hover:bg-blue-700'}
                  group flex items-center px-2 py-2 text-base font-medium rounded-md
                  transition-colors duration-150
                `}
                onClick={() => onClose()}
              >
                <ListTree className="mr-3 h-6 w-6" />
                Categories
              </NavLink>

              {/* Hotels */}
              <NavLink
                to="/admin/hotels"
                className={({ isActive }) => `
                  ${isActive ? 'bg-blue-800 text-white dark:bg-blue-900' : 'text-blue-100 hover:bg-blue-600 dark:hover:bg-blue-700'}
                  group flex items-center px-2 py-2 text-base font-medium rounded-md
                  transition-colors duration-150
                `}
                onClick={() => onClose()}
              >
                <Hotel className="mr-3 h-6 w-6" />
                Hotels
              </NavLink>

              {/* Taxis */}
              <NavLink
                to="/admin/taxis"
                className={({ isActive }) => `
                  ${isActive ? 'bg-blue-800 text-white dark:bg-blue-900' : 'text-blue-100 hover:bg-blue-600 dark:hover:bg-blue-700'}
                  group flex items-center px-2 py-2 text-base font-medium rounded-md
                  transition-colors duration-150
                `}
                onClick={() => onClose()}
              >
                <Car className="mr-3 h-6 w-6" />
                Taxis
              </NavLink>

              {/* Store Managers */}
              <NavLink
                to="/admin/managers"
                className={({ isActive }) => `
                  ${isActive ? 'bg-blue-800 text-white dark:bg-blue-900' : 'text-blue-100 hover:bg-blue-600 dark:hover:bg-blue-700'}
                  group flex items-center px-2 py-2 text-base font-medium rounded-md
                  transition-colors duration-150
                `}
                onClick={() => onClose()}
              >
                <UserCog className="mr-3 h-6 w-6" />
                Store Managers
              </NavLink>

              {/* Fraud List */}
              <NavLink
                to="/admin/fraud-list"
                className={({ isActive }) => `
                  ${isActive ? 'bg-blue-800 text-white dark:bg-blue-900' : 'text-blue-100 hover:bg-blue-600 dark:hover:bg-blue-700'}
                  group flex items-center px-2 py-2 text-base font-medium rounded-md
                  transition-colors duration-150
                `}
                onClick={() => onClose()}
              >
                <AlertTriangle className="mr-3 h-6 w-6" />
                Fraud List
              </NavLink>

              {/* Marquee Announcements */}
              <NavLink
                to="/admin/announcements"
                className={({ isActive }) => `
                  ${isActive ? 'bg-blue-800 text-white dark:bg-blue-900' : 'text-blue-100 hover:bg-blue-600 dark:hover:bg-blue-700'}
                  group flex items-center px-2 py-2 text-base font-medium rounded-md
                  transition-colors duration-150
                `}
                onClick={() => onClose()}
              >
                <Megaphone className="mr-3 h-6 w-6" />
                Announcements
              </NavLink>

              {/* Pop-up Ads */}
              <NavLink
                to="/admin/ads"
                className={({ isActive }) => `
                  ${isActive ? 'bg-blue-800 text-white dark:bg-blue-900' : 'text-blue-100 hover:bg-blue-600 dark:hover:bg-blue-700'}
                  group flex items-center px-2 py-2 text-base font-medium rounded-md
                  transition-colors duration-150
                `}
                onClick={() => onClose()}
              >
                <Monitor className="mr-3 h-6 w-6" />
                Pop-up Ads
              </NavLink>

              {/* Sponsored Content */}
              <NavLink
                to="/admin/sponsored-content"
                className={({ isActive }) => `
                  ${isActive ? 'bg-blue-800 text-white dark:bg-blue-900' : 'text-blue-100 hover:bg-blue-600 dark:hover:bg-blue-700'}
                  group flex items-center px-2 py-2 text-base font-medium rounded-md
                  transition-colors duration-150
                `}
                onClick={() => onClose()}
              >
                <Star className="mr-3 h-6 w-6" />
                Sponsored Content
              </NavLink>

              {/* Google Indexing */}
              <NavLink
                to="/admin/google-indexing"
                className={({ isActive }) => `
                  ${isActive ? 'bg-blue-800 text-white dark:bg-blue-900' : 'text-blue-100 hover:bg-blue-600 dark:hover:bg-blue-700'}
                  group flex items-center px-2 py-2 text-base font-medium rounded-md
                  transition-colors duration-150
                `}
                onClick={() => onClose()}
              >
                <Search className="mr-3 h-6 w-6" />
                Google Indexing
              </NavLink>

              {/* Settings */}
              <NavLink
                to="/admin/settings"
                className={({ isActive }) => `
                  ${isActive ? 'bg-blue-800 text-white dark:bg-blue-900' : 'text-blue-100 hover:bg-blue-600 dark:hover:bg-blue-700'}
                  group flex items-center px-2 py-2 text-base font-medium rounded-md
                  transition-colors duration-150
                `}
                onClick={() => onClose()}
              >
                <Settings className="mr-3 h-6 w-6" />
                Settings
              </NavLink>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;