/*
  # Create Exchange Rates Table

  1. New Tables
    - `exchange_rates`
      - `base_currency` (text, primary key part)
      - `target_currency` (text, primary key part)  
      - `rate` (numeric)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `exchange_rates` table
    - Add policies for public read access and superadmin write access

  3. Functions
    - `update_exchange_rate` function for upsert operations

  4. Initial Data
    - Insert default exchange rates (THB-USD, THB-MMK, USD-MMK)
*/

-- Create the exchange_rates table
CREATE TABLE IF NOT EXISTS public.exchange_rates (
    base_currency text NOT NULL,
    target_currency text NOT NULL,
    rate numeric NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT exchange_rates_pkey PRIMARY KEY (base_currency, target_currency)
);

-- Enable RLS
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read exchange rates"
    ON public.exchange_rates
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Superadmin can insert exchange rates"
    ON public.exchange_rates
    FOR INSERT
    TO authenticated
    WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can update exchange rates"
    ON public.exchange_rates
    FOR UPDATE
    TO authenticated
    USING (is_superadmin_by_id_v2())
    WITH CHECK (is_superadmin_by_id_v2());

CREATE POLICY "Superadmin can delete exchange rates"
    ON public.exchange_rates
    FOR DELETE
    TO authenticated
    USING (is_superadmin_by_id_v2());

-- Create the update function
CREATE OR REPLACE FUNCTION public.update_exchange_rate(
    p_base_currency text,
    p_target_currency text,
    p_rate numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.exchange_rates (base_currency, target_currency, rate)
    VALUES (p_base_currency, p_target_currency, p_rate)
    ON CONFLICT (base_currency, target_currency) DO UPDATE
    SET rate = p_rate, updated_at = now();
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.update_exchange_rate(text, text, numeric) TO authenticated;
GRANT SELECT ON public.exchange_rates TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.exchange_rates TO authenticated;

-- Insert default exchange rates
INSERT INTO public.exchange_rates (base_currency, target_currency, rate)
VALUES
    ('THB', 'USD', 0.028),
    ('THB', 'MMK', 136),
    ('USD', 'MMK', 3300)
ON CONFLICT (base_currency, target_currency) DO NOTHING;

-- Create trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_exchange_rates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_exchange_rates_updated_at_trigger
    BEFORE UPDATE ON public.exchange_rates
    FOR EACH ROW
    EXECUTE FUNCTION update_exchange_rates_updated_at();