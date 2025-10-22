import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

interface AppSettings {
  site_name: string;
  site_description: string;
  site_logo_url?: string;
  enable_google_indexing: boolean;
  indexed_pages: string[];
  google_analytics_measurement_id?: string;
  google_search_console_verification?: string;
  default_meta_title?: string;
  default_meta_description?: string;
  default_meta_keywords?: string;
  home_page_mode: 'directory' | 'marketing';
  featured_stores_limit: number;
  default_currency: string;
  maintenance_mode: boolean;
  maintenance_message?: string;
}

interface AppSettingsState {
  settings: AppSettings | null;
  loading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  updateSetting: (key: keyof AppSettings, value: any) => Promise<void>;
}

const defaultSettings: AppSettings = {
  site_name: 'MyMall',
  site_description: 'Your premier online shopping destination',
  enable_google_indexing: true,
  indexed_pages: ['home', 'store'],
  home_page_mode: 'directory',
  featured_stores_limit: 10,
  default_currency: 'THB',
  maintenance_mode: false,
};

export const useAppSettingsStore = create<AppSettingsState>((set, get) => ({
  settings: null,
  loading: false,
  error: null,

  fetchSettings: async () => {
    set({ loading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value');

      if (error) throw error;

      // Convert key-value pairs to settings object
      const settings: Partial<AppSettings> = { ...defaultSettings };
      
      data?.forEach(({ key, value }) => {
        switch (key) {
          case 'site_name':
          case 'site_description':
          case 'site_logo_url':
          case 'google_analytics_measurement_id':
          case 'google_search_console_verification':
          case 'default_meta_title':
          case 'default_meta_description':
          case 'default_meta_keywords':
          case 'default_currency':
          case 'maintenance_message':
            settings[key] = value || '';
            break;
          case 'enable_google_indexing':
          case 'maintenance_mode':
            settings[key] = value === 'true';
            break;
          case 'indexed_pages':
            try {
              settings[key] = JSON.parse(value || '["home", "store"]');
            } catch {
              settings[key] = ['home', 'store'];
            }
            break;
          case 'home_page_mode':
            settings[key] = (value === 'marketing' ? 'marketing' : 'directory') as 'directory' | 'marketing';
            break;
          case 'featured_stores_limit':
            settings[key] = parseInt(value || '10', 10);
            break;
        }
      });

      set({ settings: settings as AppSettings, loading: false });
    } catch (error: any) {
      console.error('Error fetching app settings:', error);
      set({ error: error.message, loading: false, settings: defaultSettings });
    }
  },

  updateSetting: async (key: keyof AppSettings, value: any) => {
    set({ loading: true, error: null });

    try {
      let stringValue: string;
      
      // Convert value to string based on type
      if (typeof value === 'boolean') {
        stringValue = value.toString();
      } else if (Array.isArray(value)) {
        stringValue = JSON.stringify(value);
      } else {
        stringValue = String(value);
      }

      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: key,
          value: stringValue,
          updated_at: new Date().toISOString(),
          updated_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      // Update local state
      const currentSettings = get().settings || defaultSettings;
      const updatedSettings = { ...currentSettings, [key]: value };
      set({ settings: updatedSettings, loading: false });
    } catch (error: any) {
      console.error('Error updating app setting:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateSettings: async (updates: Partial<AppSettings>) => {
    set({ loading: true, error: null });

    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const updatePromises = Object.entries(updates).map(([key, value]) => {
        let stringValue: string;
        
        // Convert value to string based on type
        if (typeof value === 'boolean') {
          stringValue = value.toString();
        } else if (Array.isArray(value)) {
          stringValue = JSON.stringify(value);
        } else {
          stringValue = String(value);
        }

        return supabase
          .from('app_settings')
          .upsert({
            key: key,
            value: stringValue,
            updated_at: new Date().toISOString(),
            updated_by: userId
          });
      });

      const results = await Promise.all(updatePromises);
      
      // Check for errors
      results.forEach(result => {
        if (result.error) throw result.error;
      });

      // Update local state
      const currentSettings = get().settings || defaultSettings;
      const updatedSettings = { ...currentSettings, ...updates };
      set({ settings: updatedSettings, loading: false });
    } catch (error: any) {
      console.error('Error updating app settings:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  }
}));

