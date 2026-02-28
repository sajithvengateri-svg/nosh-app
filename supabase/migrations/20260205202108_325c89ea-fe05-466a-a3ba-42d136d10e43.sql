-- Create recipe_sections table for custom categories
CREATE TABLE public.recipe_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6B7280',
  icon TEXT DEFAULT 'ChefHat',
  sort_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recipe_sections ENABLE ROW LEVEL SECURITY;

-- Anyone can view sections
CREATE POLICY "Anyone can view recipe sections"
ON public.recipe_sections FOR SELECT
USING (true);

-- Head chefs can manage sections
CREATE POLICY "Head chefs can manage recipe sections"
ON public.recipe_sections FOR ALL
USING (is_head_chef(auth.uid()));

-- Users with recipes edit permission can manage sections
CREATE POLICY "Users with edit permission can manage recipe sections"
ON public.recipe_sections FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM module_permissions
    WHERE module_permissions.user_id = auth.uid()
    AND module_permissions.module = 'recipes'
    AND module_permissions.can_edit = true
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_recipe_sections_updated_at
  BEFORE UPDATE ON public.recipe_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default sections
INSERT INTO public.recipe_sections (name, sort_order, is_default) VALUES
  ('Mains', 1, true),
  ('Appetizers', 2, true),
  ('Soups', 3, true),
  ('Salads', 4, true),
  ('Desserts', 5, true),
  ('Sauces', 6, true),
  ('Sides', 7, true),
  ('Breakfast', 8, true);