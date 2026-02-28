
-- 1. Fix module_permissions ALL policies that bypass org checks
-- These allow any user with edit permission to manage data across ALL orgs

-- food_safety_logs
DROP POLICY IF EXISTS "Users with edit permission can manage food safety logs" ON food_safety_logs;
CREATE POLICY "Users with edit permission can manage food safety logs"
  ON food_safety_logs FOR ALL
  USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND EXISTS (
      SELECT 1 FROM module_permissions
      WHERE module_permissions.user_id = auth.uid()
        AND module_permissions.module = 'food-safety'
        AND module_permissions.can_edit = true
    )
  )
  WITH CHECK (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND EXISTS (
      SELECT 1 FROM module_permissions
      WHERE module_permissions.user_id = auth.uid()
        AND module_permissions.module = 'food-safety'
        AND module_permissions.can_edit = true
    )
  );

-- kitchen_sections
DROP POLICY IF EXISTS "Users with edit permission can manage kitchen sections" ON kitchen_sections;
CREATE POLICY "Users with edit permission can manage kitchen sections"
  ON kitchen_sections FOR ALL
  USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND EXISTS (
      SELECT 1 FROM module_permissions
      WHERE module_permissions.user_id = auth.uid()
        AND module_permissions.module = 'calendar'
        AND module_permissions.can_edit = true
    )
  )
  WITH CHECK (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND EXISTS (
      SELECT 1 FROM module_permissions
      WHERE module_permissions.user_id = auth.uid()
        AND module_permissions.module = 'calendar'
        AND module_permissions.can_edit = true
    )
  );

-- cleaning_areas
DROP POLICY IF EXISTS "Users with edit permission can manage cleaning areas" ON cleaning_areas;
CREATE POLICY "Users with edit permission can manage cleaning areas"
  ON cleaning_areas FOR ALL
  USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND EXISTS (
      SELECT 1 FROM module_permissions
      WHERE module_permissions.user_id = auth.uid()
        AND module_permissions.module = 'food-safety'
        AND module_permissions.can_edit = true
    )
  )
  WITH CHECK (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND EXISTS (
      SELECT 1 FROM module_permissions
      WHERE module_permissions.user_id = auth.uid()
        AND module_permissions.module = 'food-safety'
        AND module_permissions.can_edit = true
    )
  );

-- prep_lists
DROP POLICY IF EXISTS "Users with edit permission can manage prep lists" ON prep_lists;
CREATE POLICY "Users with edit permission can manage prep lists"
  ON prep_lists FOR ALL
  USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND EXISTS (
      SELECT 1 FROM module_permissions
      WHERE module_permissions.user_id = auth.uid()
        AND module_permissions.module = 'prep'
        AND module_permissions.can_edit = true
    )
  )
  WITH CHECK (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    AND EXISTS (
      SELECT 1 FROM module_permissions
      WHERE module_permissions.user_id = auth.uid()
        AND module_permissions.module = 'prep'
        AND module_permissions.can_edit = true
    )
  );

-- 2. Fix prep_list_templates: add org_id, backfill, fix RLS
ALTER TABLE prep_list_templates ADD COLUMN org_id uuid;

-- Backfill from kitchen_sections where possible
UPDATE prep_list_templates plt
SET org_id = ks.org_id
FROM kitchen_sections ks
WHERE plt.section_id = ks.id;

-- For templates without a section, try to get org from created_by user's membership
UPDATE prep_list_templates plt
SET org_id = (
  SELECT om.org_id FROM org_memberships om
  WHERE om.user_id = plt.created_by AND om.is_active = true
  LIMIT 1
)
WHERE plt.org_id IS NULL AND plt.created_by IS NOT NULL;

-- Delete orphaned templates that can't be assigned to an org
DELETE FROM prep_list_templates WHERE org_id IS NULL;

ALTER TABLE prep_list_templates ALTER COLUMN org_id SET NOT NULL;

-- Drop unsafe policies
DROP POLICY IF EXISTS "Anyone can view templates" ON prep_list_templates;
DROP POLICY IF EXISTS "Head chefs can manage templates" ON prep_list_templates;

-- Create org-scoped policies
CREATE POLICY "Org members can view prep list templates"
  ON prep_list_templates FOR SELECT
  USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Head chefs can manage prep list templates"
  ON prep_list_templates FOR ALL
  USING (
    is_head_chef(auth.uid())
    AND org_id IN (SELECT get_user_org_ids(auth.uid()))
  )
  WITH CHECK (
    is_head_chef(auth.uid())
    AND org_id IN (SELECT get_user_org_ids(auth.uid()))
  );

-- Keep section leader policy but it's already indirectly org-scoped via section_assignments

-- 3. Add org_id to activity_log for future org scoping
ALTER TABLE activity_log ADD COLUMN org_id uuid;

-- Backfill from kitchen_sections where section_id exists
UPDATE activity_log al
SET org_id = ks.org_id
FROM kitchen_sections ks
WHERE al.section_id = ks.id;

-- For remaining, try user's org membership
UPDATE activity_log al
SET org_id = (
  SELECT om.org_id FROM org_memberships om
  WHERE om.user_id = al.user_id AND om.is_active = true
  LIMIT 1
)
WHERE al.org_id IS NULL;

-- Drop old policies and replace with org-scoped
DROP POLICY IF EXISTS "Authenticated users can view activity log" ON activity_log;
DROP POLICY IF EXISTS "Authenticated users can create activity entries" ON activity_log;
DROP POLICY IF EXISTS "Head chefs can manage activity log" ON activity_log;

CREATE POLICY "Org members can view activity log"
  ON activity_log FOR SELECT
  USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    OR has_role(auth.uid(), 'admin'::app_role)
    OR org_id IS NULL
  );

CREATE POLICY "Authenticated users can create activity entries"
  ON activity_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Head chefs can manage activity log"
  ON activity_log FOR ALL
  USING (
    is_head_chef(auth.uid())
    AND (org_id IN (SELECT get_user_org_ids(auth.uid())) OR org_id IS NULL)
  )
  WITH CHECK (
    is_head_chef(auth.uid())
    AND (org_id IN (SELECT get_user_org_ids(auth.uid())) OR org_id IS NULL)
  );
