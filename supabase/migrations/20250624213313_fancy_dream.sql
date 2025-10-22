/*
  # Setup Superadmin User
  
  1. Create superadmin user with full access
  2. Update RLS policies to allow superadmin full access
  3. Set admin@kweepaing.com as superadmin
*/

-- First, let's create a function to check if user is superadmin
CREATE OR REPLACE FUNCTION is_superadmin(user_email text DEFAULT NULL)
RETURNS boolean AS $$
BEGIN
  -- If no email provided, check current user
  IF user_email IS NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@kweepaing.com'
    );
  END IF;
  
  -- Check specific email
  RETURN user_email = 'admin@kweepaing.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is superadmin by ID
CREATE OR REPLACE FUNCTION is_superadmin_by_id(user_id uuid DEFAULT NULL)
RETURNS boolean AS $$
DECLARE
  check_id uuid;
BEGIN
  -- Use provided ID or current user ID
  check_id := COALESCE(user_id, auth.uid());
  
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = check_id 
    AND auth.users.email = 'admin@kweepaing.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the check_admin_access function to include superadmin check
CREATE OR REPLACE FUNCTION check_admin_access(user_id uuid, client_ip inet)
RETURNS boolean AS $$
BEGIN
  -- Superadmin always has access
  IF is_superadmin_by_id(user_id) THEN
    RETURN true;
  END IF;
  
  -- Regular admin check
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = user_id 
    AND users.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies and recreate with superadmin access
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
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl_name) THEN
            FOR policy_record IN 
                EXECUTE 'SELECT policyname FROM pg_policies WHERE tablename = $1' USING tbl_name
            LOOP
                EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON ' || tbl_name;
            END LOOP;
        END IF;
    END LOOP;
END $$;

-- Users table policies with superadmin access
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Superadmin has full access to users"
  ON users FOR ALL
  TO authenticated
  USING (is_superadmin_by_id())
  WITH CHECK (is_superadmin_by_id());

CREATE POLICY "Admins can manage all users"
  ON users FOR ALL
  TO authenticated
  USING ((id = auth.uid()) AND (role = 'admin') AND check_admin_access(id, inet_client_addr()))
  WITH CHECK ((id = auth.uid()) AND (role = 'admin') AND check_admin_access(id, inet_client_addr()));

-- Stores table policies with superadmin access
CREATE POLICY "Public can view approved and active stores"
  ON stores FOR SELECT
  TO public
  USING ((approval_status = 'approved') AND (is_active = true));

CREATE POLICY "Authenticated users can view approved and active stores"
  ON stores FOR SELECT
  TO authenticated
  USING ((approval_status = 'approved') AND (is_active = true));

CREATE POLICY "Superadmin has full access to stores"
  ON stores FOR ALL
  TO authenticated
  USING (is_superadmin_by_id())
  WITH CHECK (is_superadmin_by_id());

CREATE POLICY "Store owners can manage their own stores"
  ON stores FOR ALL
  TO authenticated
  USING ((owner_id = auth.uid()) AND ((approval_status = 'approved') OR (approval_status = 'pending')))
  WITH CHECK ((owner_id = auth.uid()) AND ((approval_status = 'approved') OR (approval_status = 'pending')));

CREATE POLICY "Store managers can manage assigned stores"
  ON stores FOR ALL
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

CREATE POLICY "Admins have full access to stores"
  ON stores FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  ));

-- Store hours policies with superadmin access
CREATE POLICY "Anyone can view store hours"
  ON store_hours FOR SELECT
  TO public
  USING (EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = store_hours.store_id 
    AND stores.is_active = true 
    AND stores.approval_status = 'approved'
  ));

CREATE POLICY "Superadmin has full access to store hours"
  ON store_hours FOR ALL
  TO authenticated
  USING (is_superadmin_by_id())
  WITH CHECK (is_superadmin_by_id());

CREATE POLICY "Store owners can manage their store hours"
  ON store_hours FOR ALL
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

-- Products table policies with superadmin access
CREATE POLICY "Anyone can view products from active stores"
  ON products FOR SELECT
  TO public
  USING (EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = products.store_id 
    AND stores.is_active = true 
    AND stores.approval_status = 'approved'
  ));

