
-- Yield test records for tracking butchery/fish/prep yields over time
CREATE TABLE public.yield_tests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES public.organizations(id),
  recipe_id uuid REFERENCES public.recipes(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  category text NOT NULL DEFAULT 'butchery',
  test_date date NOT NULL DEFAULT CURRENT_DATE,
  prepped_by text,
  prepped_by_user_id uuid,
  
  -- Input
  gross_weight numeric NOT NULL DEFAULT 0,
  gross_weight_unit text NOT NULL DEFAULT 'kg',
  cost_per_unit numeric NOT NULL DEFAULT 0,
  total_cost numeric GENERATED ALWAYS AS (gross_weight * cost_per_unit) STORED,
  
  -- Output
  usable_weight numeric NOT NULL DEFAULT 0,
  waste_weight numeric NOT NULL DEFAULT 0,
  portions_count numeric DEFAULT 0,
  portion_size numeric DEFAULT 0,
  portion_unit text DEFAULT 'g',
  
  -- Calculated
  yield_percent numeric GENERATED ALWAYS AS (
    CASE WHEN gross_weight > 0 THEN ROUND((usable_weight / gross_weight) * 100, 1) ELSE 0 END
  ) STORED,
  cost_per_portion numeric GENERATED ALWAYS AS (
    CASE WHEN portions_count > 0 THEN ROUND((gross_weight * cost_per_unit) / portions_count, 2) ELSE 0 END
  ) STORED,
  usable_cost_per_unit numeric GENERATED ALWAYS AS (
    CASE WHEN usable_weight > 0 THEN ROUND((gross_weight * cost_per_unit) / usable_weight, 2) ELSE 0 END
  ) STORED,
  
  -- Target for variance tracking
  target_yield_percent numeric DEFAULT 100,
  
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.yield_tests ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own org yield tests"
  ON public.yield_tests FOR SELECT
  USING (org_id IN (SELECT get_user_org_ids(auth.uid())) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Head chefs can manage own org yield tests"
  ON public.yield_tests FOR ALL
  USING (is_head_chef(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid())))
  WITH CHECK (is_head_chef(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Users with edit permission can manage yield tests"
  ON public.yield_tests FOR ALL
  USING (EXISTS (
    SELECT 1 FROM module_permissions
    WHERE module_permissions.user_id = auth.uid()
      AND module_permissions.module = 'production'
      AND module_permissions.can_edit = true
  ));

-- Trigger for updated_at
CREATE TRIGGER update_yield_tests_updated_at
  BEFORE UPDATE ON public.yield_tests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for date range queries
CREATE INDEX idx_yield_tests_org_date ON public.yield_tests(org_id, test_date DESC);
CREATE INDEX idx_yield_tests_item ON public.yield_tests(item_name, test_date DESC);
