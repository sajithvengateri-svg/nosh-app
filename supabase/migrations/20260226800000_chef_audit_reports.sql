-- Chef pre-service audit reports
CREATE TABLE IF NOT EXISTS public.chef_audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  audit_date DATE NOT NULL,
  service_period TEXT NOT NULL DEFAULT 'dinner',
  trigger_type TEXT NOT NULL DEFAULT 'manual',
  readiness_score INTEGER NOT NULL DEFAULT 0,
  critical_issues JSONB NOT NULL DEFAULT '[]',
  warnings JSONB NOT NULL DEFAULT '[]',
  all_clear JSONB NOT NULL DEFAULT '[]',
  recommended_actions JSONB NOT NULL DEFAULT '[]',
  raw_context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, audit_date, service_period, trigger_type)
);

ALTER TABLE public.chef_audit_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org audit reports"
  ON public.chef_audit_reports FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM public.org_memberships
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Service role can insert audit reports"
  ON public.chef_audit_reports FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update audit reports"
  ON public.chef_audit_reports FOR UPDATE
  USING (true);

CREATE INDEX idx_chef_audit_reports_org_date ON public.chef_audit_reports(org_id, audit_date DESC);
