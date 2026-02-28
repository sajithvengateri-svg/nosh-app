-- Add postcode to profiles for geographic demand aggregation
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS postcode text;

-- Create function to aggregate ingredient demand from public recipes
CREATE OR REPLACE FUNCTION public.aggregate_demand_insights()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipe_record RECORD;
  ingredient_record RECORD;
  chef_postcode text;
  current_week_end date;
BEGIN
  -- Get the current week ending (Sunday)
  current_week_end := date_trunc('week', CURRENT_DATE) + interval '6 days';
  
  -- For INSERT/UPDATE on recipe_ingredients, get the recipe
  IF TG_TABLE_NAME = 'recipe_ingredients' THEN
    SELECT r.*, p.postcode INTO recipe_record
    FROM recipes r
    LEFT JOIN profiles p ON r.created_by = p.user_id
    WHERE r.id = COALESCE(NEW.recipe_id, OLD.recipe_id);
    
    -- Only process if recipe is public
    IF recipe_record.is_public IS NOT TRUE THEN
      RETURN COALESCE(NEW, OLD);
    END IF;
    
    chef_postcode := COALESCE(recipe_record.postcode, '0000');
    
    -- Get ingredient details
    SELECT i.* INTO ingredient_record
    FROM ingredients i
    WHERE i.id = NEW.ingredient_id;
    
    IF ingredient_record IS NOT NULL THEN
      -- Upsert into demand_insights
      INSERT INTO demand_insights (
        ingredient_category,
        postcode,
        week_ending,
        total_quantity,
        order_count,
        unit,
        avg_price_paid
      ) VALUES (
        ingredient_record.category,
        chef_postcode,
        current_week_end,
        NEW.quantity,
        1,
        NEW.unit,
        ingredient_record.cost_per_unit
      )
      ON CONFLICT (ingredient_category, postcode, week_ending) 
      DO UPDATE SET
        total_quantity = demand_insights.total_quantity + EXCLUDED.total_quantity,
        order_count = demand_insights.order_count + 1,
        avg_price_paid = (
          (demand_insights.avg_price_paid * demand_insights.order_count) + EXCLUDED.avg_price_paid
        ) / (demand_insights.order_count + 1);
    END IF;
  END IF;
  
  -- For INSERT/UPDATE on recipes (when is_public changes to true)
  IF TG_TABLE_NAME = 'recipes' THEN
    -- Only trigger when recipe becomes public
    IF NEW.is_public = true AND (OLD IS NULL OR OLD.is_public IS NOT TRUE) THEN
      SELECT postcode INTO chef_postcode
      FROM profiles
      WHERE user_id = NEW.created_by;
      
      chef_postcode := COALESCE(chef_postcode, '0000');
      
      -- Aggregate all ingredients from recipe_ingredients
      FOR ingredient_record IN
        SELECT ri.quantity, ri.unit, i.category, i.cost_per_unit
        FROM recipe_ingredients ri
        JOIN ingredients i ON ri.ingredient_id = i.id
        WHERE ri.recipe_id = NEW.id
      LOOP
        INSERT INTO demand_insights (
          ingredient_category,
          postcode,
          week_ending,
          total_quantity,
          order_count,
          unit,
          avg_price_paid
        ) VALUES (
          ingredient_record.category,
          chef_postcode,
          current_week_end,
          ingredient_record.quantity,
          1,
          ingredient_record.unit,
          ingredient_record.cost_per_unit
        )
        ON CONFLICT (ingredient_category, postcode, week_ending) 
        DO UPDATE SET
          total_quantity = demand_insights.total_quantity + EXCLUDED.total_quantity,
          order_count = demand_insights.order_count + 1,
          avg_price_paid = (
            (demand_insights.avg_price_paid * demand_insights.order_count) + EXCLUDED.avg_price_paid
          ) / (demand_insights.order_count + 1);
      END LOOP;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add unique constraint for upsert (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'demand_insights_unique_category_postcode_week'
  ) THEN
    ALTER TABLE demand_insights 
    ADD CONSTRAINT demand_insights_unique_category_postcode_week 
    UNIQUE (ingredient_category, postcode, week_ending);
  END IF;
END $$;

-- Create trigger on recipe_ingredients for new ingredient additions
DROP TRIGGER IF EXISTS trigger_aggregate_demand_on_ingredient ON recipe_ingredients;
CREATE TRIGGER trigger_aggregate_demand_on_ingredient
AFTER INSERT ON recipe_ingredients
FOR EACH ROW
EXECUTE FUNCTION aggregate_demand_insights();

-- Create trigger on recipes for when recipes become public
DROP TRIGGER IF EXISTS trigger_aggregate_demand_on_recipe_public ON recipes;
CREATE TRIGGER trigger_aggregate_demand_on_recipe_public
AFTER INSERT OR UPDATE OF is_public ON recipes
FOR EACH ROW
EXECUTE FUNCTION aggregate_demand_insights();

-- Backfill demand_insights from existing public recipes
INSERT INTO demand_insights (ingredient_category, postcode, week_ending, total_quantity, order_count, unit, avg_price_paid)
SELECT 
  i.category,
  COALESCE(p.postcode, '0000'),
  date_trunc('week', CURRENT_DATE) + interval '6 days',
  SUM(ri.quantity),
  COUNT(DISTINCT r.id),
  ri.unit,
  AVG(i.cost_per_unit)
FROM recipe_ingredients ri
JOIN recipes r ON ri.recipe_id = r.id
JOIN ingredients i ON ri.ingredient_id = i.id
LEFT JOIN profiles p ON r.created_by = p.user_id
WHERE r.is_public = true
GROUP BY i.category, COALESCE(p.postcode, '0000'), ri.unit
ON CONFLICT (ingredient_category, postcode, week_ending) 
DO UPDATE SET
  total_quantity = EXCLUDED.total_quantity,
  order_count = EXCLUDED.order_count,
  avg_price_paid = EXCLUDED.avg_price_paid;