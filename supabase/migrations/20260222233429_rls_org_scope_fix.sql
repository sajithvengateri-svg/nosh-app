-- ============================================================
-- RLS Security Hardening: Org-Scope Core Tables
--
-- Fixes: recipes, ingredients, inventory, prep_lists
-- Problem: SELECT policies use USING (true) allowing any
--          authenticated user to see ALL orgs' data.
-- Fix: Scope all policies to user's org memberships.
-- Also: Replace global is_head_chef() with org-scoped
--        is_org_head_chef() in management policies.
-- ============================================================

-- ============================================================
-- 1. RECIPES
-- ============================================================

-- Drop old unsafe policies
DROP POLICY IF EXISTS "Anyone can view recipes" ON public.recipes;
DROP POLICY IF EXISTS "Head chefs can manage recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users with edit permission can manage recipes" ON public.recipes;

-- New org-scoped SELECT policy
CREATE POLICY "Org members can view own org recipes"
  ON public.recipes
  FOR SELECT
  USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    OR has_role(auth.uid(), 'admin')
  );

-- New org-scoped management for head chefs / owners
CREATE POLICY "Org head chefs can manage own org recipes"
  ON public.recipes
  FOR ALL
  USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND is_org_head_chef(auth.uid(), org_id)
  );

-- New org-scoped management for users with edit permission
CREATE POLICY "Users with edit perm can manage own org recipes"
  ON public.recipes
  FOR ALL
  USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND EXISTS (
      SELECT 1 FROM module_permissions
      WHERE user_id = auth.uid()
        AND module = 'recipes'
        AND can_edit = true
    )
  );

-- ============================================================
-- 2. INGREDIENTS
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view ingredients" ON public.ingredients;
DROP POLICY IF EXISTS "Head chefs can manage ingredients" ON public.ingredients;
DROP POLICY IF EXISTS "Users with edit permission can manage ingredients" ON public.ingredients;

CREATE POLICY "Org members can view own org ingredients"
  ON public.ingredients
  FOR SELECT
  USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Org head chefs can manage own org ingredients"
  ON public.ingredients
  FOR ALL
  USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND is_org_head_chef(auth.uid(), org_id)
  );

CREATE POLICY "Users with edit perm can manage own org ingredients"
  ON public.ingredients
  FOR ALL
  USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND EXISTS (
      SELECT 1 FROM module_permissions
      WHERE user_id = auth.uid()
        AND module = 'ingredients'
        AND can_edit = true
    )
  );

-- ============================================================
-- 3. INVENTORY
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view inventory" ON public.inventory;
DROP POLICY IF EXISTS "Head chefs can manage inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users with edit permission can manage inventory" ON public.inventory;

CREATE POLICY "Org members can view own org inventory"
  ON public.inventory
  FOR SELECT
  USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Org head chefs can manage own org inventory"
  ON public.inventory
  FOR ALL
  USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND is_org_head_chef(auth.uid(), org_id)
  );

CREATE POLICY "Users with edit perm can manage own org inventory"
  ON public.inventory
  FOR ALL
  USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND EXISTS (
      SELECT 1 FROM module_permissions
      WHERE user_id = auth.uid()
        AND module = 'inventory'
        AND can_edit = true
    )
  );

-- ============================================================
-- 4. PREP_LISTS
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view prep lists" ON public.prep_lists;
DROP POLICY IF EXISTS "Head chefs can manage prep lists" ON public.prep_lists;
DROP POLICY IF EXISTS "Org members can update own org prep lists" ON public.prep_lists;

CREATE POLICY "Org members can view own org prep lists"
  ON public.prep_lists
  FOR SELECT
  USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Org head chefs can manage own org prep lists"
  ON public.prep_lists
  FOR ALL
  USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND is_org_head_chef(auth.uid(), org_id)
  );

-- Allow all org members to insert/update prep lists (they need to create and check off tasks)
CREATE POLICY "Org members can insert own org prep lists"
  ON public.prep_lists
  FOR INSERT
  WITH CHECK (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
  );

CREATE POLICY "Org members can update own org prep lists"
  ON public.prep_lists
  FOR UPDATE
  USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
  );
