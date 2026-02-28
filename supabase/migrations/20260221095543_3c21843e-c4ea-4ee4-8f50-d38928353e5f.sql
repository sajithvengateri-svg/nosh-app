
-- Create a single RPC that creates a menu AND activates it (archives any current active menu)
CREATE OR REPLACE FUNCTION public.create_and_activate_menu(
  p_name TEXT,
  p_org_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller_org UUID;
  new_menu_id UUID;
BEGIN
  -- Verify caller belongs to this org
  SELECT org_id INTO caller_org
  FROM org_memberships
  WHERE user_id = auth.uid() AND org_id = p_org_id AND is_active = true
  LIMIT 1;

  IF caller_org IS NULL THEN
    RAISE EXCEPTION 'Not authorized for this organization';
  END IF;

  -- Archive any currently active menu in this org
  UPDATE menus
  SET status = 'archived', effective_to = now()
  WHERE org_id = p_org_id AND status = 'active';

  -- Create new menu as active
  INSERT INTO menus (name, org_id, created_by, status, effective_from)
  VALUES (p_name, p_org_id, auth.uid(), 'active', now())
  RETURNING id INTO new_menu_id;

  RETURN new_menu_id;
END;
$$;
