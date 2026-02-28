
-- Fix overly permissive INSERT policies

-- 1. res_guests: Replace open anon insert with scoped policy requiring org_id exists
DROP POLICY IF EXISTS "Anon can insert guests from widget" ON public.res_guests;
CREATE POLICY "Anon can insert guests from widget"
  ON public.res_guests FOR INSERT TO anon
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.organizations WHERE id = org_id)
    AND source = 'widget'
  );

-- 2. training_completions: Replace open authenticated insert with org membership check
DROP POLICY IF EXISTS "Authenticated can insert training" ON public.training_completions;
CREATE POLICY "Authenticated can insert training" ON public.training_completions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), org_id));

-- 3. training_completions: Replace open anon insert with org_id validation
DROP POLICY IF EXISTS "Anon can insert training" ON public.training_completions;
CREATE POLICY "Anon can insert training" ON public.training_completions
  FOR INSERT TO anon
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.organizations WHERE id = org_id)
  );
