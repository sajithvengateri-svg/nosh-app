
-- Fix: Add org_id scoping to all "Users with edit permission can manage X" policies
-- These policies currently allow cross-org data access (CRITICAL security hole)

-- ══════ recipes ══════
DROP POLICY IF EXISTS "Users with edit permission can manage recipes" ON public.recipes;
CREATE POLICY "Users with edit permission can manage recipes" ON public.recipes
  FOR ALL USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND EXISTS (SELECT 1 FROM module_permissions WHERE user_id = auth.uid() AND module = 'recipes' AND can_edit = true)
  ) WITH CHECK (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND EXISTS (SELECT 1 FROM module_permissions WHERE user_id = auth.uid() AND module = 'recipes' AND can_edit = true)
  );

-- ══════ ingredients ══════
DROP POLICY IF EXISTS "Users with edit permission can manage ingredients" ON public.ingredients;
CREATE POLICY "Users with edit permission can manage ingredients" ON public.ingredients
  FOR ALL USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND EXISTS (SELECT 1 FROM module_permissions WHERE user_id = auth.uid() AND module = 'ingredients' AND can_edit = true)
  ) WITH CHECK (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND EXISTS (SELECT 1 FROM module_permissions WHERE user_id = auth.uid() AND module = 'ingredients' AND can_edit = true)
  );

-- ══════ calendar_events ══════
DROP POLICY IF EXISTS "Users with edit permission can manage calendar" ON public.calendar_events;
CREATE POLICY "Users with edit permission can manage calendar" ON public.calendar_events
  FOR ALL USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND EXISTS (SELECT 1 FROM module_permissions WHERE user_id = auth.uid() AND module = 'calendar' AND can_edit = true)
  ) WITH CHECK (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND EXISTS (SELECT 1 FROM module_permissions WHERE user_id = auth.uid() AND module = 'calendar' AND can_edit = true)
  );

-- ══════ cheatsheets ══════
DROP POLICY IF EXISTS "Users with edit permission can manage cheatsheets" ON public.cheatsheets;
CREATE POLICY "Users with edit permission can manage cheatsheets" ON public.cheatsheets
  FOR ALL USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND EXISTS (SELECT 1 FROM module_permissions WHERE user_id = auth.uid() AND module = 'cheatsheets' AND can_edit = true)
  ) WITH CHECK (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND EXISTS (SELECT 1 FROM module_permissions WHERE user_id = auth.uid() AND module = 'cheatsheets' AND can_edit = true)
  );

-- ══════ cleaning_inventory ══════
DROP POLICY IF EXISTS "Users with edit permission can manage cleaning inventory" ON public.cleaning_inventory;
CREATE POLICY "Users with edit permission can manage cleaning inventory" ON public.cleaning_inventory
  FOR ALL USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND EXISTS (SELECT 1 FROM module_permissions WHERE user_id = auth.uid() AND module = 'inventory' AND can_edit = true)
  ) WITH CHECK (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND EXISTS (SELECT 1 FROM module_permissions WHERE user_id = auth.uid() AND module = 'inventory' AND can_edit = true)
  );

-- ══════ equipment ══════
DROP POLICY IF EXISTS "Users with edit permission can manage equipment" ON public.equipment;
CREATE POLICY "Users with edit permission can manage equipment" ON public.equipment
  FOR ALL USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND EXISTS (SELECT 1 FROM module_permissions WHERE user_id = auth.uid() AND module = 'equipment' AND can_edit = true)
  ) WITH CHECK (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND EXISTS (SELECT 1 FROM module_permissions WHERE user_id = auth.uid() AND module = 'equipment' AND can_edit = true)
  );

-- ══════ equipment_inventory ══════
DROP POLICY IF EXISTS "Users with edit permission can manage equipment inventory" ON public.equipment_inventory;
CREATE POLICY "Users with edit permission can manage equipment inventory" ON public.equipment_inventory
  FOR ALL USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND EXISTS (SELECT 1 FROM module_permissions WHERE user_id = auth.uid() AND module = 'inventory' AND can_edit = true)
  ) WITH CHECK (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND EXISTS (SELECT 1 FROM module_permissions WHERE user_id = auth.uid() AND module = 'inventory' AND can_edit = true)
  );

-- ══════ inventory ══════
DROP POLICY IF EXISTS "Users with edit permission can manage inventory" ON public.inventory;
CREATE POLICY "Users with edit permission can manage inventory" ON public.inventory
  FOR ALL USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND EXISTS (SELECT 1 FROM module_permissions WHERE user_id = auth.uid() AND module = 'inventory' AND can_edit = true)
  ) WITH CHECK (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND EXISTS (SELECT 1 FROM module_permissions WHERE user_id = auth.uid() AND module = 'inventory' AND can_edit = true)
  );

-- ══════ menu_items ══════
DROP POLICY IF EXISTS "Users with edit permission can manage menu items" ON public.menu_items;
CREATE POLICY "Users with edit permission can manage menu items" ON public.menu_items
  FOR ALL USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND EXISTS (SELECT 1 FROM module_permissions WHERE user_id = auth.uid() AND module = 'menu-engineering' AND can_edit = true)
  ) WITH CHECK (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND EXISTS (SELECT 1 FROM module_permissions WHERE user_id = auth.uid() AND module = 'menu-engineering' AND can_edit = true)
  );

-- ══════ menus ══════
DROP POLICY IF EXISTS "Users with edit permission can manage menus" ON public.menus;
CREATE POLICY "Users with edit permission can manage menus" ON public.menus
  FOR ALL USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND EXISTS (SELECT 1 FROM module_permissions WHERE user_id = auth.uid() AND module = 'menu-engineering' AND can_edit = true)
  ) WITH CHECK (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND EXISTS (SELECT 1 FROM module_permissions WHERE user_id = auth.uid() AND module = 'menu-engineering' AND can_edit = true)
  );

-- ══════ yield_tests ══════
DROP POLICY IF EXISTS "Users with edit permission can manage yield tests" ON public.yield_tests;
CREATE POLICY "Users with edit permission can manage yield tests" ON public.yield_tests
  FOR ALL USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND EXISTS (SELECT 1 FROM module_permissions WHERE user_id = auth.uid() AND module = 'production' AND can_edit = true)
  ) WITH CHECK (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND EXISTS (SELECT 1 FROM module_permissions WHERE user_id = auth.uid() AND module = 'production' AND can_edit = true)
  );
