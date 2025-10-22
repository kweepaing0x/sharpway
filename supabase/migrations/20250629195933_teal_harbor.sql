/*
  # Fix RLS Policies for Superadmin Access
  
  1. Changes
    - Update the role of the superadmin user in the public.users table
    - Create new is_superadmin_by_id_v2 function with a different name to avoid conflicts
    - Drop existing policies with proper existence checks
    - Create separate policies for SELECT vs INSERT/UPDATE/DELETE operations
    - Fix WITH CHECK clause usage (only for INSERT and UPDATE)
    - Ensure superadmin has full access to all tables
*/

-- Update the role of the superadmin user in the public.users table
UPDATE public.users
SET role = 'superadmin'
WHERE email = 'admin@kweepaing.com';

-- Create a new function with a different name to avoid the "not unique" error
CREATE OR REPLACE FUNCTION is_superadmin_by_id_v2(user_id uuid DEFAULT NULL)
RETURNS boolean AS $$
DECLARE
  check_id uuid;
BEGIN
  -- Use provided ID or current user ID
  check_id := COALESCE(user_id, auth.uid());

  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE users.id = check_id
    AND users.role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the check_admin_access function to use the new function name
CREATE OR REPLACE FUNCTION check_admin_access_v2(user_id uuid, client_ip inet)
RETURNS boolean AS $$
BEGIN
  -- Superadmin always has access
  IF is_superadmin_by_id_v2(user_id) THEN
    RETURN true;
  END IF;

  -- Regular admin check
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE users.id = user_id
    AND users.role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies to avoid conflicts
DO $$
DECLARE
    policy_record RECORD;
    table_list text[] := ARRAY[
        'users', 'stores', 'store_hours', 'products', 'orders', 'order_items',
        'store_managers', 'manager_audit_logs', 'app_settings', 'marquee_announcements',
        'pop_up_ads', 'product_categories', 'product_arrangements', 'fraud_list',
        'store_categories', 'store_category_assignments', 'login_attempts',
        'user_sessions', 'admin_ip_whitelist', 'user_2fa'
    ];
    tbl_name text;
BEGIN
    FOREACH tbl_name IN ARRAY table_list
    LOOP
        -- Check if table exists before trying to drop policies
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl_name) THEN
            FOR policy_record IN 
                EXECUTE 'SELECT policyname FROM pg_policies WHERE tablename = $1' USING tbl_name
            LOOP
                EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON ' || tbl_name;
            END LOOP;
        END IF;
    END LOOP;
END $$;

-- Users table policies
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Superadmin can read all users"
  ON users FOR SELECT
  TO authenticated
  USING (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (is_superadmin_by_id_v2())
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (is_superadmin_by_id_v2());

-- Stores table policies
CREATE POLICY "Public can view approved and active stores"
  ON stores FOR SELECT
  TO public
  USING ((approval_status = 'approved') AND (is_active = true));

CREATE POLICY "Authenticated users can view approved and active stores"
  ON stores FOR SELECT
  TO authenticated
  USING ((approval_status = 'approved') AND (is_active = true));

CREATE POLICY "Superadmin can read all stores"
  ON stores FOR SELECT
  TO authenticated
  USING (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can insert stores"
  ON stores FOR INSERT
  TO authenticated
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can update stores"
  ON stores FOR UPDATE
  TO authenticated
  USING (is_superadmin_by_id_v2())
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can delete stores"
  ON stores FOR DELETE
  TO authenticated
  USING (is_superadmin_by_id_v2());

CREATE POLICY "Store owners can read their own stores"
  ON stores FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Store owners can insert their own stores"
  ON stores FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Store owners can update their own stores"
  ON stores FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Store owners can delete their own stores"
  ON stores FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Store managers can read assigned stores"
  ON stores FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM store_managers
    WHERE store_managers.store_id = stores.id
    AND store_managers.user_id = auth.uid()
    AND store_managers.is_active = true
  ));

