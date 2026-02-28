
-- Make org_id nullable for global config
ALTER TABLE public.mobile_nav_sections ALTER COLUMN org_id DROP NOT NULL;

-- Drop old unique constraint and create new one that supports NULL org_id
ALTER TABLE public.mobile_nav_sections DROP CONSTRAINT IF EXISTS mobile_nav_sections_org_id_section_key_key;

-- Create unique index for global config (org_id IS NULL)
CREATE UNIQUE INDEX mobile_nav_sections_global_section_key_idx 
  ON public.mobile_nav_sections (section_key) WHERE org_id IS NULL;

-- Keep per-org uniqueness too (future use)
CREATE UNIQUE INDEX mobile_nav_sections_org_section_key_idx 
  ON public.mobile_nav_sections (org_id, section_key) WHERE org_id IS NOT NULL;

-- Drop old RLS policies and create new ones
DROP POLICY IF EXISTS "Org members can read nav sections" ON public.mobile_nav_sections;
DROP POLICY IF EXISTS "Org owners/head chefs can manage nav sections" ON public.mobile_nav_sections;

-- Anyone authenticated can read global config
CREATE POLICY "Authenticated users can read global nav sections"
  ON public.mobile_nav_sections FOR SELECT
  USING (org_id IS NULL AND auth.uid() IS NOT NULL);

-- Only admins can manage global config
CREATE POLICY "Admins can manage global nav sections"
  ON public.mobile_nav_sections FOR ALL
  USING (org_id IS NULL AND public.is_admin(auth.uid()))
  WITH CHECK (org_id IS NULL AND public.is_admin(auth.uid()));

-- Clean up any existing per-org data
DELETE FROM public.mobile_nav_sections WHERE org_id IS NOT NULL;
