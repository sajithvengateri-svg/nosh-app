
-- ============================================
-- ORG-SCOPED DATA ISOLATION MIGRATION
-- Fix: Replace "Anyone can view" (true) with org-scoped SELECT policies
-- ============================================

-- RECIPES
DROP POLICY IF EXISTS "Anyone can view recipes" ON public.recipes;
CREATE POLICY "Users can view own org recipes"
  ON public.recipes FOR SELECT
  USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    OR is_public = true
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- INGREDIENTS
DROP POLICY IF EXISTS "Anyone can view ingredients" ON public.ingredients;
CREATE POLICY "Users can view own org ingredients"
  ON public.ingredients FOR SELECT
  USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- INVENTORY
DROP POLICY IF EXISTS "Anyone can view inventory" ON public.inventory;
CREATE POLICY "Users can view own org inventory"
  ON public.inventory FOR SELECT
  USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- PREP LISTS
DROP POLICY IF EXISTS "Anyone can view prep lists" ON public.prep_lists;
CREATE POLICY "Users can view own org prep lists"
  ON public.prep_lists FOR SELECT
  USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- KITCHEN TASKS
DROP POLICY IF EXISTS "Anyone can view kitchen tasks" ON public.kitchen_tasks;
CREATE POLICY "Users can view own org kitchen tasks"
  ON public.kitchen_tasks FOR SELECT
  USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- KITCHEN SECTIONS
DROP POLICY IF EXISTS "Anyone can view kitchen sections" ON public.kitchen_sections;
CREATE POLICY "Users can view own org kitchen sections"
  ON public.kitchen_sections FOR SELECT
  USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- EQUIPMENT
DROP POLICY IF EXISTS "Anyone can view equipment" ON public.equipment;
CREATE POLICY "Users can view own org equipment"
  ON public.equipment FOR SELECT
  USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- CALENDAR EVENTS
DROP POLICY IF EXISTS "Anyone can view calendar" ON public.calendar_events;
CREATE POLICY "Users can view own org calendar"
  ON public.calendar_events FOR SELECT
  USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- CHEATSHEETS
DROP POLICY IF EXISTS "Anyone can view cheatsheets" ON public.cheatsheets;
CREATE POLICY "Users can view own org cheatsheets"
  ON public.cheatsheets FOR SELECT
  USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- CLEANING AREAS
DROP POLICY IF EXISTS "Anyone can view cleaning areas" ON public.cleaning_areas;
CREATE POLICY "Users can view own org cleaning areas"
  ON public.cleaning_areas FOR SELECT
  USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- FOOD SAFETY LOGS
DROP POLICY IF EXISTS "Anyone can view food safety logs" ON public.food_safety_logs;
CREATE POLICY "Users can view own org food safety logs"
  ON public.food_safety_logs FOR SELECT
  USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- INVOICE SCANS
DROP POLICY IF EXISTS "Anyone can view invoice scans" ON public.invoice_scans;
CREATE POLICY "Users can view own org invoice scans"
  ON public.invoice_scans FOR SELECT
  USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- MENUS
DROP POLICY IF EXISTS "Anyone can view menus" ON public.menus;
CREATE POLICY "Users can view own org menus"
  ON public.menus FOR SELECT
  USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- MENU ITEMS
DROP POLICY IF EXISTS "Anyone can view menu items" ON public.menu_items;
CREATE POLICY "Users can view own org menu items"
  ON public.menu_items FOR SELECT
  USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- ACTIVITY LOG - scope to authenticated users only (no org_id, but restrict to authed)
DROP POLICY IF EXISTS "Anyone can view activity log" ON public.activity_log;
CREATE POLICY "Authenticated users can view activity log"
  ON public.activity_log FOR SELECT
  USING (auth.uid() IS NOT NULL);
