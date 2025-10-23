import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Store, Product } from '../../types';
import { Search, ShoppingCart, Heart, Share2, MapPin, Clock, Phone, Link as LinkIcon, ChevronDown, Plus, ImageIcon, X, Star, TrendingUp, Sparkles } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useCartStore } from '../../stores/useCartStore';
import CartDrawer from '../../components/cart/CartDrawer';
import PriceDisplay from '../../components/PriceDisplay';
import MainHeader from '../../components/layout/MainHeader';
import { isStoreOpen, formatTime } from '../../utils/timeZoneUtils';
import ImageModal from '../../components/ImageModal';
import PopUpAdDisplay from '../../components/PopUpAdDisplay';

interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

// Modern Product Card Component with enhanced mobile-first design
const ProductCard = React.memo(({ product, onAddToCart, onQuickView, isLoading, recentlyAdded, productCategories, onToggleFavorite, isFavorite }) => {
  const categoryName = productCategories.find(cat => cat.id === product.category)?.name || product.category;
  
  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Image Container */}
      <div
        className="relative aspect-square overflow-hidden cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800"
        onClick={() => onQuickView(product)}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-16 h-16 text-gray-300 dark:text-gray-600" />
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/95 dark:bg-gray-900/95 text-gray-900 dark:text-white backdrop-blur-sm shadow-lg">
            <Sparkles className="w-3 h-3 mr-1" />
            {categoryName}
          </span>
        </div>
        
        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(product.id);
          }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-700 dark:text-gray-300'}`} />
        </button>
        
        {/* Quick View Hint */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-white text-xs font-medium bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
            Quick View
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-base text-gray-900 dark:text-white line-clamp-2 leading-tight mb-2 min-h-[2.5rem]">
          {product.name}
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3 min-h-[2.5rem]">
          {product.description}
        </p>
        
        {/* Price and Add to Cart */}
        <div className="flex items-center justify-between gap-3">
          <PriceDisplay amount={product.price} className="text-lg font-bold text-indigo-600 dark:text-indigo-400" />
          <button
            onClick={() => onAddToCart(product)}
            disabled={isLoading && recentlyAdded === product.id}
            aria-label={`Add ${product.name} to cart`}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white flex items-center justify-center disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110"
          >
            {isLoading && recentlyAdded === product.id ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Plus className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

// Loading Skeleton Component
const ProductCardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden animate-pulse">
    <div className="aspect-square bg-gray-200 dark:bg-gray-700"></div>
    <div className="p-4">
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4"></div>
      <div className="flex justify-between items-center mt-3">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>
    </div>
  </div>
);

const StorePage: React.FC = () => {
  const { storeUsername } = useParams<{ storeUsername: string }>();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingHoursLoading, setWorkingHoursLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('name-asc');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [workingHours, setWorkingHours] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [tempQuickViewProduct, setTempQuickViewProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [isMobile, setIsMobile] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const { addItem, isLoading, recentlyAdded, getItemCount } = useCartStore();
  const cartItemCount = getItemCount();

  // Memoized filtered and sorted products
  const filteredProducts = useMemo(() => {
    let result = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    const sortFn = {
      'name-asc': (a: Product, b: Product) => a.name.localeCompare(b.name),
      'name-desc': (a: Product, b: Product) => b.name.localeCompare(a.name),
      'price-asc': (a: Product, b: Product) => a.price - b.price,
      'price-desc': (a: Product, b: Product) => b.price - a.price,
      'newest': (a: Product, b: Product) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    }[sortOption];
    return sortFn ? result.sort(sortFn) : result;
  }, [products, debouncedSearchTerm, selectedCategory, sortOption]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Detect mobile view
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setItemsPerPage(mobile ? 20 : 16);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Handle toast visibility
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ show: false, message: '' });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Fetch product categories
  const fetchProductCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setProductCategories(data || []);
    } catch (err) {
      console.error('Error fetching product categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Fetch store and products
  const fetchStoreAndProducts = useCallback(async (username: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .eq('approval_status', 'approved')
        .maybeSingle();

      if (storeError) throw storeError;
      if (!storeData) {
        setError('Store not found or not available');
        setStore(null);
        setLoading(false);
        return;
      }

      setStore(storeData);

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeData.id)
        .eq('in_stock', true)
        .order('name');

      if (productsError) throw productsError;

      setProducts(productsData || []);
    } catch (error: any) {
      console.error('Error fetching store data:', error);
      setError(error.message || 'Failed to load store data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch working hours
  const fetchWorkingHours = useCallback(async () => {
    if (!store?.id) return;
    try {
      setWorkingHoursLoading(true);
      const { data, error } = await supabase
        .from('store_hours')
        .select('*')
        .eq('store_id', store.id)
        .order('day_of_week');

      if (error) throw error;

      setWorkingHours(data || []);
    } catch (error) {
      console.error('Error fetching working hours:', error);
    } finally {
      setWorkingHoursLoading(false);
    }
  }, [store?.id]);

  useEffect(() => {
    if (storeUsername) {
      fetchStoreAndProducts(storeUsername);
      fetchProductCategories();
    }
  }, [storeUsername, fetchStoreAndProducts, fetchProductCategories]);

  useEffect(() => {
    if (store) {
      fetchWorkingHours();
    }
  }, [store, fetchWorkingHours]);

  const handleAddToCart = useCallback(async (product: Product) => {
    if (!store) return;
    try {
      await addItem(product, store);
      setToast({ show: true, message: `${product.name} added to cart!` });
    } catch (error) {
      console.error('Error adding to cart:', error);
      setToast({ show: true, message: 'Failed to add item to cart' });
    }
  }, [store, addItem]);

  const openQuickView = useCallback((product: Product) => {
    setTempQuickViewProduct(product);
    setTimeout(() => {
      setQuickViewProduct(product);
    }, 10);
  }, []);

  const closeQuickView = useCallback(() => {
    setQuickViewProduct(null);
    setTimeout(() => {
      setTempQuickViewProduct(null);
    }, 300);
  }, []);

  const handleShare = async () => {
    const shareData = {
      title: store?.name || 'Check out this store!',
      text: store?.description || 'Visit this amazing store',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setToast({ show: true, message: 'Link copied to clipboard!' });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const toggleInfo = () => {
    setIsInfoExpanded(!isInfoExpanded);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSortOption('name-asc');
    setCurrentPage(1);
  };

  const handleToggleFavorite = useCallback((productId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId);
        setToast({ show: true, message: 'Removed from favorites' });
      } else {
        newFavorites.add(productId);
        setToast({ show: true, message: 'Added to favorites' });
      }
      return newFavorites;
    });
  }, []);

  const categories = useMemo(() => {
    return productCategories.length > 0
      ? productCategories
      : Array.from(new Set(products.map(p => p.category))).map(cat => ({
          id: cat,
          name: cat,
          is_active: true
        }));
  }, [productCategories, products]);

  if (loading) {
    return (
      <>
        <MainHeader />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Loading store...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !store) {
    return (
      <>
        <MainHeader />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Store Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400">{error || 'The store you are looking for does not exist or is not available.'}</p>
          </div>
        </div>
      </>
    );
  }

  const storeIsOpen = isStoreOpen(workingHours, store.time_zone);

  return (
    <>
      <MainHeader />
      <PopUpAdDisplay storeId={store.id} />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Hero Section - Modern & Engaging */}
        <section className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white overflow-hidden">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }}></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Store Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-4">
                  <div className={`w-2 h-2 rounded-full ${storeIsOpen ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                  <span className="text-sm font-medium">{storeIsOpen ? 'Open Now' : 'Closed'}</span>
                </div>
                
                <h1 className="text-4xl sm:text-5xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-100">
                  {store.name}
                </h1>
                
                <p className="text-lg text-white/90 mb-4 max-w-2xl">
                  {store.description}
                </p>
                
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm">
                  {store.address && (
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                      <MapPin className="w-4 h-4" />
                      <span>{store.address}</span>
                    </div>
                  )}
                  {store.phone_number && (
                    <a href={`tel:${store.phone_number}`} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 hover:bg-white/20 transition-colors">
                      <Phone className="w-4 h-4" />
                      <span>{store.phone_number}</span>
                    </a>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleShare}
                  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300 flex items-center justify-center hover:scale-110"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="relative w-12 h-12 rounded-full bg-white text-indigo-600 hover:bg-gray-100 transition-all duration-300 flex items-center justify-center hover:scale-110 shadow-lg"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
                      {cartItemCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Wave Separator */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
              <path d="M0 48h1440V0s-187.5 48-720 48S0 0 0 0v48z" className="fill-gray-50 dark:fill-gray-900"/>
            </svg>
          </div>
        </section>

        {/* Search and Filter Bar - Sticky */}
        <div className="sticky top-16 z-40 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {/* Mobile: Compact Search */}
            {isMobile ? (
              <div className="space-y-3">
                {/* Search Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSearchBar(!showSearchBar)}
                    className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                  
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="flex-1 rounded-full border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="flex-1 rounded-full border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  >
                    <option value="name-asc">A-Z</option>
                    <option value="name-desc">Z-A</option>
                    <option value="price-asc">Price: Low</option>
                    <option value="price-desc">Price: High</option>
                    <option value="newest">Newest</option>
                  </select>
                </div>
                
                {/* Expandable Search Bar */}
                {showSearchBar && (
                  <div className="relative animate-slideDown">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full rounded-full border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white pl-10 pr-10 py-2 text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        <X className="w-5 h-5 text-gray-400" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Desktop: Full Search Bar */
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-full border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white pl-12 pr-10 py-3 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                    >
                      <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-full border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-6 py-3 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="rounded-full border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-6 py-3 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                >
                  <option value="name-asc">Name: A-Z</option>
                  <option value="name-desc">Name: Z-A</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Products Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Section Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-7 h-7 text-indigo-600" />
                Our Products
              </h2>
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Discover our curated collection of quality products
            </p>
          </div>

          {/* Products Grid */}
          {currentItems.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl shadow-lg">
              <div className="text-7xl mb-6">🔍</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Products Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Try adjusting your search or filters to find what you're looking for.
              </p>
              <Button
                variant="primary"
                onClick={clearAllFilters}
                className="rounded-full px-8 py-3"
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                {currentItems.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onQuickView={openQuickView}
                    isLoading={isLoading}
                    recentlyAdded={recentlyAdded}
                    productCategories={productCategories}
                    onToggleFavorite={handleToggleFavorite}
                    isFavorite={favorites.has(product.id)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex justify-center items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-md"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 h-10 rounded-full font-medium transition-all ${
                            currentPage === pageNum
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-110'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-md"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Store Info Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden">
            <button
              onClick={toggleInfo}
              className="w-full flex justify-between items-center p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <span className="text-xl font-bold text-gray-900 dark:text-white">Store Information</span>
              <ChevronDown className={`w-6 h-6 text-gray-600 dark:text-gray-400 transition-transform duration-300 ${isInfoExpanded ? 'rotate-180' : ''}`} />
            </button>
            
            <div
              className={`transition-all duration-500 ease-in-out overflow-hidden ${
                isInfoExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-indigo-600" />
                    About Us
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                    {store.description}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {store.phone_number && (
                      <a
                        href={`tel:${store.phone_number}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        Call Us
                      </a>
                    )}
                    {store.channel_link && (
                      <a
                        href={store.channel_link.startsWith('http') ? store.channel_link : `https://${store.channel_link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                      >
                        <LinkIcon className="w-4 h-4" />
                        Visit Channel
                      </a>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    Working Hours
                  </h3>
                  {workingHoursLoading ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : workingHours.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400">No working hours available</p>
                  ) : (
                    <div className="space-y-2">
                      {workingHours.map((hours: any) => {
                        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][hours.day_of_week];
                        const isCurrentDay = hours.day_of_week === new Date(new Date().toLocaleString('en-US', { timeZone: store.time_zone })).getDay();
                        return (
                          <div
                            key={hours.day_of_week}
                            className={`flex justify-between items-center p-3 rounded-xl transition-colors ${
                              isCurrentDay
                                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            <span>{dayName}</span>
                            <span className="font-medium">
                              {hours.is_closed ? 'Closed' : `${formatTime(hours.opens_at)} - ${formatTime(hours.closes_at)}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Quick View Modal */}
      {tempQuickViewProduct && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            quickViewProduct ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={closeQuickView}
        >
          <div
            className={`bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-all duration-300 ${
              quickViewProduct ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <button
                onClick={closeQuickView}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex items-center justify-center hover:bg-white dark:hover:bg-gray-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                {tempQuickViewProduct.image_url ? (
                  <img
                    src={tempQuickViewProduct.image_url}
                    alt={tempQuickViewProduct.name}
                    className="w-full h-full object-cover"
                    onClick={() => setSelectedImage(tempQuickViewProduct.image_url)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-24 h-24 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="p-6 sm:p-8">
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-semibold rounded-full">
                    {productCategories.find(cat => cat.id === tempQuickViewProduct.category)?.name || tempQuickViewProduct.category}
                  </span>
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  {tempQuickViewProduct.name}
                </h2>
                
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  {tempQuickViewProduct.description}
                </p>
                
                <div className="flex items-center justify-between gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <PriceDisplay amount={tempQuickViewProduct.price} className="text-3xl font-bold text-indigo-600 dark:text-indigo-400" />
                  <button
                    onClick={() => {
                      handleAddToCart(tempQuickViewProduct);
                      closeQuickView();
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slideUp">
          <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-full shadow-2xl flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </>
  );
};

export default StorePage;

