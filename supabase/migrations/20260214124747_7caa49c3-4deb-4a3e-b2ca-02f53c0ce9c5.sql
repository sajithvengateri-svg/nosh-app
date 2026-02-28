
-- Fix recipes: head chefs can only manage their own org's recipes
DROP POLICY IF EXISTS "Head chefs can manage recipes" ON public.recipes;
CREATE POLICY "Head chefs can manage own org recipes"
  ON public.recipes FOR ALL
  USING (
    is_head_chef(auth.uid()) 
    AND org_id IN (SELECT get_user_org_ids(auth.uid()))
  )
  WITH CHECK (
    is_head_chef(auth.uid()) 
    AND org_id IN (SELECT get_user_org_ids(auth.uid()))
  );

-- Fix ingredients
DROP POLICY IF EXISTS "Head chefs can manage ingredients" ON public.ingredients;
CREATE POLICY "Head chefs can manage own org ingredients"
  ON public.ingredients FOR ALL
  USING (
    is_head_chef(auth.uid()) 
    AND org_id IN (SELECT get_user_org_ids(auth.uid()))
  )
  WITH CHECK (
    is_head_chef(auth.uid()) 
    AND org_id IN (SELECT get_user_org_ids(auth.uid()))
  );

-- Fix equipment
DROP POLICY IF EXISTS "Head chefs can manage equipment" ON public.equipment;
CREATE POLICY "Head chefs can manage own org equipment"
  ON public.equipment FOR ALL
  USING (
    is_head_chef(auth.uid()) 
    AND org_id IN (SELECT get_user_org_ids(auth.uid()))
  )
  WITH CHECK (
    is_head_chef(auth.uid()) 
    AND org_id IN (SELECT get_user_org_ids(auth.uid()))
  );

-- Fix menus
DROP POLICY IF EXISTS "Head chefs can manage menus" ON public.menus;
CREATE POLICY "Head chefs can manage own org menus"
  ON public.menus FOR ALL
  USING (
    is_head_chef(auth.uid()) 
    AND org_id IN (SELECT get_user_org_ids(auth.uid()))
  )
  WITH CHECK (
    is_head_chef(auth.uid()) 
    AND org_id IN (SELECT get_user_org_ids(auth.uid()))
  );

-- Fix menu_items
DROP POLICY IF EXISTS "Head chefs can manage menu items" ON public.menu_items;
CREATE POLICY "Head chefs can manage own org menu items"
  ON public.menu_items FOR ALL
  USING (
    is_head_chef(auth.uid()) 
    AND org_id IN (SELECT get_user_org_ids(auth.uid()))
  )
  WITH CHECK (
    is_head_chef(auth.uid()) 
    AND org_id IN (SELECT get_user_org_ids(auth.uid()))
  );

-- Fix kitchen_sections
DROP POLICY IF EXISTS "Head chefs can manage kitchen sections" ON public.kitchen_sections;
CREATE POLICY "Head chefs can manage own org kitchen sections"
  ON public.kitchen_sections FOR ALL
  USING (
    is_head_chef(auth.uid()) 
    AND org_id IN (SELECT get_user_org_ids(auth.uid()))
  )
  WITH CHECK (
    is_head_chef(auth.uid()) 
    AND org_id IN (SELECT get_user_org_ids(auth.uid()))
  );

-- Fix kitchen_tasks
DROP POLICY IF EXISTS "Head chefs can manage all tasks" ON public.kitchen_tasks;
CREATE POLICY "Head chefs can manage own org tasks"
  ON public.kitchen_tasks FOR ALL
  USING (
    is_head_chef(auth.uid()) 
    AND org_id IN (SELECT get_user_org_ids(auth.uid()))
  )
  WITH CHECK (
    is_head_chef(auth.uid()) 
    AND org_id IN (SELECT get_user_org_ids(auth.uid()))
  );

-- Fix inventory
DROP POLICY IF EXISTS "Head chefs can manage inventory" ON public.inventory;
CREATE POLICY "Head chefs can manage own org inventory"
  ON public.inventory FOR ALL
  USING (
    is_head_chef(auth.uid()) 
    AND org_id IN (SELECT get_user_org_ids(auth.uid()))
  )
  WITH CHECK (
    is_head_chef(auth.uid()) 
    AND org_id IN (SELECT get_user_org_ids(auth.uid()))
  );

-- Fix prep_lists
DROP POLICY IF EXISTS "Head chefs can manage prep lists" ON public.prep_lists;
CREATE POLICY "Head chefs can manage own org prep lists"
  ON public.prep_lists FOR ALL
  USING (
    is_head_chef(auth.uid()) 
    AND org_id IN (SELECT get_user_org_ids(auth.uid()))
  )
  WITH CHECK (
    is_head_chef(auth.uid()) 
    AND org_id IN (SELECT get_user_org_ids(auth.uid()))
  );

-- Fix calendar_events
DROP POLICY IF EXISTS "Head chefs can manage calendar" ON public.calendar_events;
CREATE POLICY "Head chefs can manage own org calendar"
  ON public.calendar_events FOR ALL
  USING (
    is_head_chef(auth.uid()) 
    AND org_id IN (SELECT get_user_org_ids(auth.uid()))
  )
  WITH CHECK (
    is_head_chef(auth.uid()) 
    AND org_id IN (SELECT get_user_org_ids(auth.uid()))
  );

-- Fix cheatsheets
DROP POLICY IF EXISTS "Head chefs can manage cheatsheets" ON public.cheatsheets;
CREATE POLICY "Head chefs can manage own org cheatsheets"
  ON public.cheatsheets FOR ALL
  USING (
    is_head_chef(auth.uid()) 
    AND org_id IN (SELECT get_user_org_ids(auth.uid()))
  )
  WITH CHECK (
    is_head_chef(auth.uid()) 
    AND org_id IN (SELECT get_user_org_ids(auth.uid()))
  );

-- Fix cleaning_areas
DROP POLICY IF EXISTS "Head chefs can manage cleaning areas" ON public.cleaning_areas;
CREATE POLICY "Head chefs can manage own org cleaning areas"
  ON public.cleaning_areas FOR ALL
  USING (
    is_head_chef(auth.uid()) 
    AND org_id IN (SELECT get_user_org_ids(auth.uid()))
  )
  WITH CHECK (
    is_head_chef(auth.uid()) 
    AND org_id IN (SELECT get_user_org_ids(auth.uid()))
  );

-- Fix food_safety_logs
DROP POLICY IF EXISTS "Head chefs can manage food safety logs" ON public.food_safety_logs;
CREATE POLICY "Head chefs can manage own org food safety logs"
  ON public.food_safety_logs FOR ALL
  USING (
    is_head_chef(auth.uid()) 
    AND org_id IN (SELECT get_user_org_ids(auth.uid()))
  )
  WITH CHECK (
    is_head_chef(auth.uid()) 
    AND org_id IN (SELECT get_user_org_ids(auth.uid()))
  );

-- Fix invoice_scans
DROP POLICY IF EXISTS "Head chefs can manage invoice scans" ON public.invoice_scans;
CREATE POLICY "Head chefs can manage own org invoice scans"
  ON public.invoice_scans FOR ALL
  USING (
    is_head_chef(auth.uid()) 
    AND org_id IN (SELECT get_user_org_ids(auth.uid()))
  )
  WITH CHECK (
    is_head_chef(auth.uid()) 
    AND org_id IN (SELECT get_user_org_ids(auth.uid()))
  );
