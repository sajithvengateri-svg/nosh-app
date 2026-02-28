
-- Fix: Replace sync function to include org_id from ingredients
CREATE OR REPLACE FUNCTION public.sync_inventory_from_ingredients()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  synced_count INTEGER := 0;
BEGIN
  -- Insert ingredients that don't have inventory entries yet, including org_id
  INSERT INTO public.inventory (
    name,
    ingredient_id,
    quantity,
    unit,
    min_stock,
    location,
    org_id
  )
  SELECT 
    i.name,
    i.id,
    COALESCE(i.current_stock, 0),
    i.unit,
    COALESCE(i.par_level, 0),
    'Main Storage',
    i.org_id
  FROM public.ingredients i
  WHERE NOT EXISTS (
    SELECT 1 FROM public.inventory inv WHERE inv.ingredient_id = i.id
  );
  
  GET DIAGNOSTICS synced_count = ROW_COUNT;
  
  -- Also fix existing inventory rows missing org_id
  UPDATE public.inventory inv
  SET org_id = i.org_id
  FROM public.ingredients i
  WHERE inv.ingredient_id = i.id
    AND inv.org_id IS NULL
    AND i.org_id IS NOT NULL;
  
  RETURN synced_count;
END;
$function$;
