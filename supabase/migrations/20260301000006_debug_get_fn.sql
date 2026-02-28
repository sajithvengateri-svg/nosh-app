-- Get source of ds_handle_new_user function
CREATE OR REPLACE FUNCTION public.debug_get_ds_function()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  src text;
BEGIN
  SELECT pg_get_functiondef(oid) INTO src
  FROM pg_proc
  WHERE proname = 'ds_handle_new_user'
  LIMIT 1;
  RETURN COALESCE(src, 'FUNCTION NOT FOUND');
END;
$$;

-- Also: drop the rogue trigger to fix signup immediately
DROP TRIGGER IF EXISTS ds_on_auth_user_created ON auth.users;
