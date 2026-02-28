
-- Create a helper function that deletes all org-scoped data for given org IDs
-- Uses dynamic SQL to handle all tables with org_id column
CREATE OR REPLACE FUNCTION public.admin_nuke_orgs(p_org_ids uuid[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  tbl text;
  total_deleted integer := 0;
  row_count integer;
BEGIN
  -- Loop through all tables with org_id column, skip organizations itself
  FOR tbl IN
    SELECT c.table_name
    FROM information_schema.columns c
    WHERE c.column_name = 'org_id'
      AND c.table_schema = 'public'
      AND c.table_name != 'organizations'
    ORDER BY c.table_name
  LOOP
    EXECUTE format('DELETE FROM public.%I WHERE org_id = ANY($1)', tbl) USING p_org_ids;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
  END LOOP;

  -- Finally delete the orgs themselves
  DELETE FROM public.organizations WHERE id = ANY(p_org_ids);
  GET DIAGNOSTICS row_count = ROW_COUNT;
  total_deleted := total_deleted + row_count;

  RETURN total_deleted;
END;
$$;
