-- Fix batch_insert_menu_items: match caller org against the menu's org
CREATE OR REPLACE FUNCTION public.batch_insert_menu_items(p_menu_id uuid, p_items jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  menu_org UUID;
  inserted_count INTEGER;
BEGIN
  -- Get the menu's org
  SELECT org_id INTO menu_org FROM menus WHERE id = p_menu_id;
  IF menu_org IS NULL THEN
    RAISE EXCEPTION 'Menu not found';
  END IF;

  -- Verify caller is a member of that org
  IF NOT EXISTS (
    SELECT 1 FROM org_memberships
    WHERE user_id = auth.uid() AND org_id = menu_org AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO menu_items (menu_id, org_id, name, description, category, sell_price)
  SELECT
    p_menu_id,
    menu_org,
    item->>'name',
    item->>'description',
    COALESCE(item->>'category', 'Uncategorized'),
    COALESCE((item->>'sell_price')::numeric, 0)
  FROM jsonb_array_elements(p_items) AS item;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$;

-- Fix batch_create_menu_recipes: match caller org against the menu's org
CREATE OR REPLACE FUNCTION public.batch_create_menu_recipes(p_menu_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  menu_org UUID;
  created_count INTEGER := 0;
  item_record RECORD;
  new_recipe_id UUID;
BEGIN
  -- Get the menu's org
  SELECT org_id INTO menu_org FROM menus WHERE id = p_menu_id;
  IF menu_org IS NULL THEN
    RAISE EXCEPTION 'Menu not found';
  END IF;

  -- Verify caller is a member of that org
  IF NOT EXISTS (
    SELECT 1 FROM org_memberships
    WHERE user_id = auth.uid() AND org_id = menu_org AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  FOR item_record IN
    SELECT id, name, category, sell_price
    FROM menu_items
    WHERE menu_id = p_menu_id AND recipe_id IS NULL
  LOOP
    INSERT INTO recipes (name, category, sell_price, recipe_type, org_id, created_by, cost_per_serving, is_public)
    VALUES (item_record.name, COALESCE(item_record.category, 'Main'), item_record.sell_price, 'dish', menu_org, auth.uid(), 0, true)
    RETURNING id INTO new_recipe_id;

    UPDATE menu_items SET recipe_id = new_recipe_id WHERE id = item_record.id;
    created_count := created_count + 1;
  END LOOP;

  RETURN created_count;
END;
$$;

-- Fix archive_menu: match against menu's org directly
CREATE OR REPLACE FUNCTION public.archive_menu(p_menu_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
  menu_org UUID;
BEGIN
  SELECT org_id INTO menu_org FROM menus WHERE id = p_menu_id;
  IF menu_org IS NULL THEN
    RAISE EXCEPTION 'Menu not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM org_memberships
    WHERE user_id = auth.uid() AND org_id = menu_org AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Not authorized to archive this menu';
  END IF;

  UPDATE menus SET status = 'archived', effective_to = now() WHERE id = p_menu_id;
  SELECT row_to_json(m) INTO result FROM menus m WHERE m.id = p_menu_id;
  RETURN result;
END;
$$;

-- Fix unarchive_menu: match against menu's org directly
CREATE OR REPLACE FUNCTION public.unarchive_menu(p_menu_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
  menu_org UUID;
BEGIN
  SELECT org_id INTO menu_org FROM menus WHERE id = p_menu_id;
  IF menu_org IS NULL THEN
    RAISE EXCEPTION 'Menu not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM org_memberships
    WHERE user_id = auth.uid() AND org_id = menu_org AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Not authorized to unarchive this menu';
  END IF;

  UPDATE menus SET status = 'draft', effective_to = NULL WHERE id = p_menu_id;
  SELECT row_to_json(m) INTO result FROM menus m WHERE m.id = p_menu_id;
  RETURN result;
END;
$$;