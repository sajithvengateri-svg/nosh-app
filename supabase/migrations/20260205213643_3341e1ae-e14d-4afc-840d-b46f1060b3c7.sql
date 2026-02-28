-- Create inventory_locations table for customizable storage locations
CREATE TABLE public.inventory_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6B7280',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inventory_locations ENABLE ROW LEVEL SECURITY;

-- Anyone can view locations
CREATE POLICY "Anyone can view inventory locations"
ON public.inventory_locations
FOR SELECT
USING (true);

-- Head chefs can manage locations
CREATE POLICY "Head chefs can manage inventory locations"
ON public.inventory_locations
FOR ALL
USING (is_head_chef(auth.uid()));

-- Users with inventory edit permission can manage locations
CREATE POLICY "Users with edit permission can manage inventory locations"
ON public.inventory_locations
FOR ALL
USING (EXISTS (
  SELECT 1 FROM module_permissions
  WHERE module_permissions.user_id = auth.uid()
  AND module_permissions.module = 'inventory'
  AND module_permissions.can_edit = true
));

-- Create updated_at trigger
CREATE TRIGGER update_inventory_locations_updated_at
BEFORE UPDATE ON public.inventory_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default locations
INSERT INTO public.inventory_locations (name, description, sort_order) VALUES
('Main Storage', 'Primary storage area', 0),
('Walk-in Cooler', 'Refrigerated storage', 1),
('Freezer', 'Frozen storage', 2),
('Dry Storage', 'Non-refrigerated goods', 3),
('Prep Area', 'Active preparation station', 4);