CREATE POLICY "Superadmin has full access to products"
  ON products FOR ALL
  TO authenticated
  USING (is_superadmin_by_id())
  WITH CHECK (is_superadmin_by_id());

CREATE POLICY "Store owners can manage their products"
  ON products FOR ALL
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

CREATE POLICY "Store managers can manage store products"
  ON products FOR ALL
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

-- Orders table policies with superadmin access
CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their pending orders"
  ON orders FOR UPDATE
  TO authenticated
  USING ((user_id = auth.uid()) AND (status = 'pending'))
  WITH CHECK ((user_id = auth.uid()) AND (status = 'pending'));

CREATE POLICY "Superadmin has full access to orders"
  ON orders FOR ALL
  TO authenticated
  USING (is_superadmin_by_id())
  WITH CHECK (is_superadmin_by_id());

CREATE POLICY "Store owners can view their store orders"
  ON orders FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = orders.store_id 
    AND stores.owner_id = auth.uid()
  ));

-- Order items table policies with superadmin access
CREATE POLICY "Anyone can create order items"
  ON order_items FOR INSERT
  TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id 
    AND orders.status = 'pending'
  ));

CREATE POLICY "Users can view their order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Superadmin has full access to order items"
  ON order_items FOR ALL
  TO authenticated
  USING (is_superadmin_by_id())
  WITH CHECK (is_superadmin_by_id());

CREATE POLICY "Store owners can view their store order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders
    JOIN stores ON stores.id = orders.store_id
    WHERE orders.id = order_items.order_id 
    AND stores.owner_id = auth.uid()
  ));

-- Store managers table policies with superadmin access
CREATE POLICY "Superadmin has full access to store managers"
  ON store_managers FOR ALL
  TO authenticated
  USING (is_superadmin_by_id())
  WITH CHECK (is_superadmin_by_id());

CREATE POLICY "Admins can manage store managers"
  ON store_managers FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  ));

CREATE POLICY "Store managers can view their assignments"
  ON store_managers FOR SELECT
  TO authenticated
  USING ((user_id = auth.uid()) AND (is_active = true));

-- Manager audit logs policies with superadmin access
CREATE POLICY "Superadmin has full access to audit logs"
  ON manager_audit_logs FOR ALL
  TO authenticated
  USING (is_superadmin_by_id())
  WITH CHECK (is_superadmin_by_id());

CREATE POLICY "Admins can view all audit logs"
  ON manager_audit_logs FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  ));

CREATE POLICY "Store managers can view their audit logs"
  ON manager_audit_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- App settings policies with superadmin access
CREATE POLICY "Anyone can read app settings"
  ON app_settings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Superadmin has full access to app settings"
  ON app_settings FOR ALL
  TO authenticated
  USING (is_superadmin_by_id())
  WITH CHECK (is_superadmin_by_id());

CREATE POLICY "Only admins can modify app settings"
  ON app_settings FOR ALL
  TO authenticated
  USING (auth.uid() IN (
    SELECT users.id FROM users 
    WHERE users.role = 'admin'
  ))
  WITH CHECK (auth.uid() IN (
    SELECT users.id FROM users 
    WHERE users.role = 'admin'
  ));

-- Marquee announcements policies with superadmin access
CREATE POLICY "Public can read active announcements"
  ON marquee_announcements FOR SELECT
  TO public
  USING (
    is_active = true 
    AND start_date <= now() 
    AND (end_date IS NULL OR end_date >= now())
  );

CREATE POLICY "Superadmin has full access to announcements"
  ON marquee_announcements FOR ALL
  TO authenticated
  USING (is_superadmin_by_id())
  WITH CHECK (is_superadmin_by_id());

CREATE POLICY "Admins can manage all announcements"
  ON marquee_announcements FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  ));

-- Pop-up ads policies with superadmin access
CREATE POLICY "Public can read active ads"
  ON pop_up_ads FOR SELECT
  TO public
  USING (
    is_active = true 
    AND start_date <= now() 
    AND (end_date IS NULL OR end_date >= now())
  );

CREATE POLICY "Superadmin has full access to ads"
  ON pop_up_ads FOR ALL
  TO authenticated
  USING (is_superadmin_by_id())
  WITH CHECK (is_superadmin_by_id());

CREATE POLICY "Admins can manage all ads"
  ON pop_up_ads FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  ));

