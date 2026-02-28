
-- archive_menu: bypasses RLS, verifies org membership, archives the menu
CREATE OR REPLACE FUNCTION public.archive_menu(p_menu_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
  caller_org UUID;
  menu_org UUID;
BEGIN
  SELECT org_id INTO caller_org
  FROM org_memberships
  WHERE user_id = auth.uid() AND is_active = true
  LIMIT 1;

  SELECT org_id INTO menu_org FROM menus WHERE id = p_menu_id;

  IF caller_org IS NULL OR menu_org IS NULL OR caller_org != menu_org THEN
    RAISE EXCEPTION 'Not authorized to archive this menu';
  END IF;

  UPDATE menus
  SET status = 'archived', effective_to = now()
  WHERE id = p_menu_id;

  SELECT row_to_json(m) INTO result FROM menus m WHERE m.id = p_menu_id;
  RETURN result;
END;
$$;

-- unarchive_menu: bypasses RLS, verifies org membership, sets back to draft
CREATE OR REPLACE FUNCTION public.unarchive_menu(p_menu_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
  caller_org UUID;
  menu_org UUID;
BEGIN
  SELECT org_id INTO caller_org
  FROM org_memberships
  WHERE user_id = auth.uid() AND is_active = true
  LIMIT 1;

  SELECT org_id INTO menu_org FROM menus WHERE id = p_menu_id;

  IF caller_org IS NULL OR menu_org IS NULL OR caller_org != menu_org THEN
    RAISE EXCEPTION 'Not authorized to unarchive this menu';
  END IF;

  UPDATE menus
  SET status = 'draft', effective_to = NULL
  WHERE id = p_menu_id;

  SELECT row_to_json(m) INTO result FROM menus m WHERE m.id = p_menu_id;
  RETURN result;
END;
$$;
