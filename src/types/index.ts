// Define core types for the application
export interface Store {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  location: string;
  category: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
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

export interface StoreCategory {
  id: string;
  name: string;
  description: string;
  parent_id?: string;
  attributes: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreCategoryAssignment {
  id: string;
  store_id: string;
  category_id: string;
  created_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  category: string;
  in_stock: boolean;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  store_id: string;
  status: 'pending' | 'paid' | 'confirmed' | 'completed' | 'cancelled';
  payment_method: 'kpay' | 'usdt' | 'cod';
  payment_status: 'pending' | 'completed' | 'failed';
  total_amount: number;
  payment_expires_at?: string;
  payment_completed_at?: string;
  payment_proof_url?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'superadmin' | 'user' | 'store_manager';
  created_at: string;
}

export interface StoreManager {
  id: string;
  user_id: string;
  store_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface ManagerAuditLog {
  id: string;
  user_id: string;
  store_id: string;
  action: string;
  details: Record<string, any>;
  created_at: string;
}

export type StoreCategory = 
  | 'Fashion'
  | 'Electronics'
  | 'Food'
  | 'Home'
  | 'Beauty'
  | 'Entertainment'
  | 'Services'
  | 'Other';

export type ProductCategory =
  | 'Clothing'
  | 'Accessories'
  | 'Gadgets'
  | 'Appliances'
  | 'Food'
  | 'Furniture'
  | 'Cosmetics'
  | 'Media'
  | 'Other';

export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface ProductArrangement {
  id: string;
  product_id: string;
  category_id: string;
  store_id: string;
  display_order: number;
  is_visible: boolean;
  starts_at?: string;
  ends_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MarqueeAnnouncement {
  id: string;
  content: string;
  is_active: boolean;
  target_page: 'home' | 'store';
  store_id?: string;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface PopUpAd {
  id: string;
  image_url: string;
  link_url?: string;
  is_active: boolean;
  target_page: 'home' | 'store';
  store_id?: string;
  start_date: string;
  end_date?: string;
  display_frequency: 'once_per_session' | 'every_visit';
  created_at: string;
  updated_at: string;
}

export interface SponsoredContent {
  id: string;
  title: string;
  image_url: string;
  redirect_url: string;
  display_order: number;
  is_active: boolean;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface AppSettings {
  id: string;
  enable_google_indexing: boolean;
  indexed_pages: ('home' | 'store')[];
  google_analytics_measurement_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Hotel {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  location: string;
  category: string;
  channel_url?: string;
  telegram_contact: string;
  phone_number?: string;
  is_active: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  owner_id?: string;
  username: string;
  display_order?: number;
  created_at: string;
  updated_at: string;
}

export interface HotelRoom {
  id: string;
  hotel_id: string;
  room_number: string;
  room_type: 'VIP' | 'Normal';
  floor_number: number;
  availability_status: 'available' | 'booked';
  price_per_night?: number;
  room_images?: string[];
  amenities?: string;
  created_at: string;
  updated_at: string;
}

export interface Taxi {
  id: string;
  driver_name: string;
  description?: string;
  photo_url?: string;
  vehicle_type: 'motorcycle' | 'car';
  availability_status: boolean;
  phone_number: string;
  telegram_contact: string;
  location: string;
  is_active: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  owner_id?: string;
  username: string;
  display_order?: number;
  created_at: string;
  updated_at: string;
}

export interface HotelManager {
  id: string;
  user_id: string;
  hotel_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface TaxiManager {
  id: string;
  user_id: string;
  taxi_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export type ServiceType = 'store' | 'hotel' | 'taxi';

export interface UnifiedSearchResult {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  location: string;
  category: string;
  username: string;
  service_type: ServiceType;
  is_active: boolean;
}