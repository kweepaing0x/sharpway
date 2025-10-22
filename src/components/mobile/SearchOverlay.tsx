import React, { useEffect, useRef } from 'react';
import { ArrowLeft, Search, X } from 'lucide-react';
import { useEscapeKey } from '../../contexts/NavigationStackContext';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  recentSearches?: string[];
  onRecentSearchClick?: (search: string) => void;
  onClearRecent?: () => void;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({
  isOpen,
  onClose,
  searchValue,
  onSearchChange,
  placeholder = 'Search...',
  recentSearches = [],
  onRecentSearchClick,
  onClearRecent
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEscapeKey(onClose, isOpen);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-theme-primary">
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-theme bg-theme-card">
          <button
            onClick={onClose}
            className="p-2 hover:bg-theme-tertiary rounded-full transition-colors"
            aria-label="Close search"
          >
            <ArrowLeft className="w-5 h-5 text-theme-secondary" />
          </button>

          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-theme-tertiary" />
            </div>
            <input
              ref={inputRef}
              type="search"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={placeholder}
              className="
                block w-full pl-10 pr-10 py-2.5
                bg-theme-input border border-theme rounded-full
                text-theme-primary placeholder-theme-tertiary
                focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent
                transition-all duration-200
              "
            />
            {searchValue && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                aria-label="Clear search"
              >
                <X className="h-5 w-5 text-theme-secondary hover:text-theme-primary transition-colors" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {!searchValue && recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-theme-secondary uppercase tracking-wider">
                  Recent Searches
                </h3>
                {onClearRecent && (
                  <button
                    onClick={onClearRecent}
                    className="text-xs text-accent-cyan hover:text-accent-cyan/80 transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => onRecentSearchClick?.(search)}
                    className="
                      w-full flex items-center gap-3 px-4 py-3
                      bg-theme-card hover:bg-theme-tertiary
                      border border-theme rounded-lg
                      text-left text-theme-primary
                      transition-colors duration-200
                      group
                    "
                  >
                    <Search className="w-4 h-4 text-theme-tertiary group-hover:text-accent-cyan transition-colors" />
                    <span className="flex-1">{search}</span>
                    <ArrowLeft className="w-4 h-4 text-theme-tertiary rotate-180" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {searchValue && (
            <div className="text-center py-8 text-theme-secondary">
              <p className="text-sm">Searching for "{searchValue}"...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchOverlay;
