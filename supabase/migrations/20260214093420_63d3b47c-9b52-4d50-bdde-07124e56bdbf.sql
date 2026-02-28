
-- =============================================
-- PHASE 2: Ingredient Price History Table + Trigger
-- =============================================

CREATE TABLE public.ingredient_price_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ingredient_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  old_price numeric,
  new_price numeric NOT NULL,
  source text DEFAULT 'manual',
  changed_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ingredient_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view price history"
  ON public.ingredient_price_history FOR SELECT
  USING (true);

CREATE POLICY "System can insert price history"
  ON public.ingredient_price_history FOR INSERT
  WITH CHECK (true);

-- Trigger function to auto-log price changes
CREATE OR REPLACE FUNCTION public.log_ingredient_price_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF OLD.cost_per_unit IS DISTINCT FROM NEW.cost_per_unit THEN
    INSERT INTO public.ingredient_price_history (ingredient_id, old_price, new_price, source, changed_by)
    VALUES (NEW.id, OLD.cost_per_unit, NEW.cost_per_unit, 'manual', NULL);
    
    -- Also update previous_cost_per_unit and last_price_update
    NEW.previous_cost_per_unit := OLD.cost_per_unit;
    NEW.last_price_update := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_ingredient_price_change
  BEFORE UPDATE ON public.ingredients
  FOR EACH ROW
  EXECUTE FUNCTION public.log_ingredient_price_change();

-- Index for fast lookups
CREATE INDEX idx_ingredient_price_history_ingredient_id ON public.ingredient_price_history(ingredient_id);
CREATE INDEX idx_ingredient_price_history_created_at ON public.ingredient_price_history(created_at);

-- =============================================
-- PHASE 3: Invoice Scans Table
-- =============================================

CREATE TABLE public.invoice_scans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid,
  scanned_by uuid,
  file_name text,
  items_extracted integer DEFAULT 0,
  items_matched integer DEFAULT 0,
  prices_updated integer DEFAULT 0,
  scan_data jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'processing',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view invoice scans"
  ON public.invoice_scans FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create invoice scans"
  ON public.invoice_scans FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Head chefs can manage invoice scans"
  ON public.invoice_scans FOR ALL
  USING (is_head_chef(auth.uid()));
