import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Store } from '../../types';
import { Grid, List, Filter, Search } from 'lucide-react';
import Button from '../../components/ui/Button';
import BottomNavigation from '../../components/layout/BottomNavigation';
import MainHeader from '../../components/layout/MainHeader';

interface StoreCategory {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

const StoresPage: React.FC = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [storeCategories, setStoreCategories] = useState<StoreCategory[]>([]);
  const [locations, setLocations] = useState<string[]>([]);

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

  const fetchStores = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('is_active', true)
        .eq('approval_status', 'approved')
        .order('display_order', { ascending: true, nullsLast: true })
        .order('name');

      if (error) throw error;

      setStores(data || []);

      if (data && data.length > 0) {
        const uniqueLocations = Array.from(new Set(data.map((store) => store.location)))
          .filter(Boolean)
          .sort();
        setLocations(uniqueLocations);
      }
    } catch (error: any) {
      console.error('Error fetching stores:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
    fetchStoreCategories();
  }, [fetchStores, fetchStoreCategories]);

  const handleStoreClick = useCallback(
    (username: string) => {
      navigate(`/${username}`);
    },
    [navigate]
  );

  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      const matchesSearch =
        store.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        store.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || store.category === selectedCategory;
      const matchesLocation = !selectedLocation || store.location === selectedLocation;
      return matchesSearch && matchesCategory && matchesLocation;
    });
  }, [stores, debouncedSearchTerm, selectedCategory, selectedLocation]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 dark:bg-gray-900">
      <MainHeader onSearch={setSearchTerm} searchValue={searchTerm} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Stores</h1>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white py-2 pl-3 pr-10 text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {storeCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white py-2 pl-3 pr-10 text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>

            <div className="flex items-center space-x-2 ml-auto">
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'secondary'}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'secondary'}
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg dark:text-gray-400">No stores found</p>
            <Button
              variant="link"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setSelectedLocation('');
              }}
              className="mt-2"
            >
              Clear filters
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStores.map((store) => {
              const category = storeCategories.find((cat) => cat.id === store.category);
              return (
                <div
                  key={store.id}
                  onClick={() => handleStoreClick(store.username)}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                >
                  <div className="relative h-32 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
                    {store.logo_url ? (
                      <img
                        src={store.logo_url}
                        alt={store.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                          {store.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                      {store.name}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                      {store.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
                        {category?.name || store.category}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
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
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredStores.map((store) => {
                const category = storeCategories.find((cat) => cat.id === store.category);
                return (
                  <li
                    key={store.id}
                    onClick={() => handleStoreClick(store.username)}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="px-6 py-4 flex items-center">
                      <div className="flex-shrink-0 h-16 w-16">
                        {store.logo_url ? (
                          <img
                            src={store.logo_url}
                            alt={store.name}
                            className="h-16 w-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <span className="text-xl font-bold text-blue-600 dark:text-blue-300">
                              {store.name.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {store.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">
                          {store.description}
                        </p>
                      </div>
                      <div className="ml-4 flex flex-col items-end">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded">
                          {category?.name || store.category}
                        </span>
                        <span className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {store.location}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default StoresPage;
