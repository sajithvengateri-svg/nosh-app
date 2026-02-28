
-- ============================================================
-- MIGRATION 1: Add org_id to tables missing it + backfill
-- ============================================================

ALTER TABLE public.stocktakes ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.inventory_locations ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.recipe_sections ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.training_materials ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);

-- Backfill stocktakes from stocktake_items -> ingredients
UPDATE public.stocktakes s SET org_id = (
  SELECT i.org_id FROM public.stocktake_items si 
  JOIN public.ingredients i ON i.id = si.ingredient_id 
  WHERE si.stocktake_id = s.id AND i.org_id IS NOT NULL LIMIT 1
) WHERE s.org_id IS NULL;

-- Backfill stock_movements from ingredients
UPDATE public.stock_movements sm SET org_id = (
  SELECT i.org_id FROM public.ingredients i WHERE i.id = sm.ingredient_id AND i.org_id IS NOT NULL LIMIT 1
) WHERE sm.org_id IS NULL AND sm.ingredient_id IS NOT NULL;

-- Backfill inventory_locations from first active org
UPDATE public.inventory_locations il SET org_id = (
  SELECT om.org_id FROM public.org_memberships om WHERE om.is_active = true LIMIT 1
) WHERE il.org_id IS NULL;

-- Backfill recipe_sections from first active org
UPDATE public.recipe_sections rs SET org_id = (
  SELECT om.org_id FROM public.org_memberships om WHERE om.is_active = true LIMIT 1
) WHERE rs.org_id IS NULL;

-- Backfill training_materials from created_by user's org
UPDATE public.training_materials tm SET org_id = (
  SELECT om.org_id FROM public.org_memberships om WHERE om.user_id = tm.created_by AND om.is_active = true LIMIT 1
) WHERE tm.org_id IS NULL AND tm.created_by IS NOT NULL;

-- ============================================================
-- MIGRATION 2: Drop and replace ALL unsafe RLS policies
-- ============================================================

-- ─── PROFILES ───────────────────────────────────────────────
DROP POLICY IF EXISTS "Head chefs can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Head chefs can update any profile" ON profiles;

CREATE POLICY "Users can view org member profiles" ON profiles
  FOR SELECT USING (
    user_id = auth.uid()
    OR user_id IN (
      SELECT om.user_id FROM org_memberships om 
      WHERE om.org_id IN (SELECT get_user_org_ids(auth.uid())) AND om.is_active = true
    )
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Head chefs can update org member profiles" ON profiles
  FOR UPDATE USING (
    is_head_chef(auth.uid()) AND
    user_id IN (
      SELECT om.user_id FROM org_memberships om 
      WHERE om.org_id IN (SELECT get_user_org_ids(auth.uid())) AND om.is_active = true
    )
  );

-- ─── USER_ROLES ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Head chefs can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Head chefs can view all roles" ON user_roles;

CREATE POLICY "Head chefs can view org member roles" ON user_roles
  FOR SELECT USING (
    user_id = auth.uid()
    OR (is_head_chef(auth.uid()) AND user_id IN (
      SELECT om.user_id FROM org_memberships om 
      WHERE om.org_id IN (SELECT get_user_org_ids(auth.uid())) AND om.is_active = true
    ))
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Head chefs can manage org member roles" ON user_roles
  FOR ALL USING (
    is_head_chef(auth.uid()) AND
    user_id IN (
      SELECT om.user_id FROM org_memberships om 
      WHERE om.org_id IN (SELECT get_user_org_ids(auth.uid())) AND om.is_active = true
    )
  );

-- ─── MODULE_PERMISSIONS ─────────────────────────────────────
DROP POLICY IF EXISTS "Head chefs can manage all permissions" ON module_permissions;

CREATE POLICY "Head chefs can manage org member permissions" ON module_permissions
  FOR ALL USING (
    is_head_chef(auth.uid()) AND
    user_id IN (
      SELECT om.user_id FROM org_memberships om 
      WHERE om.org_id IN (SELECT get_user_org_ids(auth.uid())) AND om.is_active = true
    )
  );

-- ─── SUPPLIERS ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Head chefs can manage suppliers" ON suppliers;
DROP POLICY IF EXISTS "Head chefs can view suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users with edit permission can manage suppliers" ON suppliers;

CREATE POLICY "Org members can view own org suppliers" ON suppliers
  FOR SELECT USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Head chefs can manage own org suppliers" ON suppliers
  FOR ALL USING (
    is_head_chef(auth.uid()) AND
    org_id IN (SELECT get_user_org_ids(auth.uid()))
  );

CREATE POLICY "Users with edit perm can manage org suppliers" ON suppliers
  FOR ALL USING (
    org_id IN (SELECT get_user_org_ids(auth.uid())) AND
    EXISTS (SELECT 1 FROM module_permissions WHERE user_id = auth.uid() AND module = 'food-safety' AND can_edit = true)
  );

-- ─── TEAM_INVITES ───────────────────────────────────────────
DROP POLICY IF EXISTS "Head chefs can manage invites" ON team_invites;
DROP POLICY IF EXISTS "Head chefs can view invites" ON team_invites;
DROP POLICY IF EXISTS "Creators can view their invites" ON team_invites;

CREATE POLICY "Org head chefs can manage invites" ON team_invites
  FOR ALL USING (
    is_org_head_chef(auth.uid(), org_id)
  );

CREATE POLICY "Org members can view invites" ON team_invites
  FOR SELECT USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    OR invited_by = auth.uid()
    OR has_role(auth.uid(), 'admin')
  );

-- ─── ROSTER_SHIFTS ──────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view roster" ON roster_shifts;
DROP POLICY IF EXISTS "Head chefs can manage roster" ON roster_shifts;
DROP POLICY IF EXISTS "Users with edit permission can manage roster" ON roster_shifts;

CREATE POLICY "Org members can view own org roster" ON roster_shifts
  FOR SELECT USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Head chefs can manage own org roster" ON roster_shifts
  FOR ALL USING (
    is_head_chef(auth.uid()) AND
    org_id IN (SELECT get_user_org_ids(auth.uid()))
  );

CREATE POLICY "Users with edit perm can manage org roster" ON roster_shifts
  FOR ALL USING (
    org_id IN (SELECT get_user_org_ids(auth.uid())) AND
    EXISTS (SELECT 1 FROM module_permissions WHERE user_id = auth.uid() AND module = 'roster' AND can_edit = true)
  );

-- ─── NIGHTLY_STOCK_COUNTS ───────────────────────────────────
DROP POLICY IF EXISTS "Assigned users can update counts" ON nightly_stock_counts;

CREATE POLICY "Assigned users can update own org counts" ON nightly_stock_counts
  FOR UPDATE USING (
    org_id IN (SELECT get_user_org_ids(auth.uid())) AND
    (auth.uid() = recorded_by OR is_head_chef(auth.uid()))
  );

-- ─── PREP_LISTS ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can tick tasks" ON prep_lists;

CREATE POLICY "Org members can update own org prep lists" ON prep_lists
  FOR UPDATE USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
  );