CREATE POLICY "Store managers can update assigned stores"
  ON stores FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM store_managers
    WHERE store_managers.store_id = stores.id
    AND store_managers.user_id = auth.uid()
    AND store_managers.is_active = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM store_managers
    WHERE store_managers.store_id = stores.id
    AND store_managers.user_id = auth.uid()
    AND store_managers.is_active = true
  ));

-- Store hours policies
CREATE POLICY "Anyone can view store hours"
  ON store_hours FOR SELECT
  TO public
  USING (EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = store_hours.store_id
    AND stores.is_active = true
    AND stores.approval_status = 'approved'
  ));

CREATE POLICY "Superadmin can read all store hours"
  ON store_hours FOR SELECT
  TO authenticated
  USING (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can insert store hours"
  ON store_hours FOR INSERT
  TO authenticated
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can update store hours"
  ON store_hours FOR UPDATE
  TO authenticated
  USING (is_superadmin_by_id_v2())
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can delete store hours"
  ON store_hours FOR DELETE
  TO authenticated
  USING (is_superadmin_by_id_v2());

CREATE POLICY "Store owners can read their store hours"
  ON store_hours FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = store_hours.store_id
    AND stores.owner_id = auth.uid()
  ));

CREATE POLICY "Store owners can insert their store hours"
  ON store_hours FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = store_hours.store_id
    AND stores.owner_id = auth.uid()
  ));

CREATE POLICY "Store owners can update their store hours"
  ON store_hours FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = store_hours.store_id
    AND stores.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = store_hours.store_id
    AND stores.owner_id = auth.uid()
  ));

CREATE POLICY "Store owners can delete their store hours"
  ON store_hours FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = store_hours.store_id
    AND stores.owner_id = auth.uid()
  ));

-- Products table policies
CREATE POLICY "Anyone can view products from active stores"
  ON products FOR SELECT
  TO public
  USING (EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = products.store_id
    AND stores.is_active = true
    AND stores.approval_status = 'approved'
  ));

CREATE POLICY "Superadmin can read all products"
  ON products FOR SELECT
  TO authenticated
  USING (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (is_superadmin_by_id_v2())
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (is_superadmin_by_id_v2());

CREATE POLICY "Store owners can read their products"
  ON products FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = products.store_id
    AND stores.owner_id = auth.uid()
  ));

CREATE POLICY "Store owners can insert their products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = products.store_id
    AND stores.owner_id = auth.uid()
  ));

CREATE POLICY "Store owners can update their products"
  ON products FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = products.store_id
    AND stores.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = products.store_id
    AND stores.owner_id = auth.uid()
  ));

CREATE POLICY "Store owners can delete their products"
  ON products FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = products.store_id
    AND stores.owner_id = auth.uid()
  ));

CREATE POLICY "Store managers can read store products"
  ON products FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM store_managers
    WHERE store_managers.store_id = products.store_id
    AND store_managers.user_id = auth.uid()
    AND store_managers.is_active = true
  ));

CREATE POLICY "Store managers can insert store products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM store_managers
    WHERE store_managers.store_id = products.store_id
    AND store_managers.user_id = auth.uid()
    AND store_managers.is_active = true
  ));

CREATE POLICY "Store managers can update store products"
  ON products FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM store_managers
    WHERE store_managers.store_id = products.store_id
    AND store_managers.user_id = auth.uid()
    AND store_managers.is_active = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM store_managers
    WHERE store_managers.store_id = products.store_id
    AND store_managers.user_id = auth.uid()
    AND store_managers.is_active = true
  ));

CREATE POLICY "Store managers can delete store products"
  ON products FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM store_managers
    WHERE store_managers.store_id = products.store_id
    AND store_managers.user_id = auth.uid()
    AND store_managers.is_active = true
  ));

