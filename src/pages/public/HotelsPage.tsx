import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';

import { useNavigate } from 'react-router-dom';

import { Hotel } from '../../types';

import { Search, SlidersHorizontal, X, MapPin, Star, Building2 } from 'lucide-react';

import Button from '../../components/ui/Button';

import BottomNavigation from '../../components/layout/BottomNavigation';

import FloatingActionButton from '../../components/mobile/FloatingActionButton';

import SearchOverlay from '../../components/mobile/SearchOverlay';

import FilterDrawer from '../../components/mobile/FilterDrawer';

import { SkeletonCard } from '../../components/mobile/SkeletonCard';

import { EmptyState } from '../../components/mobile/EmptyState';

import { PullToRefresh } from '../../components/mobile/PullToRefresh';

import { LazyImage } from '../../components/ui/LazyImage';

import { useServerSearch } from '../../hooks/useServerSearch';

import { getSearchHistory, addToSearchHistory, clearSearchHistory } from '../../utils/searchHistory';

const HotelsPage: React.FC = () => {
  const [showSkeleton, setShowSkeleton] = useState(true);
  const minLoadingTimeRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');

  const [selectedLocation, setSelectedLocation] = useState('');

  const [selectedCategory, setSelectedCategory] = useState('');

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {

    const history = getSearchHistory('hotels');

    setRecentSearches(history.map(item => item.query));

  }, []);
  const { data: hotels, isLoading, refetch } = useServerSearch<Hotel>({

    searchFunction: 'search_hotels',

    searchQuery: searchTerm,

    filters: {

      location: selectedLocation,

      category: selectedCategory,

    },

    limit: 50,

    offset: 0,

    debounceMs: 500,

  });

  const filteredHotels = useMemo(() => {

    return hotels || [];

  }, [hotels]);

  useEffect(() => {
    if (isLoading) {
      setShowSkeleton(true);
      if (minLoadingTimeRef.current) {
        clearTimeout(minLoadingTimeRef.current);
      }
      minLoadingTimeRef.current = setTimeout(() => {
        setShowSkeleton(false);
      }, 500); // Minimum 500ms display for skeleton
    } else {
      if (minLoadingTimeRef.current) {
        clearTimeout(minLoadingTimeRef.current);
      }
      setShowSkeleton(false);
    }
    return () => {
      if (minLoadingTimeRef.current) {
        clearTimeout(minLoadingTimeRef.current);
      }
    };
  }, [isLoading]);


  const activeFilterCount = useMemo(() => {

    let count = 0;

    if (selectedLocation) count++;

    if (selectedCategory) count++;

    return count;

  }, [selectedLocation, selectedCategory]);

  const locations = useMemo(() => {

    if (!hotels) return [];

    const uniqueLocations = Array.from(new Set(hotels.map((hotel) => hotel.location)))

      .filter(Boolean)

      .sort();

    return uniqueLocations;

  }, [hotels]);


  const categories = useMemo(() => {       clearTimeout(minLoadingTimeRef.current);
      }
    };
  }, [isLoading]);


  const categories = useMemo(() => {

    if (!hotels) return [];

    const uniqueCategories = Array.from(new Set(hotels.map((hotel) => hotel.category)))

      .filter(Boolean)

      .sort();

    return uniqueCategories;
  }, [hotels]);


  const handleHotelClick = useCallback(

    (username: string) => {

      navigate(`/hotel/${username}`);

    },

    [navigate]

  );

  const handleSearch = useCallback((value: string) => {

    setSearchTerm(value);

    if (value.trim()) {

      addToSearchHistory('hotels', value);

      const history = getSearchHistory('hotels');

      setRecentSearches(history.map(item => item.query));

    }

  }, []);

  const handleResetFilters = () => {

    setSelectedLocation('');

    setSelectedCategory('');

  };

  const handleRefresh = async () => {

    await refetch();

  };

  return (

    <div className="min-h-screen bg-[#0A0A0A] pb-20">

      <div className="sticky top-0 z-40 bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border-b border-[#2A2A2A] shadow-lg backdrop-blur-xl">

        <div className="max-w-7xl mx-auto px-4 py-4">

          <div className="flex items-center justify-between">

            <h1 className="text-2xl font-bold text-white">Hotels</h1>

            <button

              onClick={() => setIsSearchOpen(true)}

              className="p-2.5 hover:bg-[#2A2A2A] rounded-full transition-colors"

              aria-label="Search hotels"

            >

              <Search className="w-5 h-5 text-gray-300" />

            </button>

          </div>

          {searchTerm && (

            <div className="mt-3 flex items-center gap-2">

              <span className="text-sm text-gray-400">Searching for:</span>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#00D9FF]/10 border border-[#00D9FF]/30 rounded-full">

                <span className="text-sm font-medium text-[#00D9FF]">{searchTerm}</span>

                <button

                  onClick={() => setSearchTerm('')}

                  className="p-0.5 hover:bg-[#00D9FF]/20 rounded-full transition-colors"

                >

                  <X className="w-3.5 h-3.5 text-[#00D9FF]" />

                </button>

              </div>

            </div>

          )}

          {activeFilterCount > 0 && (

            <div className="mt-3 flex flex-wrap gap-2">

              {selectedLocation && (

                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 rounded-full">

                  <span className="text-sm font-medium text-[#8B5CF6]">{selectedLocation}</span>

                  <button

                    onClick={() => setSelectedLocation('')}

                    className="p-0.5 hover:bg-[#8B5CF6]/20 rounded-full transition-colors"

                  >

                    <X className="w-3.5 h-3.5 text-[#8B5CF6]" />

                  </button>

                </div>

              )}

              {selectedCategory && (

                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 rounded-full">

                  <span className="text-sm font-medium text-[#8B5CF6]">{selectedCategory}</span>

                  <button

                    onClick={() => setSelectedCategory('')}

                    className="p-0.5 hover:bg-[#8B5CF6]/20 rounded-full transition-colors"

                  >

                    <X className="w-3.5 h-3.5 text-[#8B5CF6]" />

                  </button>

                </div>

              )}

            </div>

          )}

        </div>

      </div>

      <PullToRefresh onRefresh={handleRefresh}>

        <div className="max-w-7xl mx-auto px-4 py-6">

          {showSkeleton ? (

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              {Array.from({ length: 6 }).map((_, i) => (

                <SkeletonCard key={i} variant="hotel" />

              ))}

            </div>

          ) : filteredHotels.length === 0 ? (

            <EmptyState

              icon={<Building2 className="w-12 h-12 text-[#00D9FF]" />}

              title="No hotels found"

              description={

                searchTerm || activeFilterCount > 0

                  ? "Try adjusting your search or filters to find available hotels."

                  : "There are no hotels available at the moment. Please check back later."

              }

              action={

                (searchTerm || activeFilterCount > 0) && (

                  <Button

                    variant="secondary"

                    onClick={() => {

                      setSearchTerm('');

                      handleResetFilters();

                    }}

                    className="bg-[#00D9FF] hover:bg-[#00D9FF]/90 text-black btn-animate"

                  >

                    Clear all filters

                  </Button>

                )

              }

            />

          ) : (

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              {filteredHotels.map((hotel) => (

                <div

                  key={hotel.id}

                  onClick={() => handleHotelClick(hotel.username)}

                  className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] rounded-2xl border border-[#2A2A2A] overflow-hidden cursor-pointer card-hover"

                >

                  <div className="relative h-48 w-full">

                    {hotel.logo_url ? (

                      <LazyImage

                        src={hotel.logo_url}

                        alt={hotel.name}

                        className="w-full h-full"

                      />

                    ) : (

                      <div className="w-full h-full bg-gradient-to-br from-[#FF6B35]/20 to-[#00D9FF]/20 flex items-center justify-center">

                        <span className="text-4xl font-bold text-[#00D9FF]">

                          {hotel.name.substring(0, 2).toUpperCase()}

                        </span>

                      </div>

                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                  </div>

                  <div className="p-4 space-y-3">

                    <h3 className="text-lg font-semibold text-white line-clamp-1">

                      {hotel.name}

                    </h3>

                    {hotel.description && (

                      <p className="text-sm text-gray-400 line-clamp-2">

                        {hotel.description}

                      </p>

                    )}

                    <div className="flex items-center gap-2">

                      {hotel.star_rating && hotel.star_rating > 0 && (

                        <div className="flex items-center gap-1">

                          {Array.from({ length: hotel.star_rating }).map((_, i) => (

                            <Star key={i} className="w-4 h-4 fill-[#FACC15] text-[#FACC15]" />

                          ))}

                        </div>

                      )}

                      {hotel.category && (

                        <span className="px-2.5 py-1 bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 text-[#8B5CF6] text-xs font-medium rounded-full">

                          {hotel.category}

                        </span>

                      )}

                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#2A2A2A]">

                      <div className="flex items-center text-sm text-gray-400">

                        <MapPin className="w-4 h-4 mr-1" />

                        {hotel.location}

                      </div>

                      <button className="px-4 py-2 bg-[#00D9FF] hover:bg-[#00D9FF]/90 text-black text-sm font-medium rounded-xl btn-animate">

                        View Details

                      </button>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </PullToRefresh>

      <FloatingActionButton

        icon={<SlidersHorizontal className="w-6 h-6" />}

        onClick={() => setIsFilterOpen(true)}

        label="Filters"

        color="purple"

        badge={activeFilterCount}

      />

      <SearchOverlay

        isOpen={isSearchOpen}

        onClose={() => setIsSearchOpen(false)}

        searchValue={searchTerm}

        onSearchChange={handleSearch}

        placeholder="Search hotels by name or location..."

        recentSearches={recentSearches}

        onRecentSearchClick={(search) => {

          setSearchTerm(search);

          setIsSearchOpen(false);

        }}

        onClearRecent={() => {

          clearSearchHistory('hotels');

          setRecentSearches([]);

        }}

      />

      <FilterDrawer

        isOpen={isFilterOpen}

        onClose={() => setIsFilterOpen(false)}

        onApply={() => {}}

        onReset={handleResetFilters}

        title="Filter Hotels"

      >

        <div className="space-y-6">

          <div>

            <label className="block text-sm font-semibold text-white mb-3">

              Location

            </label>

            <select

              value={selectedLocation}

              onChange={(e) => setSelectedLocation(e.target.value)}

              className="w-full px-4 py-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent"

            >

              <option value="">All Locations</option>

              {locations.map((location) => (

                <option key={location} value={location}>

                  {location}

                </option>

              ))}

            </select>

          </div>

          <div>

            <label className="block text-sm font-semibold text-white mb-3">

              Category

            </label>

            <select

              value={selectedCategory}

              onChange={(e) => setSelectedCategory(e.target.value)}

              className="w-full px-4 py-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent"

            >

              <option value="">All Categories</option>

              {categories.map((category) => (

                <option key={category} value={category}>

                  {category}

                </option>

              ))}

            </select>

          </div>

        </div>

      </FilterDrawer>

      <BottomNavigation />

    </div>

  );

};

export default HotelsPage;