-- ─── RECIPE_CCPS ────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view recipe CCPs" ON recipe_ccps;
DROP POLICY IF EXISTS "Head chefs can manage recipe CCPs" ON recipe_ccps;
DROP POLICY IF EXISTS "Users with edit permission can manage recipe CCPs" ON recipe_ccps;

CREATE POLICY "Org members can view recipe CCPs" ON recipe_ccps
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_ccps.recipe_id 
            AND r.org_id IN (SELECT get_user_org_ids(auth.uid())))
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Head chefs can manage own org recipe CCPs" ON recipe_ccps
  FOR ALL USING (
    is_head_chef(auth.uid()) AND
    EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_ccps.recipe_id 
            AND r.org_id IN (SELECT get_user_org_ids(auth.uid())))
  );

CREATE POLICY "Users with edit perm can manage org recipe CCPs" ON recipe_ccps
  FOR ALL USING (
    EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_ccps.recipe_id 
            AND r.org_id IN (SELECT get_user_org_ids(auth.uid()))) AND
    EXISTS (SELECT 1 FROM module_permissions WHERE user_id = auth.uid() AND module = 'recipes' AND can_edit = true)
  );

-- ─── RECIPE_INGREDIENTS ─────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view recipe ingredients" ON recipe_ingredients;
DROP POLICY IF EXISTS "Head chefs can manage recipe ingredients" ON recipe_ingredients;
DROP POLICY IF EXISTS "Users with edit permission can manage recipe ingredients" ON recipe_ingredients;

CREATE POLICY "Org members can view recipe ingredients" ON recipe_ingredients
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_ingredients.recipe_id 
            AND r.org_id IN (SELECT get_user_org_ids(auth.uid())))
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Head chefs can manage own org recipe ingredients" ON recipe_ingredients
  FOR ALL USING (
    is_head_chef(auth.uid()) AND
    EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_ingredients.recipe_id 
            AND r.org_id IN (SELECT get_user_org_ids(auth.uid())))
  );

CREATE POLICY "Users with edit perm can manage org recipe ingredients" ON recipe_ingredients
  FOR ALL USING (
    EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_ingredients.recipe_id 
            AND r.org_id IN (SELECT get_user_org_ids(auth.uid()))) AND
    EXISTS (SELECT 1 FROM module_permissions WHERE user_id = auth.uid() AND module = 'recipes' AND can_edit = true)
  );

