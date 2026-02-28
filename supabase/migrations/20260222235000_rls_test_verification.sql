-- ============================================================
-- RLS Verification Test Script
-- Run this AFTER applying the rls_org_scope_fix migration
-- to verify cross-org data isolation works correctly.
--
-- NOTE: This is a verification script, not a migration.
-- Run it manually in the Supabase SQL Editor to test.
-- ============================================================

-- 1. Verify the helper function exists and works
DO $$
BEGIN
  -- Check get_user_org_ids exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_user_org_ids'
  ) THEN
    RAISE EXCEPTION 'FAIL: get_user_org_ids() function not found';
  END IF;
  RAISE NOTICE 'PASS: get_user_org_ids() function exists';

  -- Check is_org_head_chef exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'is_org_head_chef'
  ) THEN
    RAISE EXCEPTION 'FAIL: is_org_head_chef() function not found';
  END IF;
  RAISE NOTICE 'PASS: is_org_head_chef() function exists';
END $$;

-- 2. Verify new policies exist on all 4 critical tables
DO $$
DECLARE
  tbl TEXT;
  policy_count INT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['recipes', 'ingredients', 'inventory', 'prep_lists']
  LOOP
    SELECT count(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = tbl;

    IF policy_count = 0 THEN
      RAISE EXCEPTION 'FAIL: No policies found on table %', tbl;
    END IF;

    RAISE NOTICE 'PASS: % has % policies', tbl, policy_count;
  END LOOP;
END $$;

-- 3. Verify old unsafe policies are gone
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname LIKE 'Anyone can view%'
      AND schemaname = 'public'
      AND tablename IN ('recipes', 'ingredients', 'inventory', 'prep_lists')
  ) THEN
    RAISE EXCEPTION 'FAIL: Old "Anyone can view" policies still exist';
  END IF;
  RAISE NOTICE 'PASS: Old unsafe "Anyone can view" policies removed';
END $$;

-- 4. Verify org-scoped SELECT policies exist
DO $$
DECLARE
  tbl TEXT;
  policy_exists BOOLEAN;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['recipes', 'ingredients', 'inventory', 'prep_lists']
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = tbl
        AND policyname LIKE 'Org members can view%'
    ) INTO policy_exists;

    IF NOT policy_exists THEN
      RAISE EXCEPTION 'FAIL: Org-scoped SELECT policy missing on %', tbl;
    END IF;

    RAISE NOTICE 'PASS: Org-scoped SELECT policy exists on %', tbl;
  END LOOP;
END $$;

-- 5. List all current policies for audit
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('recipes', 'ingredients', 'inventory', 'prep_lists')
ORDER BY tablename, policyname;
