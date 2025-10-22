import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { PopUpAd } from '../types';
import { X } from 'lucide-react';

interface PopUpAdDisplayProps {
  targetPage: 'home' | 'store';
  storeId?: string;
}

const PopUpAdDisplay: React.FC<PopUpAdDisplayProps> = ({ 
  targetPage, 
  storeId 
}) => {
  const [currentAd, setCurrentAd] = useState<PopUpAd | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [sessionShownAds, setSessionShownAds] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchAndShowAd();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('pop_up_ads')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pop_up_ads'
        },
        () => {
          fetchAndShowAd();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [targetPage, storeId]);

  const fetchAndShowAd = async () => {
    try {
      let query = supabase
        .from('pop_up_ads')
        .select('*')
        .eq('is_active', true)
        .eq('target_page', targetPage);

      // Add date filters
      const now = new Date().toISOString();
      query = query
        .lte('start_date', now)
        .or(`end_date.is.null,end_date.gte.${now}`);

      // Add store filter for store-specific ads
      if (targetPage === 'store' && storeId) {
        query = query.eq('store_id', storeId);
      } else if (targetPage === 'home') {
        query = query.is('store_id', null);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const ads = data || [];
      
      if (ads.length > 0) {
        // Filter ads based on display frequency
        const eligibleAds = ads.filter(ad => {
          if (ad.display_frequency === 'once_per_session') {
            return !sessionShownAds.has(ad.id);
          }
          return true; // 'every_visit' ads are always eligible
        });

        if (eligibleAds.length > 0) {
          // Select a random ad from eligible ads
          const randomAd = eligibleAds[Math.floor(Math.random() * eligibleAds.length)];
          showAd(randomAd);
        }
      }
    } catch (error) {
      console.error('Error fetching ads:', error);
    }
  };

  const showAd = (ad: PopUpAd) => {
    setCurrentAd(ad);
    setIsVisible(true);
    
    // Mark as shown for this session if it's a once-per-session ad
    if (ad.display_frequency === 'once_per_session') {
      setSessionShownAds(prev => new Set(prev).add(ad.id));
    }

    // Auto-close after 10 seconds (15 seconds on mobile for better UX)
    setTimeout(() => {
      setIsVisible(false);
    }, isMobile ? 15000 : 10000);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleAdClick = () => {
    if (currentAd?.link_url) {
      window.open(currentAd.link_url, '_blank', 'noopener,noreferrer');
    }
    setIsVisible(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close on backdrop click for desktop
    if (!isMobile && e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!currentAd || !isVisible) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
        onClick={handleBackdropClick}
        style={{
          padding: isMobile ? '16px' : '24px'
        }}
      >
        {/* Ad Container */}
        <div 
          className={`relative bg-white rounded-lg shadow-2xl overflow-hidden animate-scale-in ${
            isMobile 
              ? 'w-full max-w-sm max-h-[80vh]' 
              : 'max-w-md w-full max-h-[80vh]'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className={`absolute top-2 right-2 z-10 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors ${
              isMobile ? 'p-2 touch-manipulation' : 'p-1'
            }`}
            aria-label="Close advertisement"
          >
            <X className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
          </button>

          {/* Ad Content */}
          <div 
            className={`relative ${currentAd.link_url ? 'cursor-pointer' : ''}`}
            onClick={currentAd.link_url ? handleAdClick : undefined}
          >
            <img
              src={currentAd.image_url}
              alt="Advertisement"
              className="w-full h-auto object-cover"
              style={{ 
                maxHeight: isMobile ? '60vh' : '70vh',
                minHeight: isMobile ? '200px' : '300px'
              }}
              loading="lazy"
            />
            
            {/* Click to learn more overlay */}
            {currentAd.link_url && (
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-colors flex items-center justify-center">
                <div className={`bg-white bg-opacity-90 px-4 py-2 rounded-full font-medium text-gray-800 opacity-0 hover:opacity-100 transition-opacity ${
                  isMobile ? 'text-sm' : 'text-sm'
                }`}>
                  {isMobile ? 'Tap to learn more' : 'Click to learn more'}
                </div>
              </div>
            )}
          </div>

          {/* Mobile-specific bottom action area */}
          {isMobile && currentAd.link_url && (
            <div className="p-3 bg-gray-50 border-t">
              <button
                onClick={handleAdClick}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors touch-manipulation"
              >
                Learn More
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          0% {
            transform: scale(0.9);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        /* Mobile-specific styles */
        @media (max-width: 767px) {
          .animate-scale-in {
            animation: scale-in 0.2s ease-out;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .bg-black.bg-opacity-50 {
            background-color: rgba(0, 0, 0, 0.8);
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .animate-scale-in {
            animation: none;
          }
        }

        /* Touch-friendly close button */
        @media (max-width: 767px) {
          button[aria-label="Close advertisement"] {
            min-width: 44px;
            min-height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
};

export default PopUpAdDisplay;

