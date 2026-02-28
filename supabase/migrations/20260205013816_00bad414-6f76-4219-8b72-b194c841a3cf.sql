-- Create vendor role enum
DO $$ BEGIN
  CREATE TYPE public.vendor_role AS ENUM ('vendor_admin', 'vendor_staff');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Vendor profiles table
CREATE TABLE public.vendor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  business_name text NOT NULL,
  abn text,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  address text,
  postcode text,
  delivery_areas text[] DEFAULT '{}',
  categories text[] DEFAULT '{}',
  logo_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Vendor roles table (separate from profiles for security)
CREATE TABLE public.vendor_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  vendor_id uuid REFERENCES public.vendor_profiles(id) ON DELETE CASCADE NOT NULL,
  role vendor_role NOT NULL DEFAULT 'vendor_staff',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, vendor_id)
);

-- Vendor pricing table
CREATE TABLE public.vendor_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES public.vendor_profiles(id) ON DELETE CASCADE NOT NULL,
  ingredient_name text NOT NULL,
  category text DEFAULT 'Other',
  unit text NOT NULL DEFAULT 'kg',
  price_per_unit numeric NOT NULL CHECK (price_per_unit >= 0),
  min_order_quantity numeric DEFAULT 1,
  max_order_quantity numeric,
  lead_time_days integer DEFAULT 1,
  is_available boolean DEFAULT true,
  notes text,
  valid_from date DEFAULT CURRENT_DATE,
  valid_until date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Vendor deals/promotions table
CREATE TABLE public.vendor_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES public.vendor_profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  discount_percent numeric CHECK (discount_percent >= 0 AND discount_percent <= 100),
  discount_amount numeric CHECK (discount_amount >= 0),
  min_order_value numeric,
  applicable_categories text[] DEFAULT '{}',
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Orders from chefs to vendors
CREATE TABLE public.vendor_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE DEFAULT 'ORD-' || LPAD(floor(random() * 1000000)::text, 6, '0'),
  vendor_id uuid REFERENCES public.vendor_profiles(id) ON DELETE SET NULL,
  chef_user_id uuid NOT NULL,
  items jsonb NOT NULL DEFAULT '[]',
  subtotal numeric NOT NULL DEFAULT 0,
  delivery_fee numeric DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  delivery_date date,
  delivery_address text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Vendor-chef messages
CREATE TABLE public.vendor_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES public.vendor_profiles(id) ON DELETE CASCADE NOT NULL,
  chef_user_id uuid NOT NULL,
  order_id uuid REFERENCES public.vendor_orders(id) ON DELETE SET NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('vendor', 'chef')),
  sender_id uuid NOT NULL,
  message text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Anonymized demand insights (aggregated, delayed by 1 week)
CREATE TABLE public.demand_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_category text NOT NULL,
  postcode text NOT NULL,
  week_ending date NOT NULL,
  total_quantity numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'kg',
  order_count integer NOT NULL DEFAULT 0,
  avg_price_paid numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ingredient_category, postcode, week_ending)
);

-- Enable RLS on all vendor tables
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_insights ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user is a vendor
CREATE OR REPLACE FUNCTION public.is_vendor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.vendor_profiles
    WHERE user_id = _user_id AND status = 'approved'
  )
$$;

-- Get vendor_id for a user
CREATE OR REPLACE FUNCTION public.get_vendor_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.vendor_profiles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS Policies for vendor_profiles
CREATE POLICY "Vendors can view own profile"
  ON public.vendor_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Vendors can update own profile"
  ON public.vendor_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Chefs can view approved vendors"
  ON public.vendor_profiles FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Anyone can create vendor profile"
  ON public.vendor_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for vendor_roles
CREATE POLICY "Users can view own vendor role"
  ON public.vendor_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Vendor admins can manage roles"
  ON public.vendor_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.vendor_roles vr
      WHERE vr.user_id = auth.uid()
        AND vr.vendor_id = vendor_roles.vendor_id
        AND vr.role = 'vendor_admin'
    )
  );

-- RLS Policies for vendor_pricing
CREATE POLICY "Vendors can manage own pricing"
  ON public.vendor_pricing FOR ALL
  USING (vendor_id = public.get_vendor_id(auth.uid()));

CREATE POLICY "Chefs can view available pricing"
  ON public.vendor_pricing FOR SELECT
  USING (
    is_available = true 
    AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
  );

-- RLS Policies for vendor_deals
CREATE POLICY "Vendors can manage own deals"
  ON public.vendor_deals FOR ALL
  USING (vendor_id = public.get_vendor_id(auth.uid()));

CREATE POLICY "Chefs can view active deals"
  ON public.vendor_deals FOR SELECT
  USING (
    is_active = true 
    AND start_date <= CURRENT_DATE 
    AND end_date >= CURRENT_DATE
  );

-- RLS Policies for vendor_orders
CREATE POLICY "Vendors can view their orders"
  ON public.vendor_orders FOR SELECT
  USING (vendor_id = public.get_vendor_id(auth.uid()));

CREATE POLICY "Vendors can update their orders"
  ON public.vendor_orders FOR UPDATE
  USING (vendor_id = public.get_vendor_id(auth.uid()));

CREATE POLICY "Chefs can view own orders"
  ON public.vendor_orders FOR SELECT
  USING (auth.uid() = chef_user_id);

CREATE POLICY "Chefs can create orders"
  ON public.vendor_orders FOR INSERT
  WITH CHECK (auth.uid() = chef_user_id);

CREATE POLICY "Chefs can cancel own orders"
  ON public.vendor_orders FOR UPDATE
  USING (auth.uid() = chef_user_id AND status = 'pending');

-- RLS Policies for vendor_messages
CREATE POLICY "Vendors can view their messages"
  ON public.vendor_messages FOR SELECT
  USING (vendor_id = public.get_vendor_id(auth.uid()));

CREATE POLICY "Vendors can send messages"
  ON public.vendor_messages FOR INSERT
  WITH CHECK (
    vendor_id = public.get_vendor_id(auth.uid()) 
    AND sender_type = 'vendor'
    AND sender_id = auth.uid()
  );

CREATE POLICY "Chefs can view their messages"
  ON public.vendor_messages FOR SELECT
  USING (auth.uid() = chef_user_id);

CREATE POLICY "Chefs can send messages"
  ON public.vendor_messages FOR INSERT
  WITH CHECK (
    auth.uid() = chef_user_id 
    AND sender_type = 'chef'
    AND sender_id = auth.uid()
  );

CREATE POLICY "Recipients can mark messages read"
  ON public.vendor_messages FOR UPDATE
  USING (
    (sender_type = 'chef' AND vendor_id = public.get_vendor_id(auth.uid()))
    OR (sender_type = 'vendor' AND auth.uid() = chef_user_id)
  );

-- RLS Policies for demand_insights (anonymized, delayed data)
CREATE POLICY "Approved vendors can view demand insights"
  ON public.demand_insights FOR SELECT
  USING (
    public.is_vendor(auth.uid())
    AND week_ending <= (CURRENT_DATE - INTERVAL '7 days')::date
  );

-- Triggers for updated_at
CREATE TRIGGER update_vendor_profiles_updated_at
  BEFORE UPDATE ON public.vendor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_pricing_updated_at
  BEFORE UPDATE ON public.vendor_pricing
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_deals_updated_at
  BEFORE UPDATE ON public.vendor_deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_orders_updated_at
  BEFORE UPDATE ON public.vendor_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();