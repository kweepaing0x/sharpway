/*
  # Create Hotels, Hotel Rooms, and Taxis Tables

  1. New Tables
    - `hotels`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text)
      - `logo_url` (text)
      - `location` (text, required)
      - `category` (text, required)
      - `channel_url` (text) - for embedding channel
      - `telegram_contact` (text, required) - t.me/username
      - `phone_number` (text)
      - `is_active` (boolean, default false)
      - `approval_status` (text, default 'pending')
      - `owner_id` (uuid, references auth.users)
      - `username` (text, unique, required) - for URL routing
      - `display_order` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `hotel_rooms`
      - `id` (uuid, primary key)
      - `hotel_id` (uuid, references hotels, cascade delete)
      - `room_number` (text, required)
      - `room_type` (text, required) - 'VIP' or 'Normal'
      - `floor_number` (integer, required)
      - `availability_status` (text, default 'available') - 'available' or 'booked'
      - `price_per_night` (numeric)
      - `room_images` (text array)
      - `amenities` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `taxis`
      - `id` (uuid, primary key)
      - `driver_name` (text, required)
      - `description` (text)
      - `photo_url` (text)
      - `vehicle_type` (text, required) - 'motorcycle' or 'car'
      - `availability_status` (boolean, default true)
      - `phone_number` (text, required)
      - `telegram_contact` (text, required) - t.me/username
      - `location` (text, required)
      - `is_active` (boolean, default false)
      - `approval_status` (text, default 'pending')
      - `owner_id` (uuid, references auth.users)
      - `username` (text, unique, required) - for URL routing
      - `display_order` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `hotel_managers`
      - Similar structure to store_managers

    - `taxi_managers`
      - Similar structure to store_managers

  2. Security
    - Enable RLS on all new tables
    - Add policies for public read access (approved and active items only)
    - Add policies for owner/manager access
    - Add policies for superadmin full access

  3. Indexes
    - Add indexes on username fields for fast lookups
    - Add indexes on approval_status and is_active for filtering
    - Add index on hotel_id in hotel_rooms for joins
*/

-- Create hotels table
CREATE TABLE IF NOT EXISTS public.hotels (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    logo_url text,
    location text NOT NULL,
    category text NOT NULL,
    channel_url text,
    telegram_contact text NOT NULL,
    phone_number text,
    is_active boolean DEFAULT false NOT NULL,
    approval_status text DEFAULT 'pending' NOT NULL CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    username text UNIQUE NOT NULL,
    display_order integer,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create hotel_rooms table
CREATE TABLE IF NOT EXISTS public.hotel_rooms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    room_number text NOT NULL,
    room_type text NOT NULL CHECK (room_type IN ('VIP', 'Normal')),
    floor_number integer NOT NULL,
    availability_status text DEFAULT 'available' NOT NULL CHECK (availability_status IN ('available', 'booked')),
    price_per_night numeric,
    room_images text[],
    amenities text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(hotel_id, room_number)
);

-- Create taxis table
CREATE TABLE IF NOT EXISTS public.taxis (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_name text NOT NULL,
    description text,
    photo_url text,
    vehicle_type text NOT NULL CHECK (vehicle_type IN ('motorcycle', 'car')),
    availability_status boolean DEFAULT true NOT NULL,
    phone_number text NOT NULL,
    telegram_contact text NOT NULL,
    location text NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    approval_status text DEFAULT 'pending' NOT NULL CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    username text UNIQUE NOT NULL,
    display_order integer,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create hotel_managers table
CREATE TABLE IF NOT EXISTS public.hotel_managers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id),
    UNIQUE(user_id, hotel_id)
);

-- Create taxi_managers table
CREATE TABLE IF NOT EXISTS public.taxi_managers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    taxi_id uuid NOT NULL REFERENCES public.taxis(id) ON DELETE CASCADE,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id),
    UNIQUE(user_id, taxi_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_hotels_username ON public.hotels(username);
CREATE INDEX IF NOT EXISTS idx_hotels_approval_status ON public.hotels(approval_status);
CREATE INDEX IF NOT EXISTS idx_hotels_is_active ON public.hotels(is_active);
CREATE INDEX IF NOT EXISTS idx_hotels_display_order ON public.hotels(display_order);

CREATE INDEX IF NOT EXISTS idx_hotel_rooms_hotel_id ON public.hotel_rooms(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_rooms_availability ON public.hotel_rooms(availability_status);

CREATE INDEX IF NOT EXISTS idx_taxis_username ON public.taxis(username);
CREATE INDEX IF NOT EXISTS idx_taxis_approval_status ON public.taxis(approval_status);
CREATE INDEX IF NOT EXISTS idx_taxis_is_active ON public.taxis(is_active);
CREATE INDEX IF NOT EXISTS idx_taxis_vehicle_type ON public.taxis(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_taxis_availability ON public.taxis(availability_status);

-- Enable RLS
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxi_managers ENABLE ROW LEVEL SECURITY;

-- Hotels policies
CREATE POLICY "Public can view approved and active hotels"
    ON public.hotels FOR SELECT
    TO public
    USING (approval_status = 'approved' AND is_active = true);

CREATE POLICY "Hotel owners can view their own hotels"
    ON public.hotels FOR SELECT
    TO authenticated
    USING (owner_id = auth.uid());

CREATE POLICY "Hotel owners can update their own hotels"
    ON public.hotels FOR UPDATE
    TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Hotel owners can insert their own hotels"
    ON public.hotels FOR INSERT
    TO authenticated
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Hotel managers can view assigned hotels"
    ON public.hotels FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.hotel_managers
        WHERE hotel_managers.hotel_id = hotels.id
        AND hotel_managers.user_id = auth.uid()
        AND hotel_managers.is_active = true
    ));

CREATE POLICY "Hotel managers can update assigned hotels"
    ON public.hotels FOR UPDATE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.hotel_managers
        WHERE hotel_managers.hotel_id = hotels.id
        AND hotel_managers.user_id = auth.uid()
        AND hotel_managers.is_active = true
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.hotel_managers
        WHERE hotel_managers.hotel_id = hotels.id
        AND hotel_managers.user_id = auth.uid()
        AND hotel_managers.is_active = true
    ));

