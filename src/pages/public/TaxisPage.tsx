import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Taxi } from '../../types';
import { Phone, MessageCircle, Search, SlidersHorizontal, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import BottomNavigation from '../../components/layout/BottomNavigation';
import FloatingActionButton from '../../components/mobile/FloatingActionButton';
import SearchOverlay from '../../components/mobile/SearchOverlay';
import FilterDrawer from '../../components/mobile/FilterDrawer';
import { generateTaxiHireMessage, openTelegramLink } from '../../utils/telegram';

const TaxisPage: React.FC = () => {
  const [taxis, setTaxis] = useState<Taxi[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedVehicleType, setSelectedVehicleType] = useState<'all' | 'motorcycle' | 'car'>('all');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [locations, setLocations] = useState<string[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const stored = localStorage.getItem('taxi_recent_searches');
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  const saveRecentSearch = useCallback((search: string) => {
    if (!search.trim()) return;
    const updated = [search, ...recentSearches.filter(s => s !== search)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('taxi_recent_searches', JSON.stringify(updated));
  }, [recentSearches]);

  const fetchTaxis = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('taxis')
        .select('*')
        .eq('is_active', true)
        .eq('approval_status', 'approved')
        .order('display_order', { ascending: true, nullsLast: true })
        .order('driver_name');

      if (error) throw error;

      setTaxis(data || []);

      if (data && data.length > 0) {
        const uniqueLocations = Array.from(new Set(data.map((taxi) => taxi.location)))
          .filter(Boolean)
          .sort();
        setLocations(uniqueLocations);
      }
    } catch (error: any) {
      console.error('Error fetching taxis:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTaxis();
  }, [fetchTaxis]);

  const filteredTaxis = useMemo(() => {
    return taxis.filter((taxi) => {
      const matchesSearch =
        taxi.driver_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        taxi.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesVehicleType = selectedVehicleType === 'all' || taxi.vehicle_type === selectedVehicleType;
      const matchesLocation = !selectedLocation || taxi.location === selectedLocation;
      const matchesAvailability = !showOnlyAvailable || taxi.availability_status;
      return matchesSearch && matchesVehicleType && matchesLocation && matchesAvailability;
    });
  }, [taxis, debouncedSearchTerm, selectedVehicleType, selectedLocation, showOnlyAvailable]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedVehicleType !== 'all') count++;
    if (selectedLocation) count++;
    if (showOnlyAvailable) count++;
    return count;
  }, [selectedVehicleType, selectedLocation, showOnlyAvailable]);

  const handlePhoneCall = (phoneNumber: string) => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleTelegramMessage = (taxi: Taxi) => {
    const message = generateTaxiHireMessage(taxi.driver_name, taxi.vehicle_type, taxi.location);
    openTelegramLink(taxi.telegram_contact, message);
  };

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    if (value.trim()) {
      saveRecentSearch(value);
    }
  }, [saveRecentSearch]);

  const handleResetFilters = () => {
    setSelectedVehicleType('all');
    setSelectedLocation('');
    setShowOnlyAvailable(false);
  };

  return (
    <div className="min-h-screen bg-theme-primary pb-20">
      <div className="sticky top-0 z-40 bg-theme-card border-b border-theme shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-theme-primary">Taxis</h1>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2.5 hover:bg-theme-tertiary rounded-full transition-colors"
              aria-label="Search taxis"
            >
              <Search className="w-5 h-5 text-theme-secondary" />
            </button>
          </div>

          {debouncedSearchTerm && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-theme-secondary">Searching for:</span>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-cyan/10 border border-accent-cyan/30 rounded-full">
                <span className="text-sm font-medium text-accent-cyan">{debouncedSearchTerm}</span>
                <button
                  onClick={() => setSearchTerm('')}
                  className="p-0.5 hover:bg-accent-cyan/20 rounded-full transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-accent-cyan" />
                </button>
              </div>
            </div>
          )}

          {activeFilterCount > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedVehicleType !== 'all' && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-purple/10 border border-accent-purple/30 rounded-full">
                  <span className="text-sm font-medium text-accent-purple capitalize">{selectedVehicleType}</span>
                  <button
                    onClick={() => setSelectedVehicleType('all')}
                    className="p-0.5 hover:bg-accent-purple/20 rounded-full transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-accent-purple" />
                  </button>
                </div>
              )}
              {selectedLocation && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-purple/10 border border-accent-purple/30 rounded-full">
                  <span className="text-sm font-medium text-accent-purple">{selectedLocation}</span>
                  <button
                    onClick={() => setSelectedLocation('')}
                    className="p-0.5 hover:bg-accent-purple/20 rounded-full transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-accent-purple" />
                  </button>
                </div>
              )}
              {showOnlyAvailable && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-green/10 border border-accent-green/30 rounded-full">
                  <span className="text-sm font-medium text-accent-green">Available Only</span>
                  <button
                    onClick={() => setShowOnlyAvailable(false)}
                    className="p-0.5 hover:bg-accent-green/20 rounded-full transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-accent-green" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-cyan"></div>
          </div>
        ) : filteredTaxis.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-theme-tertiary mx-auto mb-4" />
            <p className="text-theme-secondary text-lg mb-4">No taxis found</p>
            {(searchTerm || activeFilterCount > 0) && (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchTerm('');
                  handleResetFilters();
                }}
                className="mx-auto bg-accent-cyan hover:bg-accent-cyan/90 text-black"
              >
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTaxis.map((taxi) => (
              <div
                key={taxi.id}
                className="bg-theme-card rounded-2xl border border-theme overflow-hidden transition-all duration-300 hover:border-accent-cyan/50 hover:shadow-lg hover:shadow-accent-cyan/10"
              >
                <div className="p-4 flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    {taxi.photo_url ? (
                      <img
                        src={taxi.photo_url}
                        alt={taxi.driver_name}
                        className="w-20 h-20 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-accent-orange/20 to-accent-cyan/20 flex items-center justify-center border border-accent-cyan/30">
                        <span className="text-2xl font-bold text-accent-cyan">
                          {taxi.driver_name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div
                      className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-theme-card ${
                        taxi.availability_status ? 'bg-accent-green glow-green' : 'bg-theme-tertiary'
                      }`}
                      title={taxi.availability_status ? 'Available' : 'Unavailable'}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-theme-primary mb-1">
                      {taxi.driver_name}
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-accent-purple/20 border border-accent-purple/30 text-accent-purple capitalize mb-2">
                      {taxi.vehicle_type}
                    </span>
                    {taxi.description && (
                      <p className="text-sm text-theme-secondary line-clamp-1 mb-2">
                        {taxi.description}
                      </p>
                    )}
                    <div className="flex items-center text-sm text-theme-tertiary">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {taxi.location}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 px-4 pb-4">
                  <button
                    onClick={() => handlePhoneCall(taxi.phone_number)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-theme-tertiary hover:bg-accent-orange/20 border border-accent-orange/30 text-accent-orange rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95"
                  >
                    <Phone className="h-4 w-4" />
                    <span className="font-medium">Call</span>
                  </button>
                  <button
                    onClick={() => handleTelegramMessage(taxi)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-cyan hover:bg-accent-cyan/90 text-black rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95 glow-cyan"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="font-medium">Message</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
        placeholder="Search taxis by name or description..."
        recentSearches={recentSearches}
        onRecentSearchClick={(search) => {
          setSearchTerm(search);
          setIsSearchOpen(false);
        }}
        onClearRecent={() => {
          setRecentSearches([]);
          localStorage.removeItem('taxi_recent_searches');
        }}
      />

      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={() => {}}
        onReset={handleResetFilters}
        title="Filter Taxis"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-theme-primary mb-3">
              Vehicle Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['all', 'motorcycle', 'car'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedVehicleType(type)}
                  className={`
                    px-4 py-3 rounded-xl text-sm font-medium capitalize transition-all duration-200
                    ${selectedVehicleType === type
                      ? 'bg-accent-purple text-white glow-purple'
                      : 'bg-theme-tertiary text-theme-secondary hover:bg-theme-tertiary/80'
                    }
                  `}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-theme-primary mb-3">
              Location
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-4 py-3 bg-theme-input border border-theme rounded-xl text-theme-primary focus:outline-none focus:ring-2 focus:ring-accent-purple focus:border-transparent"
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
            <label className="flex items-center gap-3 px-4 py-3 bg-theme-tertiary rounded-xl cursor-pointer hover:bg-theme-tertiary/80 transition-colors">
              <input
                type="checkbox"
                checked={showOnlyAvailable}
                onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                className="w-5 h-5 rounded bg-theme-input border-theme text-accent-green focus:ring-2 focus:ring-accent-green"
              />
              <span className="text-sm font-medium text-theme-primary">
                Show only available taxis
              </span>
            </label>
          </div>
        </div>
      </FilterDrawer>

      <BottomNavigation />
    </div>
  );
};

export default TaxisPage;
