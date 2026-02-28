
-- Fix the MODE() fallback issue by using a proper aggregate
CREATE OR REPLACE FUNCTION public.refresh_demand_insights()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  refreshed integer := 0;
  current_week_end date;
BEGIN
  current_week_end := date_trunc('week', CURRENT_DATE)::date + 6;
  
  DELETE FROM demand_insights WHERE week_ending = current_week_end;
  
  INSERT INTO demand_insights (ingredient_category, postcode, week_ending, total_quantity, order_count, unit, avg_price_paid)
  SELECT 
    COALESCE(i.category, 'Other'),
    COALESCE(v.postcode, '0000'),
    current_week_end,
    COALESCE(SUM(COALESCE(ri.quantity, 0)), 0),
    COUNT(ri.id),
    MODE() WITHIN GROUP (ORDER BY i.unit),
    AVG(i.cost_per_unit)
  FROM ingredients i
  LEFT JOIN recipe_ingredients ri ON ri.ingredient_id = i.id
  LEFT JOIN org_venues v ON v.org_id = i.org_id
  WHERE i.org_id IS NOT NULL
  GROUP BY COALESCE(i.category, 'Other'), COALESCE(v.postcode, '0000'), current_week_end;
  
  GET DIAGNOSTICS refreshed = ROW_COUNT;
  RETURN refreshed;
END;
$$;