-- ─── RECIPE_SECTIONS ────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view recipe sections" ON recipe_sections;
DROP POLICY IF EXISTS "Head chefs can manage recipe sections" ON recipe_sections;
DROP POLICY IF EXISTS "Users with edit permission can manage recipe sections" ON recipe_sections;

CREATE POLICY "Org members can view recipe sections" ON recipe_sections
  FOR SELECT USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Head chefs can manage own org recipe sections" ON recipe_sections
  FOR ALL USING (
    is_head_chef(auth.uid()) AND
    org_id IN (SELECT get_user_org_ids(auth.uid()))
  );

CREATE POLICY "Users with edit perm can manage org recipe sections" ON recipe_sections
  FOR ALL USING (
    org_id IN (SELECT get_user_org_ids(auth.uid())) AND
    EXISTS (SELECT 1 FROM module_permissions WHERE user_id = auth.uid() AND module = 'recipes' AND can_edit = true)
  );

-- ─── INGREDIENT_PRICE_HISTORY ───────────────────────────────
DROP POLICY IF EXISTS "Anyone can view price history" ON ingredient_price_history;
DROP POLICY IF EXISTS "Authenticated users can insert price history" ON ingredient_price_history;

CREATE POLICY "Org members can view price history" ON ingredient_price_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM ingredients i WHERE i.id = ingredient_price_history.ingredient_id 
            AND i.org_id IN (SELECT get_user_org_ids(auth.uid())))
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Org members can insert price history" ON ingredient_price_history
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM ingredients i WHERE i.id = ingredient_price_history.ingredient_id 
            AND i.org_id IN (SELECT get_user_org_ids(auth.uid())))
  );

-- ─── STOCKTAKES ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view stocktakes" ON stocktakes;
DROP POLICY IF EXISTS "Head chefs can manage stocktakes" ON stocktakes;
DROP POLICY IF EXISTS "Users with inventory edit can manage stocktakes" ON stocktakes;

CREATE POLICY "Org members can view own org stocktakes" ON stocktakes
  FOR SELECT USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Head chefs can manage own org stocktakes" ON stocktakes
  FOR ALL USING (
    is_head_chef(auth.uid()) AND
    org_id IN (SELECT get_user_org_ids(auth.uid()))
  );

CREATE POLICY "Users with edit perm can manage org stocktakes" ON stocktakes
  FOR ALL USING (
    org_id IN (SELECT get_user_org_ids(auth.uid())) AND
    EXISTS (SELECT 1 FROM module_permissions WHERE user_id = auth.uid() AND module = 'inventory' AND can_edit = true)
  );

-- ─── STOCKTAKE_ITEMS ────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view stocktake items" ON stocktake_items;
DROP POLICY IF EXISTS "Head chefs can manage stocktake items" ON stocktake_items;
DROP POLICY IF EXISTS "Users with inventory edit can manage stocktake items" ON stocktake_items;

CREATE POLICY "Org members can view own org stocktake items" ON stocktake_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM stocktakes s WHERE s.id = stocktake_items.stocktake_id 
            AND s.org_id IN (SELECT get_user_org_ids(auth.uid())))
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Head chefs can manage own org stocktake items" ON stocktake_items
  FOR ALL USING (
    is_head_chef(auth.uid()) AND
    EXISTS (SELECT 1 FROM stocktakes s WHERE s.id = stocktake_items.stocktake_id 
            AND s.org_id IN (SELECT get_user_org_ids(auth.uid())))
  );

CREATE POLICY "Users with edit perm can manage org stocktake items" ON stocktake_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM stocktakes s WHERE s.id = stocktake_items.stocktake_id 
            AND s.org_id IN (SELECT get_user_org_ids(auth.uid()))) AND
    EXISTS (SELECT 1 FROM module_permissions WHERE user_id = auth.uid() AND module = 'inventory' AND can_edit = true)
  );

-- ─── STOCK_MOVEMENTS ────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view stock movements" ON stock_movements;
DROP POLICY IF EXISTS "Head chefs can manage stock movements" ON stock_movements;
DROP POLICY IF EXISTS "Users with inventory edit can manage stock movements" ON stock_movements;

CREATE POLICY "Org members can view own org stock movements" ON stock_movements
  FOR SELECT USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Head chefs can manage own org stock movements" ON stock_movements
  FOR ALL USING (
    is_head_chef(auth.uid()) AND
    org_id IN (SELECT get_user_org_ids(auth.uid()))
  );

CREATE POLICY "Users with edit perm can manage org stock movements" ON stock_movements
  FOR ALL USING (
    org_id IN (SELECT get_user_org_ids(auth.uid())) AND
    EXISTS (SELECT 1 FROM module_permissions WHERE user_id = auth.uid() AND module = 'inventory' AND can_edit = true)
  );

