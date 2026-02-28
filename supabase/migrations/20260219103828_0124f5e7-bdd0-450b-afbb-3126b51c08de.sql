
-- Drop the existing restrictive update policy
DROP POLICY "Admins can update landing sections" ON public.landing_sections;
DROP POLICY "Admins can insert landing sections" ON public.landing_sections;
DROP POLICY "Admins can delete landing sections" ON public.landing_sections;

-- Recreate policies to also allow owners and head_chefs
CREATE POLICY "Admins and owners can update landing sections"
ON public.landing_sections FOR UPDATE
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'head_chef'));

CREATE POLICY "Admins and owners can insert landing sections"
ON public.landing_sections FOR INSERT
WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'head_chef'));

CREATE POLICY "Admins and owners can delete landing sections"
ON public.landing_sections FOR DELETE
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'head_chef'));
