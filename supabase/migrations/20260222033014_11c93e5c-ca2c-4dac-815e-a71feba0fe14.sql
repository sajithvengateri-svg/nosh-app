
-- Create production_batches table to persist batch production logs
CREATE TABLE public.production_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  recipe_name TEXT NOT NULL,
  batch_code TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'portions',
  servings_produced NUMERIC NOT NULL DEFAULT 0,
  production_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  expiry_date TIMESTAMPTZ,
  shelf_life_days INTEGER DEFAULT 3,
  produced_by UUID,
  produced_by_name TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('planned','in-progress','completed','discarded')),
  actual_cost NUMERIC,
  scale_factor NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.production_batches ENABLE ROW LEVEL SECURITY;

-- RLS policies: org members only
CREATE POLICY "Org members can view production batches"
  ON public.production_batches FOR SELECT
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can insert production batches"
  ON public.production_batches FOR INSERT
  WITH CHECK (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can update production batches"
  ON public.production_batches FOR UPDATE
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can delete production batches"
  ON public.production_batches FOR DELETE
  USING (public.is_org_member(auth.uid(), org_id));

-- Auto-update updated_at
CREATE TRIGGER update_production_batches_updated_at
  BEFORE UPDATE ON public.production_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast org lookups
CREATE INDEX idx_production_batches_org_id ON public.production_batches(org_id);
CREATE INDEX idx_production_batches_status ON public.production_batches(org_id, status);