-- Orders table policies
CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can read their own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their pending orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Superadmin can read all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can insert orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (is_superadmin_by_id_v2())
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can delete orders"
  ON orders FOR DELETE
  TO authenticated
  USING (is_superadmin_by_id_v2());

CREATE POLICY "Store owners can read their store orders"
  ON orders FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = orders.store_id
    AND stores.owner_id = auth.uid()
  ));

-- Order items table policies
CREATE POLICY "Anyone can create order items"
  ON order_items FOR INSERT
  TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.status = 'pending'
  ));

CREATE POLICY "Users can read their order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Superadmin can read all order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can insert order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can update order items"
  ON order_items FOR UPDATE
  TO authenticated
  USING (is_superadmin_by_id_v2())
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can delete order items"
  ON order_items FOR DELETE
  TO authenticated
  USING (is_superadmin_by_id_v2());

CREATE POLICY "Store owners can read their store order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders
    JOIN stores ON stores.id = orders.store_id
    WHERE orders.id = order_items.order_id
    AND stores.owner_id = auth.uid()
  ));

-- Store managers table policies
CREATE POLICY "Superadmin can read all store managers"
  ON store_managers FOR SELECT
  TO authenticated
  USING (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can insert store managers"
  ON store_managers FOR INSERT
  TO authenticated
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can update store managers"
  ON store_managers FOR UPDATE
  TO authenticated
  USING (is_superadmin_by_id_v2())
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can delete store managers"
  ON store_managers FOR DELETE
  TO authenticated
  USING (is_superadmin_by_id_v2());

CREATE POLICY "Store managers can read their assignments"
  ON store_managers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND is_active = true);

-- Manager audit logs policies
CREATE POLICY "Superadmin can read all audit logs"
  ON manager_audit_logs FOR SELECT
  TO authenticated
  USING (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can insert audit logs"
  ON manager_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can update audit logs"
  ON manager_audit_logs FOR UPDATE
  TO authenticated
  USING (is_superadmin_by_id_v2())
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can delete audit logs"
  ON manager_audit_logs FOR DELETE
  TO authenticated
  USING (is_superadmin_by_id_v2());

CREATE POLICY "Store managers can read their audit logs"
  ON manager_audit_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert audit logs"
  ON manager_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- App settings policies
CREATE POLICY "Anyone can read app settings"
  ON app_settings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Superadmin can read all app settings"
  ON app_settings FOR SELECT
  TO authenticated
  USING (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can insert app settings"
  ON app_settings FOR INSERT
  TO authenticated
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can update app settings"
  ON app_settings FOR UPDATE
  TO authenticated
  USING (is_superadmin_by_id_v2())
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can delete app settings"
  ON app_settings FOR DELETE
  TO authenticated
  USING (is_superadmin_by_id_v2());

-- Marquee announcements policies
CREATE POLICY "Public can read active announcements"
  ON marquee_announcements FOR SELECT
  TO public
  USING (
    is_active = true
    AND start_date <= now()
    AND (end_date IS NULL OR end_date >= now())
  );

CREATE POLICY "Superadmin can read all announcements"
  ON marquee_announcements FOR SELECT
  TO authenticated
  USING (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can insert announcements"
  ON marquee_announcements FOR INSERT
  TO authenticated
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can update announcements"
  ON marquee_announcements FOR UPDATE
  TO authenticated
  USING (is_superadmin_by_id_v2())
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can delete announcements"
  ON marquee_announcements FOR DELETE
  TO authenticated
  USING (is_superadmin_by_id_v2());

-- Pop-up ads policies
CREATE POLICY "Public can read active ads"
  ON pop_up_ads FOR SELECT
  TO public
  USING (
    is_active = true
    AND start_date <= now()
    AND (end_date IS NULL OR end_date >= now())
  );

CREATE POLICY "Superadmin can read all ads"
  ON pop_up_ads FOR SELECT
  TO authenticated
  USING (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can insert ads"
  ON pop_up_ads FOR INSERT
  TO authenticated
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can update ads"
  ON pop_up_ads FOR UPDATE
  TO authenticated
  USING (is_superadmin_by_id_v2())
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can delete ads"
  ON pop_up_ads FOR DELETE
  TO authenticated
  USING (is_superadmin_by_id_v2());

-- Product categories policies
CREATE POLICY "Anyone can view product categories"
  ON product_categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Superadmin can read all product categories"
  ON product_categories FOR SELECT
  TO authenticated
  USING (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can insert product categories"
  ON product_categories FOR INSERT
  TO authenticated
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can update product categories"
  ON product_categories FOR UPDATE
  TO authenticated
  USING (is_superadmin_by_id_v2())
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can delete product categories"
  ON product_categories FOR DELETE
  TO authenticated
  USING (is_superadmin_by_id_v2());

-- Product arrangements policies
CREATE POLICY "Anyone can view active product arrangements"
  ON product_arrangements FOR SELECT
  TO public
  USING (
    is_visible = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at > now())
    AND EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = product_arrangements.store_id
      AND stores.is_active = true
      AND stores.approval_status = 'approved'
    )
  );

CREATE POLICY "Superadmin can read all product arrangements"
  ON product_arrangements FOR SELECT
  TO authenticated
  USING (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can insert product arrangements"
  ON product_arrangements FOR INSERT
  TO authenticated
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can update product arrangements"
  ON product_arrangements FOR UPDATE
  TO authenticated
  USING (is_superadmin_by_id_v2())
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can delete product arrangements"
  ON product_arrangements FOR DELETE
  TO authenticated
  USING (is_superadmin_by_id_v2());

CREATE POLICY "Store owners can read their product arrangements"
  ON product_arrangements FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = product_arrangements.store_id
    AND stores.owner_id = auth.uid()
  ));

CREATE POLICY "Store owners can insert their product arrangements"
  ON product_arrangements FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = product_arrangements.store_id
    AND stores.owner_id = auth.uid()
  ));

