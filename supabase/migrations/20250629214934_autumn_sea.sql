/*
  # Add is_active column to product_categories table

  1. Changes
    - Add `is_active` column to `product_categories` table
    - Set default value to `true`
    - Update existing records to have `is_active = true`

  2. Security
    - No RLS changes needed as existing policies will apply to the new column
*/

-- Add is_active column to product_categories table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_categories' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE product_categories ADD COLUMN is_active boolean DEFAULT true;
    
    -- Update existing records to have is_active = true
    UPDATE product_categories SET is_active = true WHERE is_active IS NULL;
  END IF;
END $$;

-- Create index for better performance on is_active queries
CREATE INDEX IF NOT EXISTS idx_product_categories_active 
ON product_categories USING btree (is_active);