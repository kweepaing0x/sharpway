/*
  # Fix manager_audit_logs RLS policies for superadmin
  
  1. Changes
    - Safely drop existing policies with existence checks
    - Add system policy to allow trigger-based inserts
    - Ensure superadmin has full access to audit logs
    - Maintain existing access for admins and store managers
*/

-- Safely drop existing policies with existence checks
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Superadmin full access to audit logs' AND tablename = 'manager_audit_logs') THEN
    DROP POLICY "Superadmin full access to audit logs" ON manager_audit_logs;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage all audit logs' AND tablename = 'manager_audit_logs') THEN
    DROP POLICY "Admins can manage all audit logs" ON manager_audit_logs;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all audit logs' AND tablename = 'manager_audit_logs') THEN
    DROP POLICY "Admins can view all audit logs" ON manager_audit_logs;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view audit logs' AND tablename = 'manager_audit_logs') THEN
    DROP POLICY "Admins can view audit logs" ON manager_audit_logs;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Store managers can view their audit logs' AND tablename = 'manager_audit_logs') THEN
    DROP POLICY "Store managers can view their audit logs" ON manager_audit_logs;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'System can insert audit logs' AND tablename = 'manager_audit_logs') THEN
    DROP POLICY "System can insert audit logs" ON manager_audit_logs;
  END IF;
END $$;

-- Create comprehensive policies for manager_audit_logs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Superadmin full access to audit logs' AND tablename = 'manager_audit_logs') THEN
    CREATE POLICY "Superadmin full access to audit logs"
      ON manager_audit_logs
      FOR ALL
      TO authenticated
      USING (is_superadmin_by_id())
      WITH CHECK (is_superadmin_by_id());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage audit logs' AND tablename = 'manager_audit_logs') THEN
    CREATE POLICY "Admins can manage audit logs"
      ON manager_audit_logs
      FOR ALL
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
      ));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Store managers can view their audit logs' AND tablename = 'manager_audit_logs') THEN
    CREATE POLICY "Store managers can view their audit logs"
      ON manager_audit_logs
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'System can insert audit logs' AND tablename = 'manager_audit_logs') THEN
    CREATE POLICY "System can insert audit logs"
      ON manager_audit_logs
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;