CREATE POLICY "Store owners can update their product arrangements"
  ON product_arrangements FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = product_arrangements.store_id
    AND stores.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = product_arrangements.store_id
    AND stores.owner_id = auth.uid()
  ));

CREATE POLICY "Store owners can delete their product arrangements"
  ON product_arrangements FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = product_arrangements.store_id
    AND stores.owner_id = auth.uid()
  ));

-- Fraud list policies
CREATE POLICY "Superadmin can read all fraud list entries"
  ON fraud_list FOR SELECT
  TO authenticated
  USING (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can insert fraud list entries"
  ON fraud_list FOR INSERT
  TO authenticated
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can update fraud list entries"
  ON fraud_list FOR UPDATE
  TO authenticated
  USING (is_superadmin_by_id_v2())
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can delete fraud list entries"
  ON fraud_list FOR DELETE
  TO authenticated
  USING (is_superadmin_by_id_v2());

-- Store categories policies
CREATE POLICY "Anyone can view active store categories"
  ON store_categories FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Superadmin can read all store categories"
  ON store_categories FOR SELECT
  TO authenticated
  USING (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can insert store categories"
  ON store_categories FOR INSERT
  TO authenticated
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can update store categories"
  ON store_categories FOR UPDATE
  TO authenticated
  USING (is_superadmin_by_id_v2())
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can delete store categories"
  ON store_categories FOR DELETE
  TO authenticated
  USING (is_superadmin_by_id_v2());

-- Store category assignments policies
CREATE POLICY "Anyone can view store category assignments"
  ON store_category_assignments FOR SELECT
  TO public
  USING (EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = store_category_assignments.store_id
    AND stores.is_active = true
    AND stores.approval_status = 'approved'
  ));

CREATE POLICY "Superadmin can read all store category assignments"
  ON store_category_assignments FOR SELECT
  TO authenticated
  USING (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can insert store category assignments"
  ON store_category_assignments FOR INSERT
  TO authenticated
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can update store category assignments"
  ON store_category_assignments FOR UPDATE
  TO authenticated
  USING (is_superadmin_by_id_v2())
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can delete store category assignments"
  ON store_category_assignments FOR DELETE
  TO authenticated
  USING (is_superadmin_by_id_v2());

CREATE POLICY "Store owners can read their category assignments"
  ON store_category_assignments FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = store_category_assignments.store_id
    AND stores.owner_id = auth.uid()
  ));

