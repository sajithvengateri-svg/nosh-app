-- Temp: SQL helper for debugging auth trigger issues
CREATE OR REPLACE FUNCTION public.debug_list_auth_triggers()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(row_to_json(t))
  INTO result
  FROM (
    SELECT tgname, tgfoid::regproc as function_name, tgenabled as enabled
    FROM pg_trigger
    WHERE tgrelid = 'auth.users'::regclass
  ) t;
  RETURN result;
END;
$$;

-- Also try to check what columns auth.users has
CREATE OR REPLACE FUNCTION public.debug_auth_users_columns()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(row_to_json(t))
  INTO result
  FROM (
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'users'
    ORDER BY ordinal_position
  ) t;
  RETURN result;
END;
$$;

-- Check auth schema migrations
CREATE OR REPLACE FUNCTION public.debug_auth_schema_versions()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(row_to_json(t))
  INTO result
  FROM (
    SELECT version FROM auth.schema_migrations ORDER BY version DESC LIMIT 10
  ) t;
  RETURN result;
END;
$$;
