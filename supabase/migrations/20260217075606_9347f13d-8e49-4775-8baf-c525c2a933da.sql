
-- Editable floor zones for the floor plan editor
CREATE TABLE public.res_floor_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  layout_id UUID REFERENCES public.res_floor_layouts(id) ON DELETE CASCADE,
  zone TEXT NOT NULL DEFAULT 'INDOOR',
  label TEXT NOT NULL DEFAULT 'Zone',
  x NUMERIC NOT NULL DEFAULT 10,
  y NUMERIC NOT NULL DEFAULT 10,
  width NUMERIC NOT NULL DEFAULT 500,
  height NUMERIC NOT NULL DEFAULT 350,
  color TEXT NOT NULL DEFAULT 'rgba(59,130,246,0.25)',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.res_floor_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view floor zones"
  ON public.res_floor_zones FOR SELECT
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org owners/head chefs can manage floor zones"
  ON public.res_floor_zones FOR ALL
  USING (public.is_org_head_chef(auth.uid(), org_id));

CREATE TRIGGER update_res_floor_zones_updated_at
  BEFORE UPDATE ON public.res_floor_zones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
