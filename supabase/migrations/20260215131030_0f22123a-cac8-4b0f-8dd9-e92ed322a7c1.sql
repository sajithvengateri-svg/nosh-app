
-- 1. Add org_id to section_assignments
ALTER TABLE section_assignments ADD COLUMN org_id uuid;

-- Backfill from parent kitchen_sections
UPDATE section_assignments sa
SET org_id = ks.org_id
FROM kitchen_sections ks
WHERE sa.section_id = ks.id;

-- Delete orphaned assignments (no matching section)
DELETE FROM section_assignments WHERE org_id IS NULL;

-- Make NOT NULL after backfill
ALTER TABLE section_assignments ALTER COLUMN org_id SET NOT NULL;

-- 2. Drop unsafe RLS policies on section_assignments
DROP POLICY IF EXISTS "Anyone can view section assignments" ON section_assignments;
DROP POLICY IF EXISTS "Head chefs can manage section assignments" ON section_assignments;

-- 3. Create org-scoped RLS policies
CREATE POLICY "Org members can view section assignments"
  ON section_assignments FOR SELECT
  USING (
    org_id IN (SELECT get_user_org_ids(auth.uid()))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Head chefs can manage section assignments"
  ON section_assignments FOR ALL
  USING (
    is_head_chef(auth.uid())
    AND org_id IN (SELECT get_user_org_ids(auth.uid()))
  )
  WITH CHECK (
    is_head_chef(auth.uid())
    AND org_id IN (SELECT get_user_org_ids(auth.uid()))
  );

-- 4. Clean up NULL org_ids in kitchen_sections and make NOT NULL
DELETE FROM kitchen_sections WHERE org_id IS NULL;
ALTER TABLE kitchen_sections ALTER COLUMN org_id SET NOT NULL;
