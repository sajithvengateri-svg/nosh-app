-- ============================================================================
-- Comprehensive Food Safety Enhancement Migration
-- Creates: service_logs, maintenance_logs
-- Alters: ingredients, food_safety_logs, suppliers
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. service_logs — tracks all housekeeping service records
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  service_type text NOT NULL, -- hood_cleaning, grease_trap, oil_management, waste_disposal, tank_service, first_aid, general
  provider_name text,
  provider_contact text,
  provider_phone text,
  service_date date NOT NULL,
  next_due_date date,
  invoice_url text,
  pick_slip_url text,
  cost numeric,
  status text DEFAULT 'completed',
  logged_by uuid,
  logged_by_name text,
  signature_name text,
  metadata jsonb DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for service_logs
ALTER TABLE public.service_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view service logs for their org"
  ON public.service_logs FOR SELECT
  USING (
    org_id IN (
      SELECT om.org_id FROM org_memberships om WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert service logs for their org"
  ON public.service_logs FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT om.org_id FROM org_memberships om WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update service logs for their org"
  ON public.service_logs FOR UPDATE
  USING (
    org_id IN (
      SELECT om.org_id FROM org_memberships om WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete service logs for their org"
  ON public.service_logs FOR DELETE
  USING (
    org_id IN (
      SELECT om.org_id FROM org_memberships om WHERE om.user_id = auth.uid()
    )
  );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_service_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER service_logs_updated_at
  BEFORE UPDATE ON public.service_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_service_logs_updated_at();

-- Indexes
CREATE INDEX idx_service_logs_org_id ON public.service_logs(org_id);
CREATE INDEX idx_service_logs_service_type ON public.service_logs(service_type);
CREATE INDEX idx_service_logs_service_date ON public.service_logs(service_date);
CREATE INDEX idx_service_logs_next_due ON public.service_logs(next_due_date);

-- ---------------------------------------------------------------------------
-- 2. maintenance_logs — tracks equipment maintenance records
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.maintenance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  equipment_id uuid,
  equipment_name text NOT NULL,
  service_type text DEFAULT 'maintenance', -- maintenance, repair, calibration, inspection
  service_date date NOT NULL,
  provider text,
  invoice_url text,
  cost numeric,
  next_scheduled date,
  performed_by text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for maintenance_logs
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view maintenance logs for their org"
  ON public.maintenance_logs FOR SELECT
  USING (
    org_id IN (
      SELECT om.org_id FROM org_memberships om WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert maintenance logs for their org"
  ON public.maintenance_logs FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT om.org_id FROM org_memberships om WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update maintenance logs for their org"
  ON public.maintenance_logs FOR UPDATE
  USING (
    org_id IN (
      SELECT om.org_id FROM org_memberships om WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete maintenance logs for their org"
  ON public.maintenance_logs FOR DELETE
  USING (
    org_id IN (
      SELECT om.org_id FROM org_memberships om WHERE om.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_maintenance_logs_org_id ON public.maintenance_logs(org_id);
CREATE INDEX idx_maintenance_logs_equipment ON public.maintenance_logs(equipment_id);
CREATE INDEX idx_maintenance_logs_date ON public.maintenance_logs(service_date);

-- ---------------------------------------------------------------------------
-- 3. ALTER existing tables — add new columns
-- ---------------------------------------------------------------------------

-- Ingredient variants (parent/child linking)
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS parent_ingredient_id uuid REFERENCES ingredients(id);
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS variant_name text;

-- Signature on food safety logs
ALTER TABLE food_safety_logs ADD COLUMN IF NOT EXISTS signature_name text;

-- Supplier enrichment fields
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS ordering_url text;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS delivery_days text[];
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS minimum_order numeric;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS payment_terms text;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS abn text;
