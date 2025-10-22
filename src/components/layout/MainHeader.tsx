import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Store, Sun, Moon } from 'lucide-react';
import { useCartStore } from '../../stores/useCartStore';
import CartDrawer from '../cart/CartDrawer';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../ui/Button';

interface MainHeaderProps {
  onSearch?: (term: string) => void;
  searchValue?: string;
}

const MainHeader: React.FC<MainHeaderProps> = ({ 
  onSearch,
  searchValue = ''
}) => {
  const navigate = useNavigate();
  const { currentTheme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchValue);
  const cartItemCount = useCartStore(state => state.getItemCount());

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch?.(value);
  };

  return (
    <>
      <header 
        className={`
          fixed top-0 left-0 right-0 z-50
          transition-all duration-200
          ${isScrolled ? 'bg-theme-header shadow-md' : 'bg-theme-header/80 backdrop-blur-sm'}
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link 
              to="/"
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors dark:text-blue-400 dark:hover:text-blue-300"
            >
              <Store className="h-8 w-8" />
              <span className="text-xl font-bold hidden sm:block"> </span>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl px-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-theme-tertiary" />
                </div>
                <input
                  type="search"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="
                    block w-full pl-10 pr-3 py-2
                    border border-theme rounded-full
                    bg-theme-input 
                    text-theme-primary placeholder-theme-tertiary
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-colors duration-200
                    sm:text-sm
                  "
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Dark Mode Toggle */}
              <Button
                variant="ghost"
                onClick={toggleTheme}
                className="p-2 text-theme-secondary hover:text-theme-primary hover:bg-theme-tertiary transition-colors duration-200"
                aria-label={`Switch to ${currentTheme === 'light' ? 'dark' : 'light'} mode`}
              >
                {currentTheme === 'light' ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </Button>

              {/* Cart Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="
                  relative p-2
                  text-theme-secondary hover:text-blue-600
                  transition-colors duration-200
                "
              >
                <span className="sr-only">Shopping cart</span>
                <ShoppingBag className="h-6 w-6" />
                {cartItemCount > 0 && (
                  <span 
                    className="
                      absolute -top-1 -right-1
                      h-5 w-5 
                      flex items-center justify-center
                      bg-blue-600 text-white
                      text-xs font-medium
                      rounded-full
                      animate-in fade-in duration-200
                    "
                  >
                    {cartItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer to prevent content from going under fixed header */}
      <div className="h-16" />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </>
  );
};

export default MainHeader;