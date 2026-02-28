
-- Add recipe_type column to recipes
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS recipe_type text NOT NULL DEFAULT 'dish';

-- Add yield_percent for portion prep recipes
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS yield_percent numeric DEFAULT 100;

-- Migrate existing batch recipes
UPDATE public.recipes SET recipe_type = 'batch_prep' WHERE is_batch_recipe = true;

-- Allow recipe_ingredients to reference sub-recipes
ALTER TABLE public.recipe_ingredients ADD COLUMN IF NOT EXISTS sub_recipe_id uuid REFERENCES public.recipes(id) ON DELETE SET NULL;

-- Make ingredient_id nullable (a line is either an ingredient OR a sub-recipe)
ALTER TABLE public.recipe_ingredients ALTER COLUMN ingredient_id DROP NOT NULL;

-- Add constraint: must have one of ingredient_id or sub_recipe_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ingredient_or_sub_recipe'
  ) THEN
    ALTER TABLE public.recipe_ingredients ADD CONSTRAINT ingredient_or_sub_recipe 
      CHECK (ingredient_id IS NOT NULL OR sub_recipe_id IS NOT NULL);
  END IF;
END $$;
