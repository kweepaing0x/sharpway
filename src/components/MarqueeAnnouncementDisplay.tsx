import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { MarqueeAnnouncement } from '../types';

interface MarqueeAnnouncementDisplayProps {
  targetPage: 'home' | 'store';
  storeId?: string;
}

const MarqueeAnnouncementDisplay: React.FC<MarqueeAnnouncementDisplayProps> = ({ 
  targetPage, 
  storeId 
}) => {
  const [announcements, setAnnouncements] = useState<MarqueeAnnouncement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchAnnouncements();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('marquee_announcements')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'marquee_announcements'
        },
        () => {
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [targetPage, storeId]);

  useEffect(() => {
    if (announcements.length > 1) {
      const interval = setInterval(() => {
        if (!isPaused) {
          setCurrentIndex((prevIndex) => 
            (prevIndex + 1) % announcements.length
          );
        }
      }, isMobile ? 8000 : 6000);

      return () => clearInterval(interval);
    }
  }, [announcements.length, isMobile, isPaused]);

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let query = supabase
        .from('marquee_announcements')
        .select('*')
        .eq('is_active', true)
        .eq('target_page', targetPage);

      // Add date filters
      const now = new Date().toISOString();
      query = query
        .lte('start_date', now)
        .or(`end_date.is.null,end_date.gte.${now}`);

      // Add store filter for store-specific announcements
      if (targetPage === 'store' && storeId) {
        query = query.eq('store_id', storeId);
      } else if (targetPage === 'home') {
        query = query.is('store_id', null);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Ensure data is an array and has valid content
      const validAnnouncements = (data || []).filter(
        (announcement: any) => 
          announcement && 
          announcement.content && 
          typeof announcement.content === 'string' &&
          announcement.content.trim().length > 0
      );

      setAnnouncements(validAnnouncements);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setError(error instanceof Error ? error.message : 'Failed to load announcements');
      setAnnouncements([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  // Don't render anything if loading or no announcements
  if (isLoading) {
    return null; // Or return a loading spinner if you prefer
  }

  if (error) {
    console.warn('Marquee error:', error);
    return null; // Fail silently in production
  }

  if (announcements.length === 0) {
    return null;
  }

  const currentAnnouncement = announcements[currentIndex];
  
  // Safety check for current announcement
  if (!currentAnnouncement || !currentAnnouncement.content) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white relative overflow-hidden shadow-lg">
      {/* Main marquee container */}
      <div 
        className={`flex items-center ${isMobile ? 'py-3 px-4' : 'py-2.5 px-6'}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleMouseEnter}
        onTouchEnd={handleMouseLeave}
      >
        {/* Icon */}
        <div className="flex-shrink-0 mr-3">
          <span className="text-yellow-300 animate-pulse text-lg">📢</span>
        </div>
        
        {/* Marquee content container */}
        <div 
          ref={containerRef}
          className="flex-1 min-w-0 overflow-hidden relative"
        >
          <div 
            ref={marqueeRef}
            className={`marquee-text whitespace-nowrap ${
              isMobile ? 'text-sm' : 'text-base'
            } font-medium ${isPaused ? 'paused' : ''}`}
            key={`${currentIndex}-${currentAnnouncement.id || currentIndex}`}
          >
            {currentAnnouncement.content}
          </div>
        </div>
        
        {/* Navigation indicators */}
        {announcements.length > 1 && (
          <div className="flex items-center ml-4 flex-shrink-0">
            {/* Desktop indicators */}
            {!isMobile && (
              <div className="flex items-center space-x-1.5">
                {announcements.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 hover:scale-110 ${
                      index === currentIndex 
                        ? 'bg-yellow-300 shadow-lg' 
                        : 'bg-white/40 hover:bg-white/60'
                    }`}
                    aria-label={`Show announcement ${index + 1}`}
                  />
                ))}
              </div>
            )}
            
            {/* Mobile counter */}
            {isMobile && (
              <div className="text-xs bg-black/25 px-2.5 py-1 rounded-full backdrop-blur-sm">
                {currentIndex + 1}/{announcements.length}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enhanced CSS with better marquee behavior */}
      <style jsx>{`
        .marquee-text {
          display: inline-block;
          animation: marquee-scroll 30s linear infinite;
          transform: translateX(100%);
        }
        
        .marquee-text.paused {
          animation-play-state: paused;
        }
        
        @keyframes marquee-scroll {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        
        /* Ensure smooth animation start */
        .marquee-text {
          will-change: transform;
          backface-visibility: hidden;
          perspective: 1000px;
        }

        /* Mobile optimizations */
        @media (max-width: 767px) {
          .marquee-text {
            animation-duration: 40s;
            font-size: 0.875rem;
            line-height: 1.4;
          }
        }

        /* Tablet optimizations */
        @media (min-width: 768px) and (max-width: 1023px) {
          .marquee-text {
            animation-duration: 38s;
          }
        }

        /* Large screen optimizations */
        @media (min-width: 1024px) {
          .marquee-text {
            animation-duration: 30s;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .marquee-text {
            background: #000;
            color: #fff;
            text-shadow: none;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .marquee-text {
            animation: none;
            transform: none;
            text-align: center;
          }
        }

        /* Focus styles for accessibility */
        button:focus-visible {
          outline: 2px solid #fbbf24;
          outline-offset: 2px;
        }

        /* Smooth transitions */
        * {
          transition: background-color 0.2s ease, transform 0.2s ease;
        }
      `}</style>
    </div>
  );
};

export default MarqueeAnnouncementDisplay;