CREATE POLICY "Superadmins have full access to hotels"
    ON public.hotels FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'superadmin'
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'superadmin'
    ));

-- Hotel rooms policies
CREATE POLICY "Public can view rooms of active hotels"
    ON public.hotel_rooms FOR SELECT
    TO public
    USING (EXISTS (
        SELECT 1 FROM public.hotels
        WHERE hotels.id = hotel_rooms.hotel_id
        AND hotels.is_active = true
        AND hotels.approval_status = 'approved'
    ));

CREATE POLICY "Hotel owners can manage their hotel rooms"
    ON public.hotel_rooms FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.hotels
        WHERE hotels.id = hotel_rooms.hotel_id
        AND hotels.owner_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.hotels
        WHERE hotels.id = hotel_rooms.hotel_id
        AND hotels.owner_id = auth.uid()
    ));

CREATE POLICY "Hotel managers can manage assigned hotel rooms"
    ON public.hotel_rooms FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.hotel_managers
        WHERE hotel_managers.hotel_id = hotel_rooms.hotel_id
        AND hotel_managers.user_id = auth.uid()
        AND hotel_managers.is_active = true
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.hotel_managers
        WHERE hotel_managers.hotel_id = hotel_rooms.hotel_id
        AND hotel_managers.user_id = auth.uid()
        AND hotel_managers.is_active = true
    ));

CREATE POLICY "Superadmins have full access to hotel rooms"
    ON public.hotel_rooms FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'superadmin'
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'superadmin'
    ));

-- Taxis policies
CREATE POLICY "Public can view approved and active taxis"
    ON public.taxis FOR SELECT
    TO public
    USING (approval_status = 'approved' AND is_active = true);

CREATE POLICY "Taxi owners can view their own taxis"
    ON public.taxis FOR SELECT
    TO authenticated
    USING (owner_id = auth.uid());

CREATE POLICY "Taxi owners can update their own taxis"
    ON public.taxis FOR UPDATE
    TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Taxi owners can insert their own taxis"
    ON public.taxis FOR INSERT
    TO authenticated
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Taxi managers can view assigned taxis"
    ON public.taxis FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.taxi_managers
        WHERE taxi_managers.taxi_id = taxis.id
        AND taxi_managers.user_id = auth.uid()
        AND taxi_managers.is_active = true
    ));

CREATE POLICY "Taxi managers can update assigned taxis"
    ON public.taxis FOR UPDATE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.taxi_managers
        WHERE taxi_managers.taxi_id = taxis.id
        AND taxi_managers.user_id = auth.uid()
        AND taxi_managers.is_active = true
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.taxi_managers
        WHERE taxi_managers.taxi_id = taxis.id
        AND taxi_managers.user_id = auth.uid()
        AND taxi_managers.is_active = true
    ));

CREATE POLICY "Superadmins have full access to taxis"
    ON public.taxis FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'superadmin'
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'superadmin'
    ));

-- Hotel managers policies
CREATE POLICY "Superadmins can manage hotel managers"
    ON public.hotel_managers FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'superadmin'
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'superadmin'
    ));

CREATE POLICY "Hotel managers can view their assignments"
    ON public.hotel_managers FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() AND is_active = true);

-- Taxi managers policies
CREATE POLICY "Superadmins can manage taxi managers"
    ON public.taxi_managers FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'superadmin'
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'superadmin'
    ));

CREATE POLICY "Taxi managers can view their assignments"
    ON public.taxi_managers FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() AND is_active = true);

-- Create trigger functions for updated_at
CREATE OR REPLACE FUNCTION update_hotels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_hotel_rooms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_taxis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER hotels_updated_at_trigger
    BEFORE UPDATE ON public.hotels
    FOR EACH ROW
    EXECUTE FUNCTION update_hotels_updated_at();

CREATE TRIGGER hotel_rooms_updated_at_trigger
    BEFORE UPDATE ON public.hotel_rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_hotel_rooms_updated_at();

CREATE TRIGGER taxis_updated_at_trigger
    BEFORE UPDATE ON public.taxis
    FOR EACH ROW
    EXECUTE FUNCTION update_taxis_updated_at();

-- Grant permissions
GRANT SELECT ON public.hotels TO anon, authenticated;
GRANT SELECT ON public.hotel_rooms TO anon, authenticated;
GRANT SELECT ON public.taxis TO anon, authenticated;
GRANT ALL ON public.hotels TO authenticated;
GRANT ALL ON public.hotel_rooms TO authenticated;
GRANT ALL ON public.taxis TO authenticated;
GRANT ALL ON public.hotel_managers TO authenticated;
GRANT ALL ON public.taxi_managers TO authenticated;