CREATE POLICY "Store owners can insert their category assignments"
  ON store_category_assignments FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = store_category_assignments.store_id
    AND stores.owner_id = auth.uid()
  ));

CREATE POLICY "Store owners can update their category assignments"
  ON store_category_assignments FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = store_category_assignments.store_id
    AND stores.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = store_category_assignments.store_id
    AND stores.owner_id = auth.uid()
  ));

CREATE POLICY "Store owners can delete their category assignments"
  ON store_category_assignments FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = store_category_assignments.store_id
    AND stores.owner_id = auth.uid()
  ));

-- Login attempts policies
CREATE POLICY "Superadmin can read all login attempts"
  ON login_attempts FOR SELECT
  TO authenticated
  USING (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can insert login attempts"
  ON login_attempts FOR INSERT
  TO authenticated
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can update login attempts"
  ON login_attempts FOR UPDATE
  TO authenticated
  USING (is_superadmin_by_id_v2())
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can delete login attempts"
  ON login_attempts FOR DELETE
  TO authenticated
  USING (is_superadmin_by_id_v2());

-- User sessions policies
CREATE POLICY "Users can read their own sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Superadmin can read all user sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can insert user sessions"
  ON user_sessions FOR INSERT
  TO authenticated
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can update user sessions"
  ON user_sessions FOR UPDATE
  TO authenticated
  USING (is_superadmin_by_id_v2())
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can delete user sessions"
  ON user_sessions FOR DELETE
  TO authenticated
  USING (is_superadmin_by_id_v2());

-- Admin IP whitelist policies
CREATE POLICY "Superadmin can read all IP whitelist entries"
  ON admin_ip_whitelist FOR SELECT
  TO authenticated
  USING (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can insert IP whitelist entries"
  ON admin_ip_whitelist FOR INSERT
  TO authenticated
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can update IP whitelist entries"
  ON admin_ip_whitelist FOR UPDATE
  TO authenticated
  USING (is_superadmin_by_id_v2())
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can delete IP whitelist entries"
  ON admin_ip_whitelist FOR DELETE
  TO authenticated
  USING (is_superadmin_by_id_v2());

-- User 2FA policies
CREATE POLICY "Users can read their own 2FA"
  ON user_2fa FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own 2FA"
  ON user_2fa FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own 2FA"
  ON user_2fa FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own 2FA"
  ON user_2fa FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Superadmin can read all 2FA entries"
  ON user_2fa FOR SELECT
  TO authenticated
  USING (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can insert 2FA entries"
  ON user_2fa FOR INSERT
  TO authenticated
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can update 2FA entries"
  ON user_2fa FOR UPDATE
  TO authenticated
  USING (is_superadmin_by_id_v2())
  WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can delete 2FA entries"
  ON user_2fa FOR DELETE
  TO authenticated
  USING (is_superadmin_by_id_v2());

-- Insert or update the superadmin user in the users table if they exist in auth.users
DO $$
BEGIN
  -- Check if the superadmin exists in auth.users and insert/update in users table
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@kweepaing.com') THEN
    INSERT INTO users (id, email, role)
    SELECT id, email, 'superadmin' -- Ensure role is 'superadmin'
    FROM auth.users
    WHERE email = 'admin@kweepaing.com'
    ON CONFLICT (id)
    DO UPDATE SET
      role = 'superadmin', -- Ensure role is 'superadmin'
      updated_at = now();
  END IF;
END $$;