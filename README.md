# Mall Management System

## Overview

The Mall Management System is a comprehensive web application designed to facilitate the management of online shopping malls. It provides a platform for administrators to manage stores, products, and users, while also offering store managers their own interface to manage their specific stores.

## Features

### Admin Portal

- **Store Management**: Create, edit, approve, and manage stores
- **Product Management**: Oversee all products across stores
- **Category Management**: Manage both store and product categories
- **Manager Administration**: Create and manage store manager accounts
- **Marketing Tools**: 
  - Marquee announcements for homepage and store pages
  - Pop-up ads with scheduling capabilities
- **Security Features**:
  - Two-factor authentication
  - Role-based access control
  - Fraud list management
- **Settings**:
  - Currency exchange rates
  - Time zone preferences
  - Google indexing controls
  - Website display options

### Store Manager Portal

- **Product Management**: Add, edit, and manage store-specific products
- **Store Settings**: Update store information and working hours
- **Order Management**: View and process customer orders

### Customer-Facing Features

- **Store Directory**: Browse all available stores
- **Product Browsing**: View and search products within stores
- **Shopping Cart**: Add products and proceed to checkout
- **Multi-Payment Support**: KPay, USDT, and Cash on Delivery options
- **Order Notifications**: Telegram integration for order notifications

## Technical Architecture

### Frontend

- **Framework**: React with TypeScript
- **Routing**: React Router
- **State Management**: Zustand for global state
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Lucide React icons

### Backend

- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage for images
- **Serverless Functions**: Supabase Edge Functions
- **Real-time Updates**: Supabase Realtime

### Security

- **Row-Level Security (RLS)**: Fine-grained access control at the database level
- **Two-Factor Authentication**: TOTP-based 2FA for admin accounts
- **Role-Based Access**: Superadmin, admin, store manager, and public roles

## Database Schema

### Core Tables

#### users
This table stores user information and their roles in the system.
- `id` (uuid, PK): User ID, linked to auth.users
- `email` (text): User's email address
- `role` (text): User role ('superadmin', 'store-manager')
- `created_at` (timestamptz): Account creation timestamp
- `updated_at` (timestamptz): Last update timestamp
- `last_login` (timestamptz): Last login timestamp
- `failed_attempts` (integer): Count of failed login attempts
- `locked_until` (timestamptz): Account lockout timestamp
- `requires_2fa` (boolean): Whether 2FA is required
- `security_level` (text): Security level ('normal', 'elevated', 'maximum')

#### stores
Stores that are part of the mall.
- `id` (uuid, PK): Store ID
- `name` (text): Store name
- `description` (text): Store description
- `logo_url` (text): URL to store logo
- `location` (text): Physical location description
- `category` (text): Store category
- `is_active` (boolean): Whether store is active
- `is_verified` (boolean): Whether store is verified
- `approval_status` (text): 'pending', 'approved', or 'rejected'
- `owner_id` (uuid, FK): Reference to auth.users
- `username` (text): Unique username for store URL
- `payment_methods` (jsonb): Payment methods configuration
- `telegram_bot_token` (text): Telegram bot token for notifications
- `telegram_chat_id` (text): Telegram chat ID for notifications
- `commission_rate` (numeric): Store commission rate
- `phone_number` (text): Store contact number
- `channel_link` (text): Link to store's channel
- `display_order` (integer): Order for display in listings
- `created_at` (timestamptz): Creation timestamp
- `updated_at` (timestamptz): Last update timestamp

#### store_hours
Store operating hours.
- `id` (uuid, PK): Record ID
- `store_id` (uuid, FK): Reference to stores
- `day_of_week` (integer): Day of week (0-6, Sunday-Saturday)
- `opens_at` (time): Opening time
- `closes_at` (time): Closing time
- `is_closed` (boolean): Whether store is closed on this day
- `created_at` (timestamptz): Creation timestamp
- `updated_at` (timestamptz): Last update timestamp

#### products
Products offered by stores.
- `id` (uuid, PK): Product ID
- `store_id` (uuid, FK): Reference to stores
- `name` (text): Product name
- `description` (text): Product description
- `price` (numeric): Product price in THB
- `image_url` (text): URL to product image
- `category` (text): Product category
- `in_stock` (boolean): Whether product is in stock
- `stock_quantity` (integer): Available quantity
- `is_active` (boolean): Whether product is active/visible
- `created_at` (timestamptz): Creation timestamp
- `updated_at` (timestamptz): Last update timestamp

