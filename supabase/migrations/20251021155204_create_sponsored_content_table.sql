/*
  # Create Sponsored Content Table

  1. New Tables
    - `sponsored_content`
      - `id` (uuid, primary key)
      - `title` (text) - Title or name for the sponsored content
      - `image_url` (text) - URL to the sponsored image
      - `redirect_url` (text) - URL where users will be redirected when clicking
      - `display_order` (integer) - Order in which items appear in carousel
      - `is_active` (boolean) - Whether the content is currently active
      - `start_date` (timestamptz) - When the sponsored content should start showing
      - `end_date` (timestamptz, nullable) - When the sponsored content should stop showing
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `sponsored_content` table
    - Add policy for public to read active sponsored content
    - Add policy for superadmin to manage all sponsored content
  
  3. Indexes
    - Add index on `is_active` for faster queries
    - Add index on `display_order` for sorting
*/

-- Create sponsored_content table
CREATE TABLE IF NOT EXISTS sponsored_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_url text NOT NULL,
  redirect_url text NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE sponsored_content ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sponsored_content_active ON sponsored_content(is_active);
CREATE INDEX IF NOT EXISTS idx_sponsored_content_display_order ON sponsored_content(display_order);

-- Public can view active sponsored content within date range
CREATE POLICY "Public can view active sponsored content"
  ON sponsored_content FOR SELECT
  TO public
  USING (
    is_active = true 
    AND start_date <= now() 
    AND (end_date IS NULL OR end_date >= now())
  );

-- Authenticated users can also view active sponsored content
CREATE POLICY "Authenticated can view active sponsored content"
  ON sponsored_content FOR SELECT
  TO authenticated
  USING (
    is_active = true 
    AND start_date <= now() 
    AND (end_date IS NULL OR end_date >= now())
  );

-- Superadmin can view all sponsored content
CREATE POLICY "Superadmin can view all sponsored content"
  ON sponsored_content FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  );

-- Superadmin can insert sponsored content
CREATE POLICY "Superadmin can insert sponsored content"
  ON sponsored_content FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  );

-- Superadmin can update sponsored content
CREATE POLICY "Superadmin can update sponsored content"
  ON sponsored_content FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  );

-- Superadmin can delete sponsored content
CREATE POLICY "Superadmin can delete sponsored content"
  ON sponsored_content FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_sponsored_content_updated_at'
  ) THEN
    CREATE TRIGGER update_sponsored_content_updated_at
      BEFORE UPDATE ON sponsored_content
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
