import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { SponsoredContent } from '../types';

const SponsoredCarousel: React.FC = () => {
  const [sponsoredItems, setSponsoredItems] = useState<SponsoredContent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    fetchSponsoredContent();
  }, []);

  const fetchSponsoredContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sponsored_content')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', new Date().toISOString())
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setSponsoredItems(data || []);
    } catch (error) {
      console.error('Error fetching sponsored content:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = useCallback(() => {
    if (sponsoredItems.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % sponsoredItems.length);
    }
  }, [sponsoredItems.length]);

  const prevSlide = () => {
    if (sponsoredItems.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + sponsoredItems.length) % sponsoredItems.length);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  useEffect(() => {
    if (isAutoPlaying && sponsoredItems.length > 1) {
      const interval = setInterval(nextSlide, 5000);
      return () => clearInterval(interval);
    }
  }, [isAutoPlaying, nextSlide, sponsoredItems.length]);

  const handleItemClick = (redirectUrl: string) => {
    window.open(redirectUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="w-full py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (sponsoredItems.length === 0) {
    return null;
  }

  return (
    <div className="w-full py-8 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Featured Content</h2>
          <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs font-medium rounded-full">
            Sponsored
          </span>
        </div>

        <div className="relative group">
          <div className="overflow-hidden rounded-lg">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {sponsoredItems.map((item) => (
                <div
                  key={item.id}
                  className="w-full flex-shrink-0 cursor-pointer"
                  onClick={() => handleItemClick(item.redirect_url)}
                >
                  <div className="relative h-64 md:h-80 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-lg overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                      <h3 className="text-white text-xl font-bold">{item.title}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {sponsoredItems.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-6 w-6 text-gray-800 dark:text-white" />
              </button>

              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Next slide"
              >
                <ChevronRight className="h-6 w-6 text-gray-800 dark:text-white" />
              </button>

              <div className="flex justify-center mt-4 gap-2">
                {sponsoredItems.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? 'w-8 bg-blue-600 dark:bg-blue-400'
                        : 'w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SponsoredCarousel;