#### orders
Customer orders.
- `id` (uuid, PK): Order ID
- `user_id` (uuid, FK): Reference to auth.users
- `store_id` (uuid, FK): Reference to stores
- `status` (text): 'pending', 'paid', 'confirmed', 'completed', 'cancelled'
- `payment_method` (text): 'kpay', 'usdt', 'cod'
- `payment_status` (text): 'pending', 'completed', 'failed'
- `total_amount` (numeric): Total order amount
- `payment_expires_at` (timestamptz): Payment expiration time
- `payment_completed_at` (timestamptz): Payment completion time
- `payment_proof_url` (text): URL to payment proof image
- `created_at` (timestamptz): Creation timestamp
- `updated_at` (timestamptz): Last update timestamp

#### order_items
Individual items within orders.
- `id` (uuid, PK): Item ID
- `order_id` (uuid, FK): Reference to orders
- `product_id` (uuid, FK): Reference to products
- `quantity` (integer): Quantity ordered
- `price` (numeric): Price at time of order
- `created_at` (timestamptz): Creation timestamp

#### store_managers
Links users to stores they manage.
- `id` (uuid, PK): Record ID
- `user_id` (uuid, FK): Reference to users
- `store_id` (uuid, FK): Reference to stores
- `is_active` (boolean): Whether manager is active
- `created_at` (timestamptz): Creation timestamp
- `updated_at` (timestamptz): Last update timestamp
- `created_by` (uuid, FK): Reference to auth.users who created this record

### Category Tables

#### store_categories
Categories for stores.
- `id` (uuid, PK): Category ID
- `name` (text): Category name
- `description` (text): Category description
- `parent_id` (uuid, FK): Reference to parent category
- `attributes` (jsonb): Category attributes
- `is_active` (boolean): Whether category is active
- `created_at` (timestamptz): Creation timestamp
- `updated_at` (timestamptz): Last update timestamp

#### product_categories
Categories for products.
- `id` (uuid, PK): Category ID
- `name` (text): Category name
- `description` (text): Category description
- `is_active` (boolean): Whether category is active
- `created_at` (timestamptz): Creation timestamp
- `updated_at` (timestamptz): Last update timestamp

#### store_category_assignments
Many-to-many relationship between stores and categories.
- `id` (uuid, PK): Assignment ID
- `store_id` (uuid, FK): Reference to stores
- `category_id` (uuid, FK): Reference to store_categories
- `created_at` (timestamptz): Creation timestamp

#### product_arrangements
Product display settings within categories.
- `id` (uuid, PK): Arrangement ID
- `product_id` (uuid, FK): Reference to products
- `category_id` (uuid, FK): Reference to product_categories
- `store_id` (uuid, FK): Reference to stores
- `display_order` (integer): Display order within category
- `is_visible` (boolean): Whether product is visible in category
- `starts_at` (timestamptz): Visibility start time
- `ends_at` (timestamptz): Visibility end time
- `created_at` (timestamptz): Creation timestamp
- `updated_at` (timestamptz): Last update timestamp

### Marketing Tables

#### marquee_announcements
Scrolling announcements for home/store pages.
- `id` (uuid, PK): Announcement ID
- `content` (text): Announcement text
- `is_active` (boolean): Whether announcement is active
- `target_page` (text): 'home' or 'store'
- `store_id` (uuid, FK): Reference to stores (for store-specific announcements)
- `start_date` (timestamptz): Start display date
- `end_date` (timestamptz): End display date
- `created_at` (timestamptz): Creation timestamp
- `updated_at` (timestamptz): Last update timestamp

#### pop_up_ads
Pop-up advertisements.
- `id` (uuid, PK): Ad ID
- `image_url` (text): URL to ad image
- `link_url` (text): URL for ad click
- `is_active` (boolean): Whether ad is active
- `target_page` (text): 'home' or 'store'
- `store_id` (uuid, FK): Reference to stores (for store-specific ads)
- `start_date` (timestamptz): Start display date
- `end_date` (timestamptz): End display date
- `display_frequency` (text): 'once_per_session' or 'every_visit'
- `created_at` (timestamptz): Creation timestamp
- `updated_at` (timestamptz): Last update timestamp

### Security and Settings

#### user_2fa
Two-factor authentication data.
- `user_id` (uuid, PK): Reference to auth.users
- `secret` (text): TOTP secret
- `backup_codes` (text[]): Array of backup codes
- `enabled` (boolean): Whether 2FA is enabled
- `last_used` (timestamptz): Last 2FA usage timestamp
- `created_at` (timestamptz): Creation timestamp
- `updated_at` (timestamptz): Last update timestamp

#### fraud_list
List of known fraudulent users.
- `id` (uuid, PK): Record ID
- `telegram_username` (text): Telegram username
- `comment` (text): Reason for inclusion
- `created_at` (timestamptz): Creation timestamp

