-- Create stock_movements table to track all inventory changes
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_id UUID REFERENCES public.inventory(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE SET NULL,
  movement_type TEXT NOT NULL, -- 'received', 'used', 'stocktake', 'waste', 'adjustment'
  quantity_change NUMERIC NOT NULL, -- positive for additions, negative for deductions
  quantity_before NUMERIC,
  quantity_after NUMERIC,
  source TEXT, -- 'invoice', 'recipe', 'prep_list', 'manual', 'stocktake'
  source_reference TEXT, -- invoice ID, recipe ID, prep list ID, etc.
  notes TEXT,
  recorded_by UUID,
  recorded_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stocktakes table for periodic inventory counts
CREATE TABLE public.stocktakes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  stocktake_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed', 'cancelled'
  stocktake_type TEXT NOT NULL DEFAULT 'full', -- 'full', 'spot', 'category'
  notes TEXT,
  total_items INTEGER DEFAULT 0,
  items_counted INTEGER DEFAULT 0,
  total_variance_value NUMERIC DEFAULT 0,
  created_by UUID,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stocktake_items table for individual item counts
CREATE TABLE public.stocktake_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stocktake_id UUID NOT NULL REFERENCES public.stocktakes(id) ON DELETE CASCADE,
  inventory_id UUID REFERENCES public.inventory(id) ON DELETE SET NULL,
  ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE SET NULL,
  ingredient_name TEXT NOT NULL,
  expected_quantity NUMERIC NOT NULL DEFAULT 0,
  counted_quantity NUMERIC,
  variance NUMERIC GENERATED ALWAYS AS (COALESCE(counted_quantity, 0) - expected_quantity) STORED,
  variance_value NUMERIC DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'kg',
  location TEXT,
  counted_by UUID,
  counted_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stocktakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stocktake_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for stock_movements
CREATE POLICY "Anyone can view stock movements"
ON public.stock_movements FOR SELECT
USING (true);

CREATE POLICY "Head chefs can manage stock movements"
ON public.stock_movements FOR ALL
USING (is_head_chef(auth.uid()));

CREATE POLICY "Users with inventory edit can manage stock movements"
ON public.stock_movements FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM module_permissions
    WHERE module_permissions.user_id = auth.uid()
    AND module_permissions.module = 'inventory'
    AND module_permissions.can_edit = true
  )
);

-- RLS policies for stocktakes
CREATE POLICY "Anyone can view stocktakes"
ON public.stocktakes FOR SELECT
USING (true);

CREATE POLICY "Head chefs can manage stocktakes"
ON public.stocktakes FOR ALL
USING (is_head_chef(auth.uid()));

CREATE POLICY "Users with inventory edit can manage stocktakes"
ON public.stocktakes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM module_permissions
    WHERE module_permissions.user_id = auth.uid()
    AND module_permissions.module = 'inventory'
    AND module_permissions.can_edit = true
  )
);

-- RLS policies for stocktake_items
CREATE POLICY "Anyone can view stocktake items"
ON public.stocktake_items FOR SELECT
USING (true);

CREATE POLICY "Head chefs can manage stocktake items"
ON public.stocktake_items FOR ALL
USING (is_head_chef(auth.uid()));

CREATE POLICY "Users with inventory edit can manage stocktake items"
ON public.stocktake_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM module_permissions
    WHERE module_permissions.user_id = auth.uid()
    AND module_permissions.module = 'inventory'
    AND module_permissions.can_edit = true
  )
);

-- Add trigger for stocktakes updated_at
CREATE TRIGGER update_stocktakes_updated_at
BEFORE UPDATE ON public.stocktakes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to sync inventory from ingredients
CREATE OR REPLACE FUNCTION public.sync_inventory_from_ingredients()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  synced_count INTEGER := 0;
BEGIN
  -- Insert ingredients that don't have inventory entries yet
  INSERT INTO public.inventory (
    name,
    ingredient_id,
    quantity,
    unit,
    min_stock,
    location
  )
  SELECT 
    i.name,
    i.id,
    COALESCE(i.current_stock, 0),
    i.unit,
    COALESCE(i.par_level, 0),
    'Main Storage'
  FROM public.ingredients i
  WHERE NOT EXISTS (
    SELECT 1 FROM public.inventory inv WHERE inv.ingredient_id = i.id
  );
  
  GET DIAGNOSTICS synced_count = ROW_COUNT;
  RETURN synced_count;
END;
$$;