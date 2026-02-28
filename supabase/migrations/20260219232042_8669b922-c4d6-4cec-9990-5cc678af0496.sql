
-- Create menu_cost_snapshots table for historical dish-level costing data
CREATE TABLE public.menu_cost_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_id uuid REFERENCES public.menus(id) ON DELETE SET NULL,
  menu_item_id uuid REFERENCES public.menu_items(id) ON DELETE SET NULL,
  dish_name text NOT NULL,
  sell_price numeric NOT NULL DEFAULT 0,
  food_cost numeric NOT NULL DEFAULT 0,
  fc_percent numeric NOT NULL DEFAULT 0,
  snapshot_date timestamptz NOT NULL DEFAULT now(),
  org_id uuid REFERENCES public.organizations(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.menu_cost_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS: org members can SELECT
CREATE POLICY "Org members can view snapshots"
  ON public.menu_cost_snapshots FOR SELECT
  USING (public.is_org_member(auth.uid(), org_id));

-- RLS: org members can INSERT
CREATE POLICY "Org members can insert snapshots"
  ON public.menu_cost_snapshots FOR INSERT
  WITH CHECK (public.is_org_member(auth.uid(), org_id));

-- RLS: org members can DELETE
CREATE POLICY "Org members can delete snapshots"
  ON public.menu_cost_snapshots FOR DELETE
  USING (public.is_org_member(auth.uid(), org_id));

-- Index for fast lookups by dish name (for trends)
CREATE INDEX idx_menu_cost_snapshots_dish_name ON public.menu_cost_snapshots(org_id, dish_name, snapshot_date);

-- Index for menu-level lookups
CREATE INDEX idx_menu_cost_snapshots_menu_id ON public.menu_cost_snapshots(menu_id);
