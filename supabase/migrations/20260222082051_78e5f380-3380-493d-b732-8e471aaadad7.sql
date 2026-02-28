
-- Create mobile_nav_sections table for per-org mobile navigation configuration
CREATE TABLE public.mobile_nav_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  label TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  module_paths TEXT[] DEFAULT '{}',
  direct_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, section_key)
);

-- Enable RLS
ALTER TABLE public.mobile_nav_sections ENABLE ROW LEVEL SECURITY;

-- Org members can read their org's config
CREATE POLICY "Org members can view mobile nav sections"
  ON public.mobile_nav_sections FOR SELECT
  USING (public.is_org_member(auth.uid(), org_id));

-- Only org owners/head_chefs can modify
CREATE POLICY "Org admins can insert mobile nav sections"
  ON public.mobile_nav_sections FOR INSERT
  WITH CHECK (public.is_org_head_chef(auth.uid(), org_id));

CREATE POLICY "Org admins can update mobile nav sections"
  ON public.mobile_nav_sections FOR UPDATE
  USING (public.is_org_head_chef(auth.uid(), org_id));

CREATE POLICY "Org admins can delete mobile nav sections"
  ON public.mobile_nav_sections FOR DELETE
  USING (public.is_org_head_chef(auth.uid(), org_id));

-- Platform admins can do everything
CREATE POLICY "Admins full access to mobile nav sections"
  ON public.mobile_nav_sections FOR ALL
  USING (public.is_admin(auth.uid()));

-- Auto-update updated_at
CREATE TRIGGER update_mobile_nav_sections_updated_at
  BEFORE UPDATE ON public.mobile_nav_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
