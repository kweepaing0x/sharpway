import create from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  productId: string;
  storeId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  addedAt?: number;
}

interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  recentlyAdded: string | null;
  addItem: (item: Omit<CartItem, 'id'>) => Promise<void>;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  clearRecentlyAdded: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      recentlyAdded: null,
      
      addItem: async (item) => {
        set({ isLoading: true });
        
        // Simulate network delay for smooth animation
        await new Promise(resolve => setTimeout(resolve, 400));
        
        set((state) => {
          const existingItem = state.items.find(i => i.productId === item.productId);
          
          if (existingItem) {
            return {
              items: state.items.map(i =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
              isLoading: false,
              recentlyAdded: item.productId
            };
          }
          
          return {
            items: [...state.items, { ...item, id: crypto.randomUUID(), addedAt: Date.now() }],
            isLoading: false,
            recentlyAdded: item.productId
          };
        });

        // Clear recently added status after animation
        setTimeout(() => {
          set({ recentlyAdded: null });
        }, 2000);
      },
      
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter(item => item.productId !== productId)
        }));
      },
      
      updateQuantity: (productId, quantity) => {
        set((state) => ({
          items: quantity === 0
            ? state.items.filter(item => item.productId !== productId)
            : state.items.map(item =>
                item.productId === productId
                  ? { ...item, quantity }
                  : item
              )
        }));
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      getTotal: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },
      
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },

      clearRecentlyAdded: () => {
        set({ recentlyAdded: null });
      }
    }),
    {
      name: 'cart-storage'
    }
  )
);
