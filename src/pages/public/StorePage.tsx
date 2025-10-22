import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Store, Product } from '../../types';
import { Grid, List, MapPin, Clock, Check, ShoppingCart, BadgeCheck, Phone, Link as LinkIcon, ChevronDown, Plus, ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
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

// Memoized Product Card Component
const ProductCard = React.memo(({ product, onAddToCart, onQuickView, isLoading, recentlyAdded, productCategories }) => {
  const categoryName = productCategories.find(cat => cat.id === product.category)?.name || product.category;
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 group w-full aspect-[3/4] max-w-[200px] mx-auto">
      <div
        className="aspect-square relative cursor-pointer bg-stone-100"
        onClick={() => onQuickView(product)}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-stone-400" />
          </div>
        )}
        <span className="absolute top-2 left-2 bg-black/70 text-white text-xs font-semibold px-2 py-1 rounded-full backdrop-blur-sm">
          {categoryName}
        </span>
      </div>
      <div className="p-3 flex-1 flex flex-col justify-between min-h-0">
        <div className="flex-1 min-h-0">
          <h3 className="font-medium text-sm text-stone-900 line-clamp-2 leading-tight mb-1">
            {product.name}
          </h3>
          <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>
        <div className="flex items-center justify-between mt-3 pt-2">
          <PriceDisplay amount={product.price} className="text-sm font-semibold" />
          <button
            onClick={() => onAddToCart(product)}
            disabled={isLoading && recentlyAdded === product.id}
            aria-label={`Add ${product.name} to cart`}
            className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center disabled:opacity-50 transition-opacity"
          >
            {isLoading && recentlyAdded === product.id ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

// Loading Skeleton Component
const ProductCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse w-full aspect-[3/4] max-w-[200px] mx-auto">
    <div className="aspect-square bg-stone-200"></div>
    <div className="p-3">
      <div className="h-4 bg-stone-200 rounded mb-2"></div>
      <div className="h-3 bg-stone-200 rounded mb-2 w-3/4"></div>
      <div className="flex justify-between items-center mt-3 pt-2">
        <div className="h-4 bg-stone-200 rounded w-16"></div>
        <div className="w-8 h-8 bg-stone-200 rounded-full"></div>
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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
  const [showFilters, setShowFilters] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

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

  // Fixed scroll direction for filter visibility on mobile
  useEffect(() => {
    if (!isMobile) {
      setShowFilters(true);
      return;
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowFilters(false);
      } else if (currentScrollY < lastScrollY) {
        setShowFilters(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile, lastScrollY]);

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

      const processedData = data?.map(hour => ({
        ...hour,
        opens_at: hour.opens_at?.slice(0, 5),
        closes_at: hour.closes_at?.slice(0, 5)
      })) || [];

      setWorkingHours(processedData);
    } catch (error) {
      console.error('Error fetching working hours:', error);
    } finally {
      setWorkingHoursLoading(false);
    }
  }, [store?.id]);

  useEffect(() => {
    if (storeUsername) {
      fetchStoreAndProducts(storeUsername);
    }
  }, [storeUsername, fetchStoreAndProducts]);

  useEffect(() => {
    if (store?.id) {
      fetchWorkingHours();
      fetchProductCategories();
    }
  }, [store?.id, fetchWorkingHours, fetchProductCategories]);

  // Handle add to cart with toast notification
  const handleAddToCart = useCallback(async (product: Product) => {
    await addItem({
      productId: product.id,
      storeId: product.store_id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image_url
    });
    setToast({ show: true, message: 'Added to Cart!' });
  }, [addItem]);

  // Modal handlers
  const openImageModal = useCallback((imageUrl: string) => {
    setSelectedImage(imageUrl);
    if (quickViewProduct) {
      setTempQuickViewProduct(quickViewProduct); // Store current quick view product
      setQuickViewProduct(null); // Hide quick view modal
    }
  }, [quickViewProduct]);

  const closeImageModal = useCallback(() => {
    setSelectedImage(null);
    if (tempQuickViewProduct) {
      setQuickViewProduct(tempQuickViewProduct); // Restore quick view modal
      setTempQuickViewProduct(null); // Clear temporary storage
    }
  }, [tempQuickViewProduct]);

  const openQuickView = useCallback((product: Product) => {
    setQuickViewProduct(product);
  }, []);

  const closeQuickView = useCallback(() => {
    setQuickViewProduct(null);
    setTempQuickViewProduct(null); // Clear temporary storage
  }, []);

  // Navigation for quick view
  const navigateQuickView = useCallback((direction: 'next' | 'prev') => {
    if (!quickViewProduct || !filteredProducts.length) return;
    const currentIndex = filteredProducts.findIndex(p => p.id === quickViewProduct.id);
    let newIndex: number;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % filteredProducts.length; // Wrap to first
    } else {
      newIndex = (currentIndex - 1 + filteredProducts.length) % filteredProducts.length; // Wrap to last
    }
    setQuickViewProduct(filteredProducts[newIndex]);
  }, [quickViewProduct, filteredProducts]);

  // Toggle store info
  const toggleInfo = useCallback(() => {
    setIsInfoExpanded(prev => !prev);
  }, []);

  // Handle share
  const handleShare = async () => {
    const shareData = {
      title: store?.name,
      text: `Check out ${store?.name} on Marketplace!`,
      url: window.location.href
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setToast({ show: true, message: 'Link copied to clipboard!' });
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const getPageNumbers = useCallback(() => {
    const maxPagesToShow = 5;
    const pages: (number | string)[] = [];
    const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push('...');
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  }, [currentPage, totalPages]);

  const paginate = useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Categories
  const categories = useMemo(() => {
    if (productCategories.length > 0) {
      return productCategories;
    }
    return Array.from(new Set(products.map(product => product.category)))
      .map(cat => ({ id: cat, name: cat, is_active: true }));
  }, [products, productCategories]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedCategory('');
    setSortOption('name-asc');
    setCurrentPage(1);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-stone-900 mb-2">Store Not Found</h2>
          <p className="text-stone-600 mb-4">{error || 'The store you\'re looking for doesn\'t exist or is currently inactive.'}</p>
          <Button variant="primary" onClick={() => storeUsername && fetchStoreAndProducts(storeUsername)}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-secondary text-theme-primary antialiased">
      <MainHeader 
        onSearch={setSearchTerm}
        searchValue={searchTerm}
      />
      <PopUpAdDisplay targetPage="store" storeId={store.id} />

      {/* Store Header */}
      <section
        className="relative bg-cover bg-center text-white h-64 md:h-80 flex items-center justify-center shadow-lg"
        style={{ backgroundImage: `url(${store.banner_url || 'https://omzqjvehfhjtfrphzuax.supabase.co/storage/v1/object/public/wallpaper//sl_020620_27800_34.jpg'})` }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8 px-4 text-center md:text-left">
          <div className="flex-shrink-0">
            {store.logo_url ? (
              <img
                src={store.logo_url}
                alt={store.name}
                className="h-24 w-24 md:h-32 md:w-32 rounded-full object-cover border-4 border-white shadow-lg transition-transform duration-300 hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="h-24 w-24 md:h-32 md:w-32 rounded-full bg-indigo-100 flex items-center justify-center border-4 border-white shadow-lg">
                <span className="text-4xl font-bold text-indigo-600">{store.name.substring(0, 2).toUpperCase()}</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <h1 className="text-3xl md:text-4xl font-bold drop-shadow-md">{store.name}</h1>
              {store.is_verified && (
                <BadgeCheck
                  className="h-8 w-8 text-green-500 bg-green-100 rounded-full p-1 hover:scale-110 transition-transform"
                  title="Verified Store"
                />
              )}
            </div>
            <p className="mt-2 text-lg text-stone-200 drop-shadow-sm">{store.description}</p>
            <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${isStoreOpen(workingHours, store.time_zone) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <Clock className="inline-block h-4 w-4 mr-1 -mt-0.5" />
                {isStoreOpen(workingHours, store.time_zone) ? 'Open Now' : 'Currently Closed'}
              </span>
              <span className="flex items-center text-stone-200 text-sm">
                <MapPin className="h-4 w-4 mr-1" />
                {store.location}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Store Info Section (Expandable) */}
      <section className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-theme-card rounded-xl shadow-md overflow-hidden">
          <button
            onClick={toggleInfo}
            className="w-full flex justify-between items-center p-4 sm:p-5 text-left font-semibold text-lg text-theme-primary hover:bg-theme-tertiary transition-colors duration-300"
          >
            <span>Store Information</span>
            <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${isInfoExpanded ? 'rotate-180' : ''}`} />
          </button>
          <div
            className={`transition-all duration-500 ease-in-out overflow-hidden ${isInfoExpanded ? 'max-h-screen opacity-100 p-4 sm:p-5' : 'max-h-0 opacity-0 p-0'}`}
          >
            <div className="border-t border-theme grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-theme-primary mb-2">About Us</h3>
                <p className="text-theme-secondary">{store.description}</p>
                <div className="mt-4 flex flex-wrap gap-4">
                  {store.phone_number && (
                    <a href={`tel:${store.phone_number}`} className="flex items-center text-sm text-indigo-600 hover:underline">
                      <Phone className="h-4 w-4 mr-1" />
                      {store.phone_number}
                    </a>
                  )}
                  {store.channel_link && (
                    <a
                      href={store.channel_link.startsWith('http') ? store.channel_link : `https://${store.channel_link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-indigo-600 hover:underline"
                    >
                      <LinkIcon className="h-4 w-4 mr-1" />
                      Channel
                    </a>
                  )}
                  <button onClick={handleShare} className="flex items-center text-sm text-indigo-600 hover:underline">
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6.632l6.632-3.316m0 0a3 3 0 110-2.684 3 3 0 010 2.684z"></path>
                    </svg>
                    Share Store
                  </button>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-theme-primary mb-2">Working Hours</h3>
                {workingHoursLoading ? (
                  <div className="flex justify-center items-center h-20">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  </div>
                ) : workingHours.length === 0 ? (
                  <p className="text-sm text-theme-secondary">No working hours available</p>
                ) : (
                  <div className="grid grid-cols-1 gap-1 text-sm">
                    {workingHours.map((hours: any) => {
                      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][hours.day_of_week];
                      const isCurrentDay = hours.day_of_week === new Date(new Date().toLocaleString('en-US', { timeZone: store.time_zone })).getDay();
                      return (
                        <div
                          key={hours.day_of_week}
                          className={`flex justify-between ${isCurrentDay ? 'font-semibold text-indigo-700 bg-indigo-50 rounded-md p-2 -mx-2 dark:text-indigo-300 dark:bg-indigo-900/30' : 'text-theme-secondary'}`}
                        >
                          <span>{dayName}</span>
                          <span>{hours.is_closed ? 'Closed' : `${formatTime(hours.opens_at)} - ${formatTime(hours.closes_at)}`}</span>
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

      {/* Product Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-theme-primary">Our Products</h2>
          <p className="mt-2 text-theme-secondary">Browse our collection of products. Use the filters to find exactly what you're looking for.</p>
        </div>

        {/* Filters */}
        <div className={`bg-theme-card/90 backdrop-blur-lg sticky top-16 z-30 mb-8 p-4 rounded-xl shadow-sm transition-all duration-300 ${showFilters ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-auto rounded-md border-theme bg-theme-input text-theme-primary py-2 pl-3 pr-10 text-base focus:outline-none focus:ring-indigo-600 focus:border-indigo-600"
              >
                <option value="">All Categories</option>
                {loadingCategories ? (
                  <option value="" disabled>Loading categories...</option>
                ) : categories.length > 0 ? (
                  categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))
                ) : (
                  Array.from(new Set(products.map(product => product.category))).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))
                )}
              </select>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full sm:w-auto rounded-md border-theme bg-theme-input text-theme-primary py-2 pl-3 pr-10 text-base focus:outline-none focus:ring-indigo-600 focus:border-indigo-600"
              >
                <option value="name-asc">Sort by Name (A-Z)</option>
                <option value="name-desc">Sort by Name (Z-A)</option>
                <option value="price-asc">Sort by Price (Low-High)</option>
                <option value="price-desc">Sort by Price (High-Low)</option>
                <option value="newest">Sort by Newest</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'secondary'}
                onClick={() => setViewMode('grid')}
                className="p-2"
                aria-label="Grid view"
              >
                <Grid className="h-5 w-5" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'secondary'}
                onClick={() => setViewMode('list')}
                className="p-2"
                aria-label="List view"
              >
                <List className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Products Display */}
        {currentItems.length === 0 ? (
          <div className="text-center py-16 bg-theme-card rounded-xl shadow-md">
            <div className="text-6xl mb-4">🛒<span className="text-red-500 relative -left-5 -top-2 text-7xl font-bold">🚫</span></div>
            <h3 className="text-2xl font-semibold text-theme-primary">No Products Found</h3>
            <p className="text-theme-secondary mt-2">Try adjusting your search or filters to find what you're looking for.</p>
            <Button
              variant="link"
              onClick={clearAllFilters}
              className="mt-4 text-indigo-600 hover:text-indigo-800"
            >
              Clear all filters
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {currentItems.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onQuickView={openQuickView}
                isLoading={isLoading}
                recentlyAdded={recentlyAdded}
                productCategories={productCategories}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {currentItems.map((product) => (
              <div
                key={product.id}
                className="bg-theme-card rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg flex flex-col sm:flex-row dark:shadow-gray-900/20"
              >
                <div
                  className="sm:w-48 flex-shrink-0 relative h-48 sm:h-auto cursor-pointer group bg-theme-tertiary"
                  onClick={() => openQuickView(product)}
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                      <div className="w-full h-full flex items-center justify-center bg-theme-tertiary">
                        <ImageIcon className="w-12 h-12 text-theme-tertiary" />
                    </div>
                  )}
                  <span className="absolute top-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm">
                    {productCategories.find(cat => cat.id === product.category)?.name || product.category}
                  </span>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="mt-1 text-lg leading-tight font-medium text-theme-primary">{product.name}</h3>
                    <p className="mt-2 text-theme-secondary line-clamp-2">{product.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <PriceDisplay amount={product.price} className="text-xl font-semibold" />
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={isLoading && recentlyAdded === product.id}
                      className="inline-flex items-center px-4 py-2 rounded-md font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      {isLoading && recentlyAdded === product.id ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Adding...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Cart
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="mt-12 flex justify-center items-center space-x-2" aria-label="Pagination">
            <Button
              variant="secondary"
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium rounded-md disabled:opacity-50"
            >
              Previous
            </Button>
            {getPageNumbers().map((page, index) => (
              <Button
                key={`${page}-${index}`}
                variant={currentPage === page ? 'primary' : 'secondary'}
                onClick={() => typeof page === 'number' && paginate(page)}
                disabled={page === '...'}
                className={`w-10 h-10 text-sm font-medium rounded-md ${page === '...' ? 'cursor-default' : ''}`}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="secondary"
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium rounded-md disabled:opacity-50"
            >
              Next
            </Button>
          </nav>
        )}

        {/* Toast Notification */}
        {toast.show && (
          <div
            className="fixed bottom-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg transition-all duration-300 transform translate-y-0"
            role="alert"
          >
            <div className="flex items-center">
              <Check className="w-4 h-4 mr-2" />
              {toast.message}
            </div>
          </div>
        )}
      </div>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal 
          imageUrl={selectedImage} 
          isOpen={!!selectedImage}
          onClose={closeImageModal} 
        />
      )}

      {/* Quick View Modal */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-xl flex flex-col md:flex-row overflow-hidden animate-[slideInUp_0.4s_cubic-bezier(0.25,0.46,0.45,0.94)]">
            <button
              onClick={closeQuickView}
              className="absolute top-3 right-3 z-20 bg-white/90 rounded-full p-2 text-stone-900 hover:bg-white transition-colors shadow-md"
              aria-label="Close quick view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
            
            <div className="relative w-full md:w-1/2 h-64 md:h-auto bg-stone-100 flex items-center justify-center overflow-hidden">
              <button
                onClick={() => navigateQuickView('prev')}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 rounded-full p-2 text-stone-900 hover:bg-white transition-colors shadow-md disabled:opacity-50"
                aria-label="Previous product"
                disabled={filteredProducts.length <= 1}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div 
                className="w-full h-full flex items-center justify-center cursor-pointer"
                onClick={() => quickViewProduct.image_url && openImageModal(quickViewProduct.image_url)}
              >
                {quickViewProduct.image_url ? (
                  <img
                    src={quickViewProduct.image_url}
                    alt={quickViewProduct.name}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-stone-400" />
                  </div>
                )}
              </div>
              <button
                onClick={() => navigateQuickView('next')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 rounded-full p-2 text-stone-900 hover:bg-white transition-colors shadow-md disabled:opacity-50"
                aria-label="Next product"
                disabled={filteredProducts.length <= 1}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            <div className="w-full md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
              <div>
                <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                  {productCategories.find(cat => cat.id === quickViewProduct.category)?.name || quickViewProduct.category}
                </span>
                <h2 className="text-2xl font-bold mt-3 text-stone-900 leading-tight">{quickViewProduct.name}</h2>
                <PriceDisplay amount={quickViewProduct.price} className="text-3xl font-light text-stone-900 mt-4" />
                <p className="text-stone-600 mt-4 text-sm leading-relaxed">{quickViewProduct.description}</p>
              </div>
              
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => handleAddToCart(quickViewProduct)}
                  disabled={isLoading && recentlyAdded === quickViewProduct.id}
                  className="w-full inline-flex items-center justify-center px-6 py-3 rounded-md font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isLoading && recentlyAdded === quickViewProduct.id ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Add to Cart
                    </>
                  )}
                </button>
                
                <button
                  onClick={closeQuickView}
                  className="w-full px-6 py-3 rounded-md font-medium border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorePage;