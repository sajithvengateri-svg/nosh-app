
-- Home Cook Feature Config table (admin-managed feature toggles for home cook recipe features)
CREATE TABLE public.home_cook_feature_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_key TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  label TEXT NOT NULL,
  description TEXT,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.home_cook_feature_config ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read the config
CREATE POLICY "Authenticated users can read feature config"
ON public.home_cook_feature_config FOR SELECT
TO authenticated
USING (true);

-- Only admins can update
CREATE POLICY "Admins can update feature config"
ON public.home_cook_feature_config FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Seed default values
INSERT INTO public.home_cook_feature_config (feature_key, enabled, label, description) VALUES
  ('haccp', false, 'HACCP Details', 'Hazard Analysis & Critical Control Points documentation'),
  ('ccp', false, 'CCP Points', 'Critical Control Point monitoring and alerts'),
  ('shelf_life', true, 'Shelf Life', 'Track expiry dates and storage guidelines'),
  ('batch_recipes', true, 'Batch Recipes', 'Scale recipes for bulk cooking'),
  ('yield_tracking', true, 'Yield Tracking', 'Monitor waste and usable yield percentages'),
  ('recipe_components', false, 'Recipe Components', 'Modular sub-recipes and components'),
  ('allergens', true, 'Allergens', 'Allergen tracking and labelling'),
  ('tasting_notes', true, 'Tasting Notes', 'Flavour profiles and tasting documentation'),
  ('food_cost_alerts', false, 'Food Cost Alerts', 'Automated alerts when costs exceed thresholds');

-- Social Orders table
CREATE TABLE public.social_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  channel TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  note TEXT,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.social_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read social orders"
ON public.social_orders FOR SELECT
TO authenticated
USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Org members can insert social orders"
ON public.social_orders FOR INSERT
TO authenticated
WITH CHECK (org_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Org members can update social orders"
ON public.social_orders FOR UPDATE
TO authenticated
USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Org members can delete social orders"
ON public.social_orders FOR DELETE
TO authenticated
USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- Money Lite Entries table (for persisting Money Lite dashboard data)
CREATE TABLE public.money_lite_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_type TEXT NOT NULL DEFAULT 'weekly',
  revenue NUMERIC NOT NULL DEFAULT 0,
  food_cost NUMERIC NOT NULL DEFAULT 0,
  bev_cost NUMERIC NOT NULL DEFAULT 0,
  labour NUMERIC NOT NULL DEFAULT 0,
  overheads NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, period_start, period_type)
);

ALTER TABLE public.money_lite_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read money lite entries"
ON public.money_lite_entries FOR SELECT
TO authenticated
USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Org members can insert money lite entries"
ON public.money_lite_entries FOR INSERT
TO authenticated
WITH CHECK (org_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Org members can update money lite entries"
ON public.money_lite_entries FOR UPDATE
TO authenticated
USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));
