import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Store } from '../../types';
import Button from '../../components/ui/Button';
import MainHeader from '../../components/layout/MainHeader';
import MarqueeAnnouncementDisplay from '../../components/MarqueeAnnouncementDisplay';
import PopUpAdDisplay from '../../components/PopUpAdDisplay';
import SEOManager from '../../components/SEOManager';
import { useAppSettingsStore } from '../../stores/useAppSettingsStore';

const MarketingHomePage = lazy(() => import('./MarketingHomePage'));

interface StoreCategory {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20); // Default to 20 for mobile
  const [isMobile, setIsMobile] = useState(false);
  const [storeCategories, setStoreCategories] = useState<StoreCategory[]>([]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setItemsPerPage(isMobile ? 20 : 12); // 20 items for mobile, 12 for desktop
  }, [isMobile]);

  const { settings, fetchSettings } = useAppSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const homePageMode = settings?.home_page_mode || 'directory';

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchStoreCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('store_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setStoreCategories(data || []);
    } catch (err) {
      console.error('Error fetching store categories:', err);
    }
  }, []);

  // Fetch stores
  const fetchStores = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('is_active', true)
        .eq('approval_status', 'approved')
        .order('display_order', { ascending: true, nullsLast: true })
        .order('name');

      if (error) throw error;

      setStores(data || []);
    } catch (error: any) {
      console.error('Error fetching stores:', error);
      setError('Failed to load stores. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
    fetchStoreCategories();
  }, [fetchStores, fetchStoreCategories]);

  const handleStoreClick = useCallback((username: string) => {
    navigate(`/${username}`);
  }, [navigate]);

  const filteredStores = useMemo(() => {
    return stores.filter(store => {
      const matchesSearch = store.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        store.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [stores, debouncedSearchTerm]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStores.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStores.length / itemsPerPage);

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

  if (homePageMode === 'marketing') {
    return (
      <Suspense fallback={<div>Loading marketing page...</div>}>
        <MarketingHomePage />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-theme-secondary">
      <SEOManager currentPage="home" />
      
      <MainHeader 
        onSearch={setSearchTerm}
        searchValue={searchTerm}
      />
      
      {/* Marquee Announcement */}
      <MarqueeAnnouncementDisplay targetPage="home" />
      
      {/* Pop-up Ad */}
      <PopUpAdDisplay targetPage="home" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-6 flex items-center justify-between dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
            <span>{error}</span>
            <Button variant="secondary" onClick={fetchStores} size="sm">
              Retry
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No stores found matching your criteria.</p>
            <Button
              variant="link"
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
              className="mt-2"
            >
              Clear search
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {currentItems.map(store => {
              const category = storeCategories.find(cat => cat.id === store.category);
              return (
                <div
                  key={store.id}
                  onClick={() => handleStoreClick(store.username)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStoreClick(store.username)}
                  role="button"
                  tabIndex={0}
                  className="bg-theme-card rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 group dark:shadow-gray-900/20"
                >
                  <div className="relative h-32 bg-gradient-to-br from-blue-100 to-purple-100">
                    {store.logo_url ? (
                      <img
                        src={store.logo_url}
                        alt={store.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                        <span className="text-2xl font-bold text-blue-600">
                          {store.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {store.display_order && store.display_order <= 10 && (
                      <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full text-xs font-semibold shadow-sm">
                        📌 Featured
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-semibold text-theme-primary mb-1 group-hover:text-blue-600 transition-colors duration-300">
                      {store.name}
                    </h3>
                    <p className="text-xs text-theme-secondary mb-2 line-clamp-2 leading-relaxed">
                      {store.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-xs font-medium rounded-full">
                        {category?.name || store.category}
                      </span>
                      <span className="text-xs text-theme-tertiary flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {store.location}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <nav className="mt-8 flex justify-center items-center space-x-2" aria-label="Pagination">
            <Button
              variant="secondary"
              disabled={currentPage === 1}
              onClick={() => paginate(currentPage - 1)}
              className="disabled:opacity-50 w-24"
              aria-label="Previous page"
            >
              Previous
            </Button>
            {getPageNumbers().map((page, index) => (
              <Button
                key={`${page}-${index}`}
                variant={currentPage === page ? 'primary' : 'secondary'}
                onClick={() => typeof page === 'number' && paginate(page)}
                disabled={page === '...'}
                className={`w-10 h-10 ${page === '...' ? 'cursor-default' : ''}`}
                aria-label={typeof page === 'number' ? `Page ${page}` : undefined}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="secondary"
              disabled={currentPage === totalPages}
              onClick={() => paginate(currentPage + 1)}
              className="disabled:opacity-50 w-24"
              aria-label="Next page"
            >
              Next
            </Button>
          </nav>
        )}
      </div>
    </div>
  );
};

export default HomePage;