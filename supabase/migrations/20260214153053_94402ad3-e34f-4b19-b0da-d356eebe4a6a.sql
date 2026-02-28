
-- Drop the old constraint that doesn't include ingredient_name
ALTER TABLE public.demand_insights DROP CONSTRAINT IF EXISTS demand_insights_unique_category_postcode_week;
