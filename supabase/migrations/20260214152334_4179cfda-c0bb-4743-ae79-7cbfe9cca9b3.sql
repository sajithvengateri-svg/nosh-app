
-- Create the refresh_demand_insights function that aggregates anonymized demand
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
  
  -- Clear current week data and re-aggregate
  DELETE FROM demand_insights WHERE week_ending = current_week_end;
  
  INSERT INTO demand_insights (ingredient_category, postcode, week_ending, total_quantity, order_count, unit, avg_price_paid)
  SELECT 
    COALESCE(i.category, 'Other'),
    COALESCE(v.postcode, '0000'),
    current_week_end,
    COALESCE(SUM(COALESCE(ri.quantity, 0)), 0),
    COUNT(ri.id),
    COALESCE(MODE() WITHIN GROUP (ORDER BY COALESCE(ri.unit, i.unit)), i.unit),
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

-- Also create a trigger on ingredients table so demand auto-updates when ingredients change
CREATE OR REPLACE FUNCTION public.aggregate_demand_on_ingredient_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  venue_postcode text;
  current_week_end date;
  ing_category text;
  ing_unit text;
  ing_cost numeric;
BEGIN
  current_week_end := date_trunc('week', CURRENT_DATE)::date + 6;
  
  -- Get the ingredient details
  IF TG_OP = 'DELETE' THEN
    ing_category := COALESCE(OLD.category, 'Other');
    ing_unit := OLD.unit;
    ing_cost := OLD.cost_per_unit;
    SELECT COALESCE(v.postcode, '0000') INTO venue_postcode FROM org_venues v WHERE v.org_id = OLD.org_id LIMIT 1;
  ELSE
    ing_category := COALESCE(NEW.category, 'Other');
    ing_unit := NEW.unit;
    ing_cost := NEW.cost_per_unit;
    SELECT COALESCE(v.postcode, '0000') INTO venue_postcode FROM org_venues v WHERE v.org_id = NEW.org_id LIMIT 1;
  END IF;
  
  venue_postcode := COALESCE(venue_postcode, '0000');
  
  -- Upsert into demand_insights
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    INSERT INTO demand_insights (ingredient_category, postcode, week_ending, total_quantity, order_count, unit, avg_price_paid)
    VALUES (ing_category, venue_postcode, current_week_end, 1, 1, ing_unit, ing_cost)
    ON CONFLICT (ingredient_category, postcode, week_ending)
    DO UPDATE SET
      order_count = demand_insights.order_count + 1,
      avg_price_paid = COALESCE(
        (COALESCE(demand_insights.avg_price_paid, 0) * demand_insights.order_count + COALESCE(EXCLUDED.avg_price_paid, 0)) 
        / NULLIF(demand_insights.order_count + 1, 0),
        demand_insights.avg_price_paid
      );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create the trigger on ingredients
DROP TRIGGER IF EXISTS trg_ingredient_demand ON public.ingredients;
CREATE TRIGGER trg_ingredient_demand
  AFTER INSERT OR UPDATE ON public.ingredients
  FOR EACH ROW
  EXECUTE FUNCTION public.aggregate_demand_on_ingredient_change();