-- Product categories policies with superadmin access
CREATE POLICY "Anyone can view product categories"
  ON product_categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Superadmin has full access to product categories"
  ON product_categories FOR ALL
  TO authenticated
  USING (is_superadmin_by_id())
  WITH CHECK (is_superadmin_by_id());

-- Product arrangements policies with superadmin access
CREATE POLICY "Anyone can view active product arrangements"
  ON product_arrangements FOR SELECT
  TO public
  USING ((is_visible = true) 
    AND ((starts_at IS NULL) OR (starts_at <= now())) 
    AND ((ends_at IS NULL) OR (ends_at > now())) 
    AND (EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = product_arrangements.store_id 
      AND stores.is_active = true 
      AND stores.approval_status = 'approved'
    )));

CREATE POLICY "Superadmin has full access to product arrangements"
  ON product_arrangements FOR ALL
  TO authenticated
  USING (is_superadmin_by_id())
  WITH CHECK (is_superadmin_by_id());

CREATE POLICY "Store owners can manage their product arrangements"
  ON product_arrangements FOR ALL
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

-- Fraud list policies with superadmin access
CREATE POLICY "Superadmin has full access to fraud list"
  ON fraud_list FOR ALL
  TO authenticated
  USING (is_superadmin_by_id())
  WITH CHECK (is_superadmin_by_id());

CREATE POLICY "Admins can manage fraud list"
  ON fraud_list FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  ));

-- Store categories policies with superadmin access
CREATE POLICY "Anyone can view active store categories"
  ON store_categories FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Superadmin has full access to store categories"
  ON store_categories FOR ALL
  TO authenticated
  USING (is_superadmin_by_id())
  WITH CHECK (is_superadmin_by_id());

CREATE POLICY "Admins can manage store categories"
  ON store_categories FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  ));

-- Store category assignments policies with superadmin access
CREATE POLICY "Anyone can view store category assignments"
  ON store_category_assignments FOR SELECT
  TO public
  USING (EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = store_category_assignments.store_id 
    AND stores.is_active = true 
    AND stores.approval_status = 'approved'
  ));

CREATE POLICY "Superadmin has full access to store category assignments"
  ON store_category_assignments FOR ALL
  TO authenticated
  USING (is_superadmin_by_id())
  WITH CHECK (is_superadmin_by_id());

CREATE POLICY "Store owners can manage their category assignments"
  ON store_category_assignments FOR ALL
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

-- Login attempts policies with superadmin access
CREATE POLICY "Superadmin has full access to login attempts"
  ON login_attempts FOR ALL
  TO authenticated
  USING (is_superadmin_by_id())
  WITH CHECK (is_superadmin_by_id());

CREATE POLICY "Admins can view all login attempts"
  ON login_attempts FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  ));

-- User sessions policies with superadmin access
CREATE POLICY "Users can view their own sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Superadmin has full access to user sessions"
  ON user_sessions FOR ALL
  TO authenticated
  USING (is_superadmin_by_id())
  WITH CHECK (is_superadmin_by_id());

CREATE POLICY "Admins can view all sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  ));

-- Admin IP whitelist policies with superadmin access
CREATE POLICY "Superadmin has full access to IP whitelist"
  ON admin_ip_whitelist FOR ALL
  TO authenticated
  USING (is_superadmin_by_id())
  WITH CHECK (is_superadmin_by_id());

CREATE POLICY "Only admins can manage IP whitelist"
  ON admin_ip_whitelist FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  ));

-- User 2FA policies with superadmin access
CREATE POLICY "Users can manage their own 2FA"
  ON user_2fa FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Superadmin has full access to 2FA"
  ON user_2fa FOR ALL
  TO authenticated
  USING (is_superadmin_by_id())
  WITH CHECK (is_superadmin_by_id());

-- Insert or update the superadmin user in the users table if they exist in auth.users
DO $$
BEGIN
  -- Check if the superadmin exists in auth.users and insert/update in users table
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@kweepaing.com') THEN
    INSERT INTO users (id, email, role)
    SELECT id, email, 'admin'
    FROM auth.users 
    WHERE email = 'admin@kweepaing.com'
    ON CONFLICT (id) 
    DO UPDATE SET 
      role = 'admin',
      updated_at = now();
  END IF;
END $$;