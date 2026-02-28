-- Receiving settings: per-category temperature benchmarks for incoming goods
CREATE TABLE IF NOT EXISTS public.receiving_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  product_category text NOT NULL,
  temp_min numeric,
  temp_max numeric,
  requires_temp_check boolean NOT NULL DEFAULT true,
  ai_quality_check_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, product_category)
);

ALTER TABLE public.receiving_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org receiving settings"
  ON public.receiving_settings FOR SELECT
  USING (org_id IN (
    SELECT (raw_user_meta_data->>'org_id')::uuid
    FROM auth.users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can manage org receiving settings"
  ON public.receiving_settings FOR ALL
  USING (org_id IN (
    SELECT (raw_user_meta_data->>'org_id')::uuid
    FROM auth.users WHERE id = auth.uid()
  ));

-- Extend daily_compliance_logs with structured receiving columns
ALTER TABLE public.daily_compliance_logs
  ADD COLUMN IF NOT EXISTS supplier_id uuid,
  ADD COLUMN IF NOT EXISTS product_category text,
  ADD COLUMN IF NOT EXISTS corrective_action_type text,
  ADD COLUMN IF NOT EXISTS ai_quality_result jsonb,
  ADD COLUMN IF NOT EXISTS invoice_url text;

-- Add check constraint for corrective_action_type
ALTER TABLE public.daily_compliance_logs
  ADD CONSTRAINT chk_corrective_action_type
  CHECK (corrective_action_type IS NULL OR corrective_action_type IN ('received', 'send_back', 'credit'));
