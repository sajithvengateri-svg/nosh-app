
-- Test run results persistence
CREATE TABLE public.test_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID,
  run_type TEXT NOT NULL DEFAULT 'manual',
  run_label TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  total_tests INTEGER NOT NULL DEFAULT 0,
  passed INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  skipped INTEGER NOT NULL DEFAULT 0,
  results JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB,
  run_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.test_runs ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins full access on test_runs"
  ON public.test_runs FOR ALL
  USING (public.is_admin(auth.uid()));

-- Org members can view their org's test runs
CREATE POLICY "Org members can view test_runs"
  ON public.test_runs FOR SELECT
  USING (org_id IS NULL OR public.is_org_member(auth.uid(), org_id));
