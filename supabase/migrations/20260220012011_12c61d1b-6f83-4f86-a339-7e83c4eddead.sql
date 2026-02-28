
-- Admin can view ALL ideas across orgs
CREATE POLICY "Admin can view all ideas"
  ON public.chef_ideas FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Admin can update ALL ideas (status, badge, admin_note)
CREATE POLICY "Admin can update all ideas"
  ON public.chef_ideas FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

-- Admin can view ALL badges
CREATE POLICY "Admin can view all badges"
  ON public.chef_idea_badges FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Admin can award badges
CREATE POLICY "Admin can award badges"
  ON public.chef_idea_badges FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));
