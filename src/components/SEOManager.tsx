import React, { useEffect } from 'react';
import { useAppSettingsStore } from '../stores/useAppSettingsStore';

interface SEOManagerProps {
  currentPage: 'home' | 'store' | 'other';
  storeId?: string;
  storeData?: {
    name: string;
    description?: string;
    location?: string;
    category?: string;
    keywords?: string[];
  };
}

const SEOManager: React.FC<SEOManagerProps> = ({ 
  currentPage, 
  storeId, 
  storeData 
}) => {
  const { settings, fetchSettings } = useAppSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (!settings) return;

    // Update robots meta tag
    updateRobotsMetaTag();
    
    // Update Google Analytics
    updateGoogleAnalytics();
    
    // Update page-specific SEO meta tags
    updatePageMetaTags();
    
    // Update structured data for stores
    if (currentPage === 'store' && storeData) {
      updateStructuredData();
    }
  }, [settings, currentPage, storeId, storeData]);

  const updateRobotsMetaTag = () => {
    if (!settings) return;

    // Remove existing robots meta tag
    const existingRobotsTag = document.querySelector('meta[name="robots"]');
    if (existingRobotsTag) {
      existingRobotsTag.remove();
    }

    // Determine if current page should be indexed
    const shouldIndex = settings.enable_google_indexing && 
                       (currentPage === 'other' || settings.indexed_pages.includes(currentPage));

    // Create new robots meta tag
    const robotsTag = document.createElement('meta');
    robotsTag.name = 'robots';
    robotsTag.content = shouldIndex ? 'index, follow' : 'noindex, nofollow';
    
    document.head.appendChild(robotsTag);
  };

  const updatePageMetaTags = () => {
    if (!settings) return;

    // Update title
    updateMetaTag('title', generatePageTitle());
    
    // Update description
    updateMetaTag('description', generatePageDescription());
    
    // Update keywords
    const keywords = generatePageKeywords();
    if (keywords) {
      updateMetaTag('keywords', keywords);
    }

    // Update Open Graph tags
    updateOpenGraphTags();
  };

  const generatePageTitle = (): string => {
    const siteName = settings.site_name || 'shopview';
    
    switch (currentPage) {
      case 'home':
        return settings.default_meta_title || `${siteName} - Your Premier Shopping Destination`;
      case 'store':
        if (storeData?.name) {
          return `${storeData.name} - ${siteName}`;
        }
        return `Store - ${siteName}`;
      default:
        return siteName;
    }
  };

  const generatePageDescription = (): string => {
    switch (currentPage) {
      case 'home':
        return settings.default_meta_description || 
               settings.site_description || 
               'Discover amazing stores and products at MyMall. Your one-stop shopping destination with the best deals and variety.';
      case 'store':
        if (storeData?.description) {
          return storeData.description;
        }
        if (storeData?.name && storeData?.location) {
          return `Visit ${storeData.name} located in ${storeData.location}. Discover great products and deals.`;
        }
        return 'Discover great products and deals at this store.';
      default:
        return settings.site_description || 'MyMall - Your Premier Shopping Destination';
    }
  };

  const generatePageKeywords = (): string | null => {
    const baseKeywords = settings.default_meta_keywords ? 
                        settings.default_meta_keywords.split(',').map(k => k.trim()) : 
                        ['shopping', 'mall', 'online store', 'products'];

    switch (currentPage) {
      case 'home':
        return baseKeywords.join(', ');
      case 'store':
        const storeKeywords = [...baseKeywords];
        if (storeData?.name) {
          storeKeywords.push(storeData.name);
        }
        if (storeData?.category) {
          storeKeywords.push(storeData.category);
        }
        if (storeData?.location) {
          storeKeywords.push(storeData.location);
        }
        if (storeData?.keywords) {
          storeKeywords.push(...storeData.keywords);
        }
        return storeKeywords.join(', ');
      default:
        return null;
    }
  };

  const updateMetaTag = (name: string, content: string) => {
    if (name === 'title') {
      document.title = content;
      return;
    }

    // Remove existing meta tag
    const existingTag = document.querySelector(`meta[name="${name}"]`);
    if (existingTag) {
      existingTag.remove();
    }

    // Create new meta tag
    const metaTag = document.createElement('meta');
    metaTag.name = name;
    metaTag.content = content;
    document.head.appendChild(metaTag);
  };

  const updateOpenGraphTags = () => {
    const title = generatePageTitle();
    const description = generatePageDescription();
    const siteName = settings.site_name || 'MyMall';

    // Update Open Graph tags
    updateOGTag('og:title', title);
    updateOGTag('og:description', description);
    updateOGTag('og:site_name', siteName);
    updateOGTag('og:type', currentPage === 'store' ? 'business.business' : 'website');
    
    if (settings.site_logo_url) {
      updateOGTag('og:image', settings.site_logo_url);
    }

    // Twitter Card tags
    updateOGTag('twitter:card', 'summary_large_image');
    updateOGTag('twitter:title', title);
    updateOGTag('twitter:description', description);
    
    if (settings.site_logo_url) {
      updateOGTag('twitter:image', settings.site_logo_url);
    }
  };

  const updateOGTag = (property: string, content: string) => {
    // Remove existing tag
    const existingTag = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
    if (existingTag) {
      existingTag.remove();
    }

    // Create new tag
    const metaTag = document.createElement('meta');
    if (property.startsWith('twitter:')) {
      metaTag.name = property;
    } else {
      metaTag.setAttribute('property', property);
    }
    metaTag.content = content;
    document.head.appendChild(metaTag);
  };

  const updateStructuredData = () => {
    if (!storeData) return;

    // Remove existing structured data
    const existingStructuredData = document.querySelector('script[type="application/ld+json"]');
    if (existingStructuredData) {
      existingStructuredData.remove();
    }

    // Create structured data for the store
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": storeData.name,
      "description": storeData.description || `Visit ${storeData.name} for great products and deals.`,
      "url": window.location.href,
      ...(storeData.location && {
        "address": {
          "@type": "PostalAddress",
          "addressLocality": storeData.location
        }
      }),
      ...(storeData.category && {
        "category": storeData.category
      }),
      "potentialAction": {
        "@type": "ViewAction",
        "target": window.location.href
      }
    };

    // Add structured data script
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
  };

  const updateGoogleAnalytics = () => {
    if (!settings?.google_analytics_measurement_id) {
      // Remove existing Google Analytics if no measurement ID
      removeGoogleAnalytics();
      return;
    }

    const measurementId = settings.google_analytics_measurement_id;

    // Check if Google Analytics is already loaded with the same ID
    if (window.gtag && (window as any).gaLoaded === measurementId) {
      // Track page view for current page
      trackPageView();
      return;
    }

    // Remove existing Google Analytics
    removeGoogleAnalytics();

    // Add Google Analytics script
    const gtagScript = document.createElement('script');
    gtagScript.async = true;
    gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(gtagScript);

    // Add Google Analytics configuration script
    const configScript = document.createElement('script');
    configScript.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}', {
        page_title: '${generatePageTitle()}',
        page_location: '${window.location.href}'
      });
    `;
    document.head.appendChild(configScript);

    // Mark as loaded
    (window as any).gaLoaded = measurementId;
  };

  const trackPageView = () => {
    if (window.gtag) {
      window.gtag('config', settings?.google_analytics_measurement_id, {
        page_title: generatePageTitle(),
        page_location: window.location.href
      });
    }
  };

  const removeGoogleAnalytics = () => {
    // Remove existing Google Analytics scripts
    const existingGtagScripts = document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]');
    existingGtagScripts.forEach(script => script.remove());

    const existingConfigScripts = document.querySelectorAll('script');
    existingConfigScripts.forEach(script => {
      if (script.innerHTML.includes('gtag(') && script.innerHTML.includes('config')) {
        script.remove();
      }
    });

    // Clear gtag function and dataLayer
    delete (window as any).gtag;
    delete (window as any).dataLayer;
    delete (window as any).gaLoaded;
  };

  return null; // This component doesn't render anything
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export default SEOManager;