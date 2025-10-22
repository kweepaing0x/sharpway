import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Manager {
  id: string;
  user_id: string;
  taxi_id: string;
  is_active: boolean;
}

interface Taxi {
  id: string;
  driver_name: string;
  description: string;
  photo_url?: string;
  vehicle_type: string;
  availability_status: boolean;
  phone_number: string;
  telegram_contact: string;
  location: string;
  is_active: boolean;
  username: string;
}

interface TaxiManagerAuthContextType {
  manager: Manager | null;
  taxi: Taxi | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

const TaxiManagerAuthContext = createContext<TaxiManagerAuthContextType | undefined>(undefined);

export const TaxiManagerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [manager, setManager] = useState<Manager | null>(null);
  const [taxi, setTaxi] = useState<Taxi | null>(null);
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

      if (userError || userData?.role !== 'taxi-manager') {
        console.error('User is not a taxi manager or role not found:', userError);
        await supabase.auth.signOut();
        return false;
      }

      const { data: managerData, error: managerError } = await supabase
        .from('taxi_managers')
        .select('*, taxis(*)')
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
        taxi_id: managerData.taxi_id,
        is_active: managerData.is_active
      });

      setTaxi(managerData.taxis);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setManager(null);
    setTaxi(null);
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

      if (userError || userData?.role !== 'taxi-manager') {
        setLoading(false);
        return false;
      }

      const { data: managerData, error: managerError } = await supabase
        .from('taxi_managers')
        .select('*, taxis(*)')
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
        taxi_id: managerData.taxi_id,
        is_active: managerData.is_active
      });

      setTaxi(managerData.taxis);
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
    taxi,
    loading,
    login,
    logout,
    changePassword
  };

  return (
    <TaxiManagerAuthContext.Provider value={value}>
      {children}
    </TaxiManagerAuthContext.Provider>
  );
};

export const useTaxiManagerAuth = () => {
  const context = useContext(TaxiManagerAuthContext);
  if (context === undefined) {
    throw new Error('useTaxiManagerAuth must be used within a TaxiManagerAuthProvider');
  }
  return context;
};