#### login_attempts
Track login attempts for security.
- `id` (uuid, PK): Attempt ID
- `email` (text): Email used
- `ip_address` (inet): IP address
- `success` (boolean): Whether attempt was successful
- `attempt_time` (timestamptz): Timestamp of attempt
- `user_agent` (text): Browser user agent
- `error_message` (text): Error message if failed

#### user_sessions
Active user sessions.
- `id` (uuid, PK): Session ID
- `user_id` (uuid, FK): Reference to auth.users
- `token` (text): Session token
- `ip_address` (inet): IP address
- `user_agent` (text): Browser user agent
- `expires_at` (timestamptz): Session expiration
- `created_at` (timestamptz): Creation timestamp
- `last_activity` (timestamptz): Last activity timestamp

#### admin_ip_whitelist
IP addresses allowed for admin access.
- `id` (uuid, PK): Record ID
- `ip_address` (cidr): IP address or range
- `description` (text): Description
- `created_at` (timestamptz): Creation timestamp
- `created_by` (uuid, FK): Reference to auth.users

#### app_settings
Application-wide settings.
- `key` (text, PK): Setting key
- `value` (text): Setting value
- `created_at` (timestamptz): Creation timestamp
- `updated_at` (timestamptz): Last update timestamp
- `updated_by` (uuid, FK): Reference to auth.users

#### manager_audit_logs
Audit logs for manager actions.
- `id` (uuid, PK): Log ID
- `user_id` (uuid, FK): Reference to users
- `store_id` (uuid, FK): Reference to stores
- `action` (text): Action performed
- `details` (jsonb): Action details
- `created_at` (timestamptz): Creation timestamp

#### exchange_rates
Currency exchange rates.
- `base_currency` (text, PK): Base currency code
- `target_currency` (text, PK): Target currency code
- `rate` (numeric): Exchange rate
- `updated_at` (timestamptz): Last update timestamp

## Database Relationships

### One-to-Many Relationships
- A user can own multiple stores (`users` → `stores`)
- A store can have multiple products (`stores` → `products`)
- A store can have multiple working hours (`stores` → `store_hours`)
- A store can have multiple orders (`stores` → `orders`)
- An order can have multiple order items (`orders` → `order_items`)
- A user can have multiple sessions (`users` → `user_sessions`)

### Many-to-Many Relationships
- Stores and categories (`stores` ↔ `store_categories` via `store_category_assignments`)
- Products and categories (`products` ↔ `product_categories` via `product_arrangements`)
- Users and stores (for management) (`users` ↔ `stores` via `store_managers`)

## Row-Level Security Policies

The system implements comprehensive RLS policies to ensure data security:

### Public Access
- View approved and active stores
- View products from approved and active stores
- View store hours for approved and active stores
- Create orders and order items
- View active announcements and ads
- Read app settings and exchange rates

### Authenticated Users
- View their own user data
- View and update their own orders
- View and manage their own 2FA settings

### Store Owners
- Manage their own stores and related data
- Manage products for their stores
- View orders for their stores
- Manage store hours and category assignments

### Store Managers
- Manage assigned stores (limited capabilities)
- Manage products for assigned stores
- View their audit logs

### Superadmins
- Full access to all tables and data
- Manage all users, stores, and products
- Configure system settings
- Access security features and audit logs

## Functions and Triggers

### Security Functions
- `is_superadmin_by_id_v2()`: Checks if current user is a superadmin
- `check_admin_access_v2()`: Validates admin access with IP restrictions

### Utility Functions
- `update_exchange_rate()`: Updates currency exchange rates
- `update_exchange_rates_updated_at()`: Updates timestamp on rate changes
- `update_updated_at_column()`: Generic function to update timestamps
- `maintain_display_order()`: Manages product display ordering
- `generate_store_username()`: Generates unique store usernames
- `update_product_visibility()`: Updates product visibility based on store status
- `log_manager_action()`: Logs store manager actions
- `cleanup_expired_sessions()`: Removes expired user sessions

## Edge Functions

- **create-manager**: Creates store manager accounts
- **delete-manager**: Removes store manager accounts
- **reset-manager-password**: Resets store manager passwords
- **notify-order**: Sends order notifications via Telegram
- **store-category-manager**: Manages store categories
- **product-category-manager**: Manages product categories

## Getting Started

### Prerequisites

- Node.js (v16+)
- Supabase account
- Telegram Bot (for notifications)

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env`:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Run the development server: `npm run dev`

### Deployment

1. Build the project: `npm run build`
2. Deploy to your hosting provider of choice

## License

This project is proprietary and not open for redistribution without permission.