
-- Add ingredient_name column to demand_insights
ALTER TABLE public.demand_insights ADD COLUMN IF NOT EXISTS ingredient_name text;

-- Update the unique constraint to include ingredient_name
-- First drop old constraint if exists
ALTER TABLE public.demand_insights DROP CONSTRAINT IF EXISTS demand_insights_ingredient_category_postcode_week_ending_key;

-- Create new unique constraint
ALTER TABLE public.demand_insights ADD CONSTRAINT demand_insights_unique_key 
  UNIQUE (ingredient_category, ingredient_name, postcode, week_ending);

-- Recreate refresh function to aggregate by ingredient name
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
  
  INSERT INTO demand_insights (ingredient_name, ingredient_category, postcode, week_ending, total_quantity, order_count, unit, avg_price_paid)
  SELECT 
    i.name,
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
  GROUP BY i.name, COALESCE(i.category, 'Other'), COALESCE(v.postcode, '0000'), current_week_end;
  
  GET DIAGNOSTICS refreshed = ROW_COUNT;
  RETURN refreshed;
END;
$$;

-- Update ingredient trigger to include name
CREATE OR REPLACE FUNCTION public.aggregate_demand_on_ingredient_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  venue_postcode text;
  current_week_end date;
BEGIN
  current_week_end := date_trunc('week', CURRENT_DATE)::date + 6;
  
  SELECT COALESCE(v.postcode, '0000') INTO venue_postcode FROM org_venues v WHERE v.org_id = NEW.org_id LIMIT 1;
  venue_postcode := COALESCE(venue_postcode, '0000');
  
  INSERT INTO demand_insights (ingredient_name, ingredient_category, postcode, week_ending, total_quantity, order_count, unit, avg_price_paid)
  VALUES (NEW.name, COALESCE(NEW.category, 'Other'), venue_postcode, current_week_end, 1, 1, NEW.unit, NEW.cost_per_unit)
  ON CONFLICT (ingredient_category, ingredient_name, postcode, week_ending)
  DO UPDATE SET
    order_count = demand_insights.order_count + 1,
    avg_price_paid = COALESCE(
      (COALESCE(demand_insights.avg_price_paid, 0) * demand_insights.order_count + COALESCE(EXCLUDED.avg_price_paid, 0)) 
      / NULLIF(demand_insights.order_count + 1, 0),
      demand_insights.avg_price_paid
    );
  
  RETURN NEW;
END;
$$;
