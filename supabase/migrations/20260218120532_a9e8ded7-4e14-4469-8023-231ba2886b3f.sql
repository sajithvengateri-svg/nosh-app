
-- =============================================
-- MoneyOS Data Pipeline: Phase 1 Migration
-- 4 new tables + ecosystem sync triggers + RLS
-- =============================================

-- 1. data_connections: tracks external system integrations per org
CREATE TABLE public.data_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- xero, square, lightspeed, deputy, tanda, email, manual
  category TEXT NOT NULL, -- pos, labour, accounting, overhead, reservations
  status TEXT NOT NULL DEFAULT 'pending_auth', -- active, paused, error, pending_auth
  config JSONB DEFAULT '{}'::jsonb,
  last_sync_at TIMESTAMPTZ,
  sync_frequency TEXT NOT NULL DEFAULT 'daily', -- realtime, hourly, daily, manual
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.data_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view data connections"
  ON public.data_connections FOR SELECT
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org owners can manage data connections"
  ON public.data_connections FOR INSERT
  WITH CHECK (public.is_org_owner(auth.uid(), org_id));

CREATE POLICY "Org owners can update data connections"
  ON public.data_connections FOR UPDATE
  USING (public.is_org_owner(auth.uid(), org_id));

CREATE POLICY "Org owners can delete data connections"
  ON public.data_connections FOR DELETE
  USING (public.is_org_owner(auth.uid(), org_id));

CREATE TRIGGER update_data_connections_updated_at
  BEFORE UPDATE ON public.data_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. data_imports: every chunk of external data received
CREATE TABLE public.data_imports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES public.data_connections(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL DEFAULT 'manual', -- direct, api, email, manual
  data_type TEXT NOT NULL, -- revenue, food_cost, bev_cost, labour, overhead, covers, food_waste, bev_waste
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'received', -- received, processed, error, duplicate
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.data_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view data imports"
  ON public.data_imports FOR SELECT
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can insert data imports"
  ON public.data_imports FOR INSERT
  WITH CHECK (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org owners can update data imports"
  ON public.data_imports FOR UPDATE
  USING (public.is_org_owner(auth.uid(), org_id));

CREATE POLICY "Org owners can delete data imports"
  ON public.data_imports FOR DELETE
  USING (public.is_org_owner(auth.uid(), org_id));

CREATE INDEX idx_data_imports_org_period ON public.data_imports (org_id, period_start, period_end);
CREATE INDEX idx_data_imports_type ON public.data_imports (org_id, data_type, status);

-- 3. email_ingestion_log: audit trail for parsed emails
CREATE TABLE public.email_ingestion_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email_from TEXT,
  email_subject TEXT,
  raw_body TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  extracted_data JSONB DEFAULT '{}'::jsonb,
  confidence NUMERIC DEFAULT 0,
  routed_to TEXT, -- overhead_entries, data_imports, manual_review
  status TEXT NOT NULL DEFAULT 'received', -- received, parsed, routed, failed, needs_review
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_ingestion_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view email logs"
  ON public.email_ingestion_log FOR SELECT
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Service can insert email logs"
  ON public.email_ingestion_log FOR INSERT
  WITH CHECK (public.is_org_member(auth.uid(), org_id));

CREATE INDEX idx_email_log_org ON public.email_ingestion_log (org_id, status);

-- 4. ecosystem_sync_log: data freshness per module per org
CREATE TABLE public.ecosystem_sync_log (
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  module TEXT NOT NULL, -- chefos, bevos, restos, labouros, overheados, reservationos, clockos, supplyos, growthos
  source_type TEXT NOT NULL DEFAULT 'direct', -- direct, api, email
  last_data_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  record_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'live', -- live, stale, disconnected
  PRIMARY KEY (org_id, module)
);

ALTER TABLE public.ecosystem_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view ecosystem sync"
  ON public.ecosystem_sync_log FOR SELECT
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can upsert ecosystem sync"
  ON public.ecosystem_sync_log FOR INSERT
  WITH CHECK (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can update ecosystem sync"
  ON public.ecosystem_sync_log FOR UPDATE
  USING (public.is_org_member(auth.uid(), org_id));

-- =============================================
-- Ecosystem sync trigger function
-- =============================================
CREATE OR REPLACE FUNCTION public.update_ecosystem_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _module TEXT;
  _org_id UUID;
BEGIN
  _org_id := COALESCE(NEW.org_id, OLD.org_id);
  
  CASE TG_TABLE_NAME
    WHEN 'pos_payments' THEN _module := 'restos';
    WHEN 'ingredients' THEN _module := 'chefos';
    WHEN 'bev_products' THEN _module := 'bevos';
    WHEN 'overhead_entries' THEN _module := 'overheados';
    WHEN 'pos_shifts' THEN _module := 'labouros';
    WHEN 'res_reservations' THEN _module := 'reservationos';
    ELSE _module := TG_TABLE_NAME;
  END CASE;

  INSERT INTO public.ecosystem_sync_log (org_id, module, source_type, last_data_at, record_count, status)
  VALUES (_org_id, _module, 'direct', now(), 1, 'live')
  ON CONFLICT (org_id, module) DO UPDATE SET
    last_data_at = now(),
    record_count = ecosystem_sync_log.record_count + 1,
    status = 'live';

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Triggers on key operational tables
CREATE TRIGGER sync_ecosystem_pos_payments
  AFTER INSERT ON public.pos_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_ecosystem_sync();

CREATE TRIGGER sync_ecosystem_ingredients
  AFTER INSERT OR UPDATE ON public.ingredients
  FOR EACH ROW EXECUTE FUNCTION public.update_ecosystem_sync();

CREATE TRIGGER sync_ecosystem_bev_products
  AFTER INSERT OR UPDATE ON public.bev_products
  FOR EACH ROW EXECUTE FUNCTION public.update_ecosystem_sync();

CREATE TRIGGER sync_ecosystem_overhead_entries
  AFTER INSERT ON public.overhead_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_ecosystem_sync();

CREATE TRIGGER sync_ecosystem_pos_shifts
  AFTER INSERT OR UPDATE ON public.pos_shifts
  FOR EACH ROW EXECUTE FUNCTION public.update_ecosystem_sync();

CREATE TRIGGER sync_ecosystem_res_reservations
  AFTER INSERT OR UPDATE ON public.res_reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_ecosystem_sync();
