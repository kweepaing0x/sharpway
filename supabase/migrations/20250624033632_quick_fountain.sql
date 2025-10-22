/*
  # Fix RLS policies with proper variable naming
  
  1. Functions
    - Create admin access check function for security
    
  2. Policy Management
    - Drop existing policies safely with table existence checks
    - Create comprehensive RLS policies for all tables
    - Handle dependencies between tables properly
    
  3. Security
    - Role-based access control (public, authenticated, admin, store owners, managers)
    - Proper data isolation and authorization
    - Admin security checks with IP validation capability
*/

-- Create admin access check function
CREATE OR REPLACE FUNCTION check_admin_access(user_id uuid, client_ip inet)
RETURNS boolean AS $$
BEGIN
  -- For now, just return true for admin users
  -- This can be enhanced later with IP restrictions
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = user_id 
    AND users.role = 'admin'
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
    current_table text;
BEGIN
    FOREACH current_table IN ARRAY table_list
    LOOP
        -- Check if table exists before trying to drop policies
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = current_table) THEN
            FOR policy_record IN 
                EXECUTE 'SELECT policyname FROM pg_policies WHERE tablename = $1' USING current_table
            LOOP
                EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON ' || current_table;
            END LOOP;
        END IF;
    END LOOP;
END $$;

-- Users table policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
    CREATE POLICY "Users can read own data"
      ON users FOR SELECT
      TO authenticated
      USING (auth.uid() = id);

    CREATE POLICY "Admins can manage all users"
      ON users FOR ALL
      TO authenticated
      USING ((id = auth.uid()) AND (role = 'admin') AND check_admin_access(id, inet_client_addr()))
      WITH CHECK ((id = auth.uid()) AND (role = 'admin') AND check_admin_access(id, inet_client_addr()));
  END IF;
END $$;

-- Stores table policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stores') THEN
    CREATE POLICY "Public can view approved and active stores"
      ON stores FOR SELECT
      TO public
      USING ((approval_status = 'approved') AND (is_active = true));

    CREATE POLICY "Authenticated users can view approved and active stores"
      ON stores FOR SELECT
      TO authenticated
      USING ((approval_status = 'approved') AND (is_active = true));

    CREATE POLICY "Store owners can manage their own stores"
      ON stores FOR ALL
      TO authenticated
      USING ((owner_id = auth.uid()) AND ((approval_status = 'approved') OR (approval_status = 'pending')))
      WITH CHECK ((owner_id = auth.uid()) AND ((approval_status = 'approved') OR (approval_status = 'pending')));

    -- Only create store manager policies if store_managers table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'store_managers') THEN
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
    END IF;

    -- Only create admin policies if users table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
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
    END IF;
  END IF;
END $$;

-- Store hours policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'store_hours') THEN
    CREATE POLICY "Anyone can view store hours"
      ON store_hours FOR SELECT
      TO public
      USING (EXISTS (
        SELECT 1 FROM stores 
        WHERE stores.id = store_hours.store_id 
        AND stores.is_active = true 
        AND stores.approval_status = 'approved'
      ));

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
  END IF;
END $$;

-- Products table policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products') THEN
    CREATE POLICY "Anyone can view products from active stores"
      ON products FOR SELECT
      TO public
      USING (EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = products.store_id 
        AND stores.is_active = true 
        AND stores.approval_status = 'approved'
      ));

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

    -- Only create store manager policies if store_managers table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'store_managers') THEN
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
    END IF;
  END IF;
END $$;

-- Orders table policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN
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

    CREATE POLICY "Store owners can view their store orders"
      ON orders FOR SELECT
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = orders.store_id 
        AND stores.owner_id = auth.uid()
      ));
  END IF;
END $$;

-- Order items table policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'order_items') THEN
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

    CREATE POLICY "Store owners can view their store order items"
      ON order_items FOR SELECT
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM orders
        JOIN stores ON stores.id = orders.store_id
        WHERE orders.id = order_items.order_id 
        AND stores.owner_id = auth.uid()
      ));
  END IF;
END $$;

-- Store managers table policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'store_managers') THEN
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
  END IF;
END $$;

-- Manager audit logs policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'manager_audit_logs') THEN
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
  END IF;
END $$;

-- App settings policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'app_settings') THEN
    CREATE POLICY "Anyone can read app settings"
      ON app_settings FOR SELECT
      TO public
      USING (true);

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
  END IF;
END $$;

-- Marquee announcements policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'marquee_announcements') THEN
    CREATE POLICY "Public can read active announcements"
      ON marquee_announcements FOR SELECT
      TO public
      USING (
        is_active = true 
        AND start_date <= now() 
        AND (end_date IS NULL OR end_date >= now())
      );

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
  END IF;
END $$;

-- Pop-up ads policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pop_up_ads') THEN
    CREATE POLICY "Public can read active ads"
      ON pop_up_ads FOR SELECT
      TO public
      USING (
        is_active = true 
        AND start_date <= now() 
        AND (end_date IS NULL OR end_date >= now())
      );

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
  END IF;
END $$;

-- Product categories policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_categories') THEN
    CREATE POLICY "Anyone can view product categories"
      ON product_categories FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

-- Product arrangements policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_arrangements') THEN
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
  END IF;
END $$;

-- Fraud list policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'fraud_list') THEN
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
  END IF;
END $$;

-- Store categories policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'store_categories') THEN
    CREATE POLICY "Anyone can view active store categories"
      ON store_categories FOR SELECT
      TO public
      USING (is_active = true);

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
  END IF;
END $$;

-- Store category assignments policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'store_category_assignments') THEN
    CREATE POLICY "Anyone can view store category assignments"
      ON store_category_assignments FOR SELECT
      TO public
      USING (EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = store_category_assignments.store_id 
        AND stores.is_active = true 
        AND stores.approval_status = 'approved'
      ));

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
  END IF;
END $$;

-- Login attempts policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'login_attempts') THEN
    CREATE POLICY "Admins can view all login attempts"
      ON login_attempts FOR SELECT
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
      ));
  END IF;
END $$;

-- User sessions policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_sessions') THEN
    CREATE POLICY "Users can view their own sessions"
      ON user_sessions FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());

    CREATE POLICY "Admins can view all sessions"
      ON user_sessions FOR SELECT
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
      ));
  END IF;
END $$;

-- Admin IP whitelist policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admin_ip_whitelist') THEN
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
  END IF;
END $$;

-- User 2FA policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_2fa') THEN
    CREATE POLICY "Users can manage their own 2FA"
      ON user_2fa FOR ALL
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;