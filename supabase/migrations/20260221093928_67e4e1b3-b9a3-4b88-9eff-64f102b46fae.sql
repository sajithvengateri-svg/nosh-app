
CREATE OR REPLACE FUNCTION public.batch_insert_menu_items(
  p_menu_id UUID,
  p_items JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller_org UUID;
  menu_org UUID;
  inserted_count INTEGER;
BEGIN
  SELECT org_id INTO caller_org
  FROM org_memberships
  WHERE user_id = auth.uid() AND is_active = true
  LIMIT 1;

  SELECT org_id INTO menu_org FROM menus WHERE id = p_menu_id;

  IF caller_org IS NULL OR menu_org IS NULL OR caller_org != menu_org THEN
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

CREATE OR REPLACE FUNCTION public.batch_create_menu_recipes(p_menu_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller_org UUID;
  menu_org UUID;
  created_count INTEGER := 0;
  item_record RECORD;
  new_recipe_id UUID;
BEGIN
  SELECT org_id INTO caller_org
  FROM org_memberships
  WHERE user_id = auth.uid() AND is_active = true
  LIMIT 1;

  SELECT org_id INTO menu_org FROM menus WHERE id = p_menu_id;

  IF caller_org IS NULL OR menu_org IS NULL OR caller_org != menu_org THEN
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
