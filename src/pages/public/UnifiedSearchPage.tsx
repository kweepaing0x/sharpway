import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Store, Hotel, Taxi, UnifiedSearchResult } from '../../types';
import { Search, Car, Building2, Store as StoreIcon } from 'lucide-react';
import Button from '../../components/ui/Button';
import BottomNavigation from '../../components/layout/BottomNavigation';
import MainHeader from '../../components/layout/MainHeader';
import MarqueeAnnouncementDisplay from '../../components/MarqueeAnnouncementDisplay';
import PopUpAdDisplay from '../../components/PopUpAdDisplay';
import SEOManager from '../../components/SEOManager';
import SponsoredCarousel from '../../components/SponsoredCarousel';

const UnifiedSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<Store[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [taxis, setTaxis] = useState<Taxi[]>([]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [storesRes, hotelsRes, taxisRes] = await Promise.all([
        supabase
          .from('stores')
          .select('*')
          .eq('is_active', true)
          .eq('approval_status', 'approved')
          .order('display_order', { ascending: true, nullsLast: true })
          .order('name'),
        supabase
          .from('hotels')
          .select('*')
          .eq('is_active', true)
          .eq('approval_status', 'approved')
          .order('display_order', { ascending: true, nullsLast: true })
          .order('name'),
        supabase
          .from('taxis')
          .select('*')
          .eq('is_active', true)
          .eq('approval_status', 'approved')
          .order('display_order', { ascending: true, nullsLast: true })
          .order('driver_name'),
      ]);

      if (storesRes.data) setStores(storesRes.data);
      if (hotelsRes.data) setHotels(hotelsRes.data);
      if (taxisRes.data) setTaxis(taxisRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const unifiedResults = useMemo((): UnifiedSearchResult[] => {
    let results: UnifiedSearchResult[] = [];

    const storeResults: UnifiedSearchResult[] = stores.map((store) => ({
      id: store.id,
      name: store.name,
      description: store.description,
      image_url: store.logo_url,
      location: store.location,
      category: store.category,
      username: store.username,
      service_type: 'store' as const,
      is_active: store.is_active,
    }));
    results = [...results, ...storeResults];

    const hotelResults: UnifiedSearchResult[] = hotels.map((hotel) => ({
      id: hotel.id,
      name: hotel.name,
      description: hotel.description,
      image_url: hotel.logo_url,
      location: hotel.location,
      category: hotel.category,
      username: hotel.username,
      service_type: 'hotel' as const,
      is_active: hotel.is_active,
    }));
    results = [...results, ...hotelResults];

    const taxiResults: UnifiedSearchResult[] = taxis.map((taxi) => ({
      id: taxi.id,
      name: taxi.driver_name,
      description: taxi.description,
      image_url: taxi.photo_url,
      location: taxi.location,
      category: taxi.vehicle_type,
      username: taxi.username,
      service_type: 'taxi' as const,
      is_active: taxi.is_active,
    }));
    results = [...results, ...taxiResults];

    if (debouncedSearchTerm) {
      results = results.filter(
        (result) =>
          result.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          result.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          result.location.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    results.sort((a, b) => {
      const aMatchesName = a.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const bMatchesName = b.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      if (aMatchesName && !bMatchesName) return -1;
      if (!aMatchesName && bMatchesName) return 1;
      return 0;
    });

    return results;
  }, [stores, hotels, taxis, debouncedSearchTerm]);

  const handleResultClick = (result: UnifiedSearchResult) => {
    if (result.service_type === 'store') {
      navigate(`/${result.username}`);
    } else if (result.service_type === 'hotel') {
      navigate(`/hotel/${result.username}`);
    } else if (result.service_type === 'taxi') {
      navigate(`/taxi/${result.username}`);
    }
  };

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'store':
        return <StoreIcon className="h-4 w-4" />;
      case 'hotel':
        return <Building2 className="h-4 w-4" />;
      case 'taxi':
        return <Car className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getServiceColor = (type: string) => {
    switch (type) {
      case 'store':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'hotel':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'taxi':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-white pb-20 dark:bg-gray-900">
      <SEOManager currentPage="home" />
      <MarqueeAnnouncementDisplay targetPage="home" />
      <PopUpAdDisplay targetPage="home" />

      <div className={`transition-all duration-300 ${debouncedSearchTerm ? 'pt-8' : 'pt-32'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-8">
              What can I do for you?
            </h1>

            <div className="max-w-2xl mx-auto mb-6">
              <div className="relative shadow-lg rounded-full">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search for stores, hotels, or taxis"
                  className="w-full px-6 py-4 pr-12 rounded-full border-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>

          </div>

          {!debouncedSearchTerm ? (
            <div className="mt-12">
              <SponsoredCarousel />
            </div>
          ) : loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : unifiedResults.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg dark:text-gray-400">
                No results found
              </p>
              <Button
                variant="link"
                onClick={() => setSearchTerm('')}
                className="mt-4"
              >
                Clear search
              </Button>
            </div>
          ) : (
            <div className="mt-8 max-w-3xl mx-auto">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                About {unifiedResults.length} results
              </p>
              <div className="space-y-6">
                {unifiedResults.map((result) => (
                  <div
                    key={`${result.service_type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="group cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {result.image_url ? (
                          <img
                            src={result.image_url}
                            alt={result.name}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center">
                            <span className="text-xl font-bold text-blue-600 dark:text-blue-300">
                              {result.name.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-1">
                          <h3 className="text-xl text-blue-700 dark:text-blue-400 group-hover:underline font-normal">
                            {result.name}
                          </h3>
                          <span
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getServiceColor(
                              result.service_type
                            )}`}
                          >
                            {getServiceIcon(result.service_type)}
                            {result.service_type}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mb-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {result.location}
                          </span>
                          <span>•</span>
                          <span>{result.category}</span>
                        </div>

                        {result.description && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
                            {result.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default UnifiedSearchPage;
