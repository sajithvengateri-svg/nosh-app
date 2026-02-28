
DROP POLICY "Admins and owners can update landing sections" ON public.landing_sections;
DROP POLICY "Admins and owners can insert landing sections" ON public.landing_sections;
DROP POLICY "Admins and owners can delete landing sections" ON public.landing_sections;

CREATE POLICY "Admins and owners can update landing sections"
ON public.landing_sections FOR UPDATE
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins and owners can insert landing sections"
ON public.landing_sections FOR INSERT
WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins and owners can delete landing sections"
ON public.landing_sections FOR DELETE
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'owner'));
