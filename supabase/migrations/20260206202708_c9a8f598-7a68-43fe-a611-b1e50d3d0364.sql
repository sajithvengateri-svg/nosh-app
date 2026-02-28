-- Create menus table
CREATE TABLE public.menus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  effective_to TIMESTAMP WITH TIME ZONE,
  avg_food_cost_percent NUMERIC DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create menu_items table
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Uncategorized',
  description TEXT,
  recipe_id UUID REFERENCES public.recipes(id),
  sell_price NUMERIC NOT NULL DEFAULT 0,
  food_cost NUMERIC NOT NULL DEFAULT 0,
  food_cost_percent NUMERIC NOT NULL DEFAULT 0,
  contribution_margin NUMERIC NOT NULL DEFAULT 0,
  popularity INTEGER NOT NULL DEFAULT 0,
  profitability TEXT NOT NULL DEFAULT 'puzzle' CHECK (profitability IN ('star', 'plow-horse', 'puzzle', 'dog')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  allergens TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for menus
CREATE POLICY "Anyone can view menus"
  ON public.menus FOR SELECT
  USING (true);

CREATE POLICY "Head chefs can manage menus"
  ON public.menus FOR ALL
  USING (is_head_chef(auth.uid()));

CREATE POLICY "Users with edit permission can manage menus"
  ON public.menus FOR ALL
  USING (EXISTS (
    SELECT 1 FROM module_permissions
    WHERE user_id = auth.uid()
    AND module = 'menu-engineering'
    AND can_edit = true
  ));

-- RLS policies for menu_items
CREATE POLICY "Anyone can view menu items"
  ON public.menu_items FOR SELECT
  USING (true);

CREATE POLICY "Head chefs can manage menu items"
  ON public.menu_items FOR ALL
  USING (is_head_chef(auth.uid()));

CREATE POLICY "Users with edit permission can manage menu items"
  ON public.menu_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM module_permissions
    WHERE user_id = auth.uid()
    AND module = 'menu-engineering'
    AND can_edit = true
  ));

-- Triggers for updated_at
CREATE TRIGGER update_menus_updated_at
  BEFORE UPDATE ON public.menus
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_menu_items_menu_id ON public.menu_items(menu_id);
CREATE INDEX idx_menus_status ON public.menus(status);