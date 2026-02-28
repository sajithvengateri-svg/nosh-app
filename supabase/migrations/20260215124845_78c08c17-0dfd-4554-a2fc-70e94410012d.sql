
-- Customizable temp check locations per shift (AM/PM)
CREATE TABLE public.temp_check_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations(id),
  location_name TEXT NOT NULL,
  location_type TEXT NOT NULL DEFAULT 'fridge',
  shift TEXT NOT NULL DEFAULT 'am',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.temp_check_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org temp config"
  ON public.temp_check_config FOR SELECT
  USING (org_id IN (SELECT get_user_org_ids(auth.uid())) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Head chefs can manage temp config"
  ON public.temp_check_config FOR ALL
  USING (is_head_chef(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid())))
  WITH CHECK (is_head_chef(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid())));

-- Monthly master archive sheets
CREATE TABLE public.temp_check_archives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations(id),
  month TEXT NOT NULL,
  sheet_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_checks INTEGER DEFAULT 0,
  pass_count INTEGER DEFAULT 0,
  warning_count INTEGER DEFAULT 0,
  fail_count INTEGER DEFAULT 0,
  archived_by UUID,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.temp_check_archives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org temp archives"
  ON public.temp_check_archives FOR SELECT
  USING (org_id IN (SELECT get_user_org_ids(auth.uid())) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Head chefs can manage temp archives"
  ON public.temp_check_archives FOR ALL
  USING (is_head_chef(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid())))
  WITH CHECK (is_head_chef(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid())));

-- Add shift column to food_safety_logs for AM/PM tagging
ALTER TABLE public.food_safety_logs ADD COLUMN IF NOT EXISTS shift TEXT DEFAULT NULL;
