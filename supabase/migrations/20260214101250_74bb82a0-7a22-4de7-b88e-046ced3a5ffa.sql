
-- Create feature_releases table
CREATE TABLE public.feature_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_slug text NOT NULL,
  module_name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'development',
  release_type text NOT NULL DEFAULT 'new',
  target_release text,
  release_notes text,
  sort_order integer NOT NULL DEFAULT 0,
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_releases ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins can manage feature releases"
ON public.feature_releases FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated read-only
CREATE POLICY "Authenticated users can view feature releases"
ON public.feature_releases FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Updated_at trigger
CREATE TRIGGER update_feature_releases_updated_at
BEFORE UPDATE ON public.feature_releases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed: 10 Coming Soon modules
INSERT INTO public.feature_releases (module_slug, module_name, description, status, release_type, sort_order) VALUES
('inventory', 'Inventory', 'Full stock tracking with locations, expiry dates, and par levels', 'development', 'new', 1),
('production', 'Production', 'Batch production tracking, recipe scaling, and order generation', 'development', 'new', 2),
('marketplace', 'Marketplace', 'Connect with local vendors, view demand insights', 'development', 'new', 3),
('allergens', 'Allergens', 'Allergen dashboard and compliance tracking', 'development', 'new', 4),
('roster', 'Roster', 'Staff scheduling with shift management', 'development', 'new', 5),
('calendar', 'Calendar', 'Operations calendar for events, maintenance, and deadlines', 'development', 'new', 6),
('kitchen-sections', 'Kitchen Sections', 'Section management with budgets and team assignments', 'development', 'new', 7),
('cheatsheets', 'Cheatsheets', 'Quick-reference cooking guides and conversion charts', 'development', 'new', 8),
('food-safety', 'Food Safety', 'HACCP logs, cleaning schedules, and temperature monitoring', 'development', 'new', 9),
('training', 'Training', 'Staff training modules and progress tracking', 'development', 'new', 10);

-- Seed: 3 example improvement tickets
INSERT INTO public.feature_releases (module_slug, module_name, description, status, release_type, sort_order) VALUES
('recipes', 'Recipes', 'Batch duplicate recipes with one click', 'development', 'improvement', 11),
('prep', 'Prep Lists', 'Drag-to-reorder prep list items', 'development', 'improvement', 12),
('ingredients', 'Costing', 'Supplier comparison view for ingredients', 'development', 'improvement', 13);
