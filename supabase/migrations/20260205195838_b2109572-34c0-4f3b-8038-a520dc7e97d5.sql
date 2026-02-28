-- Create recipe_ccps table for Critical Control Points
CREATE TABLE public.recipe_ccps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  step_order INTEGER NOT NULL DEFAULT 0,
  step_type TEXT NOT NULL DEFAULT 'prep', -- 'prep', 'cook', 'hold', 'cool', 'reheat', 'serve'
  
  -- Quick Check fields (always visible)
  target_temp NUMERIC, -- target temperature in Celsius
  temp_unit TEXT DEFAULT 'C', -- 'C' or 'F'
  time_limit INTEGER, -- time limit in minutes
  is_critical BOOLEAN DEFAULT false, -- marks as a critical control point
  
  -- Full HACCP fields (shown when enabled)
  hazard_type TEXT, -- 'biological', 'chemical', 'physical'
  hazard_description TEXT,
  critical_limit_min NUMERIC,
  critical_limit_max NUMERIC,
  monitoring_procedure TEXT,
  monitoring_frequency TEXT, -- 'each_batch', 'hourly', 'per_item'
  corrective_action TEXT,
  verification_method TEXT,
  record_keeping_notes TEXT,
  
  -- Position on timeline (0-100 percentage)
  timeline_position NUMERIC DEFAULT 50,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recipe_ccps ENABLE ROW LEVEL SECURITY;

-- Anyone can view CCPs
CREATE POLICY "Anyone can view recipe CCPs"
ON public.recipe_ccps
FOR SELECT
USING (true);

-- Head chefs can manage CCPs
CREATE POLICY "Head chefs can manage recipe CCPs"
ON public.recipe_ccps
FOR ALL
USING (is_head_chef(auth.uid()));

-- Users with recipe edit permission can manage CCPs
CREATE POLICY "Users with edit permission can manage recipe CCPs"
ON public.recipe_ccps
FOR ALL
USING (EXISTS (
  SELECT 1 FROM module_permissions
  WHERE module_permissions.user_id = auth.uid()
    AND module_permissions.module = 'recipes'
    AND module_permissions.can_edit = true
));

-- Create trigger for updated_at
CREATE TRIGGER update_recipe_ccps_updated_at
BEFORE UPDATE ON public.recipe_ccps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for recipe lookups
CREATE INDEX idx_recipe_ccps_recipe_id ON public.recipe_ccps(recipe_id);
CREATE INDEX idx_recipe_ccps_step_order ON public.recipe_ccps(recipe_id, step_order);