-- =============================================
-- Tradies directory + Service schedules
-- =============================================

-- Tradies: plumbers, electricians, equipment suppliers etc.
CREATE TABLE IF NOT EXISTS public.tradies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  company text,
  category text NOT NULL DEFAULT 'Other',
  phone text,
  email text,
  website text,
  abn text,
  address text,
  notes text,
  photo_url text,
  is_supplier boolean DEFAULT false,
  linked_equipment_ids uuid[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tradies_org_id ON public.tradies(org_id);
CREATE INDEX IF NOT EXISTS idx_tradies_category ON public.tradies(category);

ALTER TABLE public.tradies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org tradies"
  ON public.tradies FOR SELECT
  USING (org_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Users can insert own org tradies"
  ON public.tradies FOR INSERT
  WITH CHECK (org_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Users can update own org tradies"
  ON public.tradies FOR UPDATE
  USING (org_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Users can delete own org tradies"
  ON public.tradies FOR DELETE
  USING (org_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE TRIGGER tradies_updated_at
  BEFORE UPDATE ON public.tradies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Service schedules: recurring housekeeping schedules
CREATE TABLE IF NOT EXISTS public.service_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  frequency text NOT NULL DEFAULT 'MONTHLY',
  provider_name text,
  estimated_cost numeric,
  start_date date NOT NULL,
  next_due_date date NOT NULL,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_schedules_org_id ON public.service_schedules(org_id);
CREATE INDEX IF NOT EXISTS idx_service_schedules_type ON public.service_schedules(service_type);
CREATE INDEX IF NOT EXISTS idx_service_schedules_next_due ON public.service_schedules(next_due_date);

ALTER TABLE public.service_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org service_schedules"
  ON public.service_schedules FOR SELECT
  USING (org_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Users can insert own org service_schedules"
  ON public.service_schedules FOR INSERT
  WITH CHECK (org_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Users can update own org service_schedules"
  ON public.service_schedules FOR UPDATE
  USING (org_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Users can delete own org service_schedules"
  ON public.service_schedules FOR DELETE
  USING (org_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE TRIGGER service_schedules_updated_at
  BEFORE UPDATE ON public.service_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
