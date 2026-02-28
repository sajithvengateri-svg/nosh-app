-- Add food cost alert thresholds to recipes
ALTER TABLE public.recipes 
ADD COLUMN IF NOT EXISTS target_food_cost_percent numeric DEFAULT 30,
ADD COLUMN IF NOT EXISTS food_cost_low_alert numeric DEFAULT 20,
ADD COLUMN IF NOT EXISTS food_cost_high_alert numeric DEFAULT 35,
ADD COLUMN IF NOT EXISTS sell_price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS gst_percent numeric DEFAULT 10,
ADD COLUMN IF NOT EXISTS total_yield numeric DEFAULT 1,
ADD COLUMN IF NOT EXISTS yield_unit text DEFAULT 'portions';

-- Create recipe_ingredients junction table for proper ingredient linking
CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  ingredient_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'g',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(recipe_id, ingredient_id)
);

-- Enable RLS on recipe_ingredients
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- Create policies for recipe_ingredients
CREATE POLICY "Anyone can view recipe ingredients" ON public.recipe_ingredients
  FOR SELECT USING (true);

CREATE POLICY "Head chefs can manage recipe ingredients" ON public.recipe_ingredients
  FOR ALL USING (is_head_chef(auth.uid()));

CREATE POLICY "Users with edit permission can manage recipe ingredients" ON public.recipe_ingredients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM module_permissions
      WHERE module_permissions.user_id = auth.uid()
      AND module_permissions.module = 'recipes'
      AND module_permissions.can_edit = true
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_recipe_ingredients_updated_at
  BEFORE UPDATE ON public.recipe_ingredients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add previous_cost_per_unit to ingredients for price change tracking
ALTER TABLE public.ingredients
ADD COLUMN IF NOT EXISTS previous_cost_per_unit numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_price_update timestamp with time zone;