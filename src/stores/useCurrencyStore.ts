import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

interface ExchangeRates {
  THB_USD: number;
  THB_MMK: number;
  USD_MMK: number;
}

interface CurrencyStore {
  rates: ExchangeRates;
  loading: boolean;
  error: string | null;
  fetchRates: () => Promise<void>;
  updateRates: (rates: Partial<ExchangeRates>) => Promise<void>;
  convertToTHB: (amount: number, fromCurrency: 'USD' | 'MMK') => number;
  convertFromTHB: (amount: number, toCurrency: 'USD' | 'MMK') => number;
  convertCurrency: (amount: number, from: 'THB' | 'USD' | 'MMK', to: 'THB' | 'USD' | 'MMK') => number;
  formatAmount: (amount: number | null | undefined, currency: 'THB' | 'USD' | 'MMK') => string;
}

export const useCurrencyStore = create<CurrencyStore>((set, get) => ({
  rates: {
    THB_USD: 0.028,  // Default fallback values
    THB_MMK: 136,
    USD_MMK: 3300,
  },
  loading: false,
  error: null,

  fetchRates: async () => {
    set({ loading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('base_currency, target_currency, rate');

      if (error) throw error;

      // Convert database format to store format
      const rates: Partial<ExchangeRates> = {};
      
      data?.forEach(rate => {
        const key = `${rate.base_currency}_${rate.target_currency}` as keyof ExchangeRates;
        if (key === 'THB_USD' || key === 'THB_MMK' || key === 'USD_MMK') {
          rates[key] = rate.rate;
        }
      });

      set(state => ({
        rates: { ...state.rates, ...rates },
        loading: false
      }));
    } catch (error: any) {
      console.error('Error fetching exchange rates:', error);
      set({ error: error.message, loading: false });
    }
  },

  updateRates: async (newRates: Partial<ExchangeRates>) => {
    set({ loading: true, error: null });
    
    try {
      // Update each rate in the database
      const updates = [];
      
      if (newRates.THB_USD !== undefined) {
        updates.push(
          supabase.rpc('update_exchange_rate', {
            p_base_currency: 'THB',
            p_target_currency: 'USD',
            p_rate: newRates.THB_USD
          })
        );
      }
      
      if (newRates.THB_MMK !== undefined) {
        updates.push(
          supabase.rpc('update_exchange_rate', {
            p_base_currency: 'THB',
            p_target_currency: 'MMK',
            p_rate: newRates.THB_MMK
          })
        );
      }
      
      if (newRates.USD_MMK !== undefined) {
        updates.push(
          supabase.rpc('update_exchange_rate', {
            p_base_currency: 'USD',
            p_target_currency: 'MMK',
            p_rate: newRates.USD_MMK
          })
        );
      }

      // Execute all updates
      const results = await Promise.all(updates);
      
      // Check for errors
      results.forEach(result => {
        if (result.error) throw result.error;
      });

      // Update local state
      set(state => ({
        rates: { ...state.rates, ...newRates },
        loading: false
      }));
      
    } catch (error: any) {
      console.error('Error updating exchange rates:', error);
      set({ error: error.message, loading: false });
      throw error; // Re-throw so UI can handle it
    }
  },

  convertToTHB: (amount: number, fromCurrency: 'USD' | 'MMK') => {
    const { rates } = get();
    const rate = fromCurrency === 'USD' ? rates.THB_USD : rates.THB_MMK;
    return amount / rate;
  },

  convertFromTHB: (amount: number, toCurrency: 'USD' | 'MMK') => {
    const { rates } = get();
    const rate = toCurrency === 'USD' ? rates.THB_USD : rates.THB_MMK;
    return amount * rate;
  },

  convertCurrency: (amount: number, from: 'THB' | 'USD' | 'MMK', to: 'THB' | 'USD' | 'MMK') => {
    const { rates } = get();
    
    if (from === to) return amount;
    
    // Convert to THB first
    let thbAmount = amount;
    if (from === 'USD') thbAmount = amount / rates.THB_USD;
    if (from === 'MMK') thbAmount = amount / rates.THB_MMK;
    
    // Convert from THB to target currency
    if (to === 'THB') return thbAmount;
    if (to === 'USD') return thbAmount * rates.THB_USD;
    if (to === 'MMK') return thbAmount * rates.THB_MMK;
    
    return amount; // Fallback
  },

  formatAmount: (amount: number | null | undefined, currency: 'THB' | 'USD' | 'MMK') => {
    // Handle undefined, null, or invalid amounts
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'Price not available';
    }

    // Ensure amount is a valid number
    const validAmount = Number(amount);
    if (isNaN(validAmount)) {
      return 'Price not available';
    }

    switch (currency) {
      case 'THB':
        return `฿${validAmount.toFixed(2)}`;
      case 'USD':
        return `$${validAmount.toFixed(2)}`;
      case 'MMK':
        return `${validAmount.toLocaleString()} MMK`;
      default:
        return validAmount.toString();
    }
  }
}));

