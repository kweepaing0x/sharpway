import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Manager {
  id: string;
  user_id: string;
  store_id: string;
  is_active: boolean;
}

interface Store {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  location: string;
  category: string;
  is_active: boolean;
  is_verified: boolean;
  username: string;
  payment_methods: {
    kpay: boolean;
    usdt: boolean;
    cod: boolean;
    wallet_addresses: {
      kpay?: string;
      usdt?: string;
    };
  };
}

interface StoreManagerAuthContextType {
  manager: Manager | null;
  store: Store | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

const StoreManagerAuthContext = createContext<StoreManagerAuthContextType | undefined>(undefined);

export const StoreManagerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [manager, setManager] = useState<Manager | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Sign in with Supabase auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError || !authData.user) {
        console.error('Login error:', authError);
        return false;
      }

      // Verify user role from the 'users' table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (userError || userData?.role !== 'store-manager') {
        console.error('User is not a store manager or role not found:', userError);
        await supabase.auth.signOut(); // Sign out if not a store manager
        return false;
      }

      // Check if the user is an active store manager in the store_managers table
      const { data: managerData, error: managerError } = await supabase
        .from('store_managers')
        .select('*, stores(*)')
        .eq('user_id', authData.user.id)
        .eq('is_active', true)
        .single();

      if (managerError || !managerData) {
        console.error('Manager data error or not active:', managerError);
        await supabase.auth.signOut(); // Sign out if not an active store manager
        return false;
      }

      setManager({
        id: managerData.id,
        user_id: managerData.user_id,
        store_id: managerData.store_id,
        is_active: managerData.is_active
      });
      
      setStore(managerData.stores);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setManager(null);
    setStore(null);
  };

  const verifySession = async (): Promise<boolean> => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setLoading(false);
        return false;
      }

      // Verify user role from the 'users' table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (userError || userData?.role !== 'store-manager') {
        setLoading(false);
        return false;
      }

      // Check if the user is an active store manager
      const { data: managerData, error: managerError } = await supabase
        .from('store_managers')
        .select('*, stores(*)')
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
        store_id: managerData.store_id,
        is_active: managerData.is_active
      });
      
      setStore(managerData.stores);
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
    store,
    loading,
    login,
    logout,
    changePassword
  };

  return (
    <StoreManagerAuthContext.Provider value={value}>
      {children}
    </StoreManagerAuthContext.Provider>
  );
};

export const useStoreManagerAuth = () => {
  const context = useContext(StoreManagerAuthContext);
  if (context === undefined) {
    throw new Error('useStoreManagerAuth must be used within a StoreManagerAuthProvider');
  }
  return context;
};