-- ─── INVENTORY_LOCATIONS ────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view inventory locations" ON inventory_locations;
DROP POLICY IF EXISTS "Head chefs can manage inventory locations" ON inventory_locations;
DROP POLICY IF EXISTS "Users with edit permission can manage inventory locations" ON inventory_locations;

CREATE POLICY "Org members can view own org inventory locations" ON inventory_locations
  FOR SELECT USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Head chefs can manage own org inventory locations" ON inventory_locations
  FOR ALL USING (
    is_head_chef(auth.uid()) AND
    org_id IN (SELECT get_user_org_ids(auth.uid()))
  );

CREATE POLICY "Users with edit perm can manage org inventory locations" ON inventory_locations
  FOR ALL USING (
    org_id IN (SELECT get_user_org_ids(auth.uid())) AND
    EXISTS (SELECT 1 FROM module_permissions WHERE user_id = auth.uid() AND module = 'inventory' AND can_edit = true)
  );

-- ─── TRAINING_MATERIALS ─────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view training materials" ON training_materials;
DROP POLICY IF EXISTS "Head chefs can manage training materials" ON training_materials;
DROP POLICY IF EXISTS "Users with edit permission can manage training" ON training_materials;

CREATE POLICY "Org members can view own org training materials" ON training_materials
  FOR SELECT USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Head chefs can manage own org training materials" ON training_materials
  FOR ALL USING (
    is_head_chef(auth.uid()) AND
    org_id IN (SELECT get_user_org_ids(auth.uid()))
  );

CREATE POLICY "Users with edit perm can manage org training materials" ON training_materials
  FOR ALL USING (
    org_id IN (SELECT get_user_org_ids(auth.uid())) AND
    EXISTS (SELECT 1 FROM module_permissions WHERE user_id = auth.uid() AND module = 'training' AND can_edit = true)
  );

-- ─── TRAINING_RECORDS ───────────────────────────────────────
DROP POLICY IF EXISTS "Head chefs can manage all training records" ON training_records;
DROP POLICY IF EXISTS "Head chefs can view all training records" ON training_records;

CREATE POLICY "Head chefs can view org training records" ON training_records
  FOR SELECT USING (
    user_id = auth.uid()
    OR (is_head_chef(auth.uid()) AND user_id IN (
      SELECT om.user_id FROM org_memberships om 
      WHERE om.org_id IN (SELECT get_user_org_ids(auth.uid())) AND om.is_active = true
    ))
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Head chefs can manage org training records" ON training_records
  FOR ALL USING (
    is_head_chef(auth.uid()) AND
    user_id IN (
      SELECT om.user_id FROM org_memberships om 
      WHERE om.org_id IN (SELECT get_user_org_ids(auth.uid())) AND om.is_active = true
    )
  );

-- ─── PREP_LIST_COMMENTS ─────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view prep list comments" ON prep_list_comments;
DROP POLICY IF EXISTS "Authenticated users can add comments" ON prep_list_comments;
DROP POLICY IF EXISTS "Head chefs can manage comments" ON prep_list_comments;

CREATE POLICY "Org members can view prep list comments" ON prep_list_comments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM prep_lists pl WHERE pl.id = prep_list_comments.prep_list_id 
            AND pl.org_id IN (SELECT get_user_org_ids(auth.uid())))
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Org members can add prep list comments" ON prep_list_comments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM prep_lists pl WHERE pl.id = prep_list_comments.prep_list_id 
            AND pl.org_id IN (SELECT get_user_org_ids(auth.uid())))
  );

CREATE POLICY "Head chefs can manage org prep list comments" ON prep_list_comments
  FOR ALL USING (
    is_head_chef(auth.uid()) AND
    EXISTS (SELECT 1 FROM prep_lists pl WHERE pl.id = prep_list_comments.prep_list_id 
            AND pl.org_id IN (SELECT get_user_org_ids(auth.uid())))
  );

-- ─── TASK_COMMENTS ──────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view task comments" ON task_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON task_comments;
DROP POLICY IF EXISTS "Head chefs can manage all comments" ON task_comments;

CREATE POLICY "Org members can view task comments" ON task_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM kitchen_tasks kt 
      WHERE kt.id = task_comments.task_id
      AND kt.org_id IN (SELECT get_user_org_ids(auth.uid()))
    )
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Org members can add task comments" ON task_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM kitchen_tasks kt 
      WHERE kt.id = task_comments.task_id
      AND kt.org_id IN (SELECT get_user_org_ids(auth.uid()))
    )
  );

CREATE POLICY "Head chefs can manage org task comments" ON task_comments
  FOR ALL USING (
    is_head_chef(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM kitchen_tasks kt 
      WHERE kt.id = task_comments.task_id
      AND kt.org_id IN (SELECT get_user_org_ids(auth.uid()))
    )
  );
