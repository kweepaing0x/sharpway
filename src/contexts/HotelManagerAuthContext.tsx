import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Manager {
  id: string;
  user_id: string;
  hotel_id: string;
  is_active: boolean;
}

interface Hotel {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  location: string;
  category: string;
  is_active: boolean;
  username: string;
  telegram_contact: string;
  phone_number?: string;
  channel_url?: string;
}

interface HotelManagerAuthContextType {
  manager: Manager | null;
  hotel: Hotel | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

const HotelManagerAuthContext = createContext<HotelManagerAuthContextType | undefined>(undefined);

export const HotelManagerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [manager, setManager] = useState<Manager | null>(null);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError || !authData.user) {
        console.error('Login error:', authError);
        return false;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (userError || userData?.role !== 'hotel-manager') {
        console.error('User is not a hotel manager or role not found:', userError);
        await supabase.auth.signOut();
        return false;
      }

      const { data: managerData, error: managerError } = await supabase
        .from('hotel_managers')
        .select('*, hotels(*)')
        .eq('user_id', authData.user.id)
        .eq('is_active', true)
        .single();

      if (managerError || !managerData) {
        console.error('Manager data error or not active:', managerError);
        await supabase.auth.signOut();
        return false;
      }

      setManager({
        id: managerData.id,
        user_id: managerData.user_id,
        hotel_id: managerData.hotel_id,
        is_active: managerData.is_active
      });

      setHotel(managerData.hotels);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setManager(null);
    setHotel(null);
  };

  const verifySession = async (): Promise<boolean> => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setLoading(false);
        return false;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (userError || userData?.role !== 'hotel-manager') {
        setLoading(false);
        return false;
      }

      const { data: managerData, error: managerError } = await supabase
        .from('hotel_managers')
        .select('*, hotels(*)')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .single();

      if (managerError || !managerData) {
        setLoading(false);
        return false;
      }

      setManager({
        id: managerData.id,
        user_id: managerData.user_id,
        hotel_id: managerData.hotel_id,
        is_active: managerData.is_active
      });

      setHotel(managerData.hotels);
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Session verification error:', error);
      setLoading(false);
      return false;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Change password error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Change password error:', error);
      return false;
    }
  };

  useEffect(() => {
    verifySession();
  }, []);

  const value = {
    manager,
    hotel,
    loading,
    login,
    logout,
    changePassword
  };

  return (
    <HotelManagerAuthContext.Provider value={value}>
      {children}
    </HotelManagerAuthContext.Provider>
  );
};

export const useHotelManagerAuth = () => {
  const context = useContext(HotelManagerAuthContext);
  if (context === undefined) {
    throw new Error('useHotelManagerAuth must be used within a HotelManagerAuthProvider');
  }
  return context;
};
