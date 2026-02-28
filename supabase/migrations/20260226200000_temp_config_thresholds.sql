-- Extend temp_check_config with custom threshold overrides and input method
ALTER TABLE public.temp_check_config
  ADD COLUMN IF NOT EXISTS custom_pass_min NUMERIC,
  ADD COLUMN IF NOT EXISTS custom_pass_max NUMERIC,
  ADD COLUMN IF NOT EXISTS custom_warn_min NUMERIC,
  ADD COLUMN IF NOT EXISTS custom_warn_max NUMERIC,
  ADD COLUMN IF NOT EXISTS input_method TEXT DEFAULT 'any'
    CHECK (input_method IN ('any', 'manual', 'camera', 'webhook')),
  ADD COLUMN IF NOT EXISTS webhook_endpoint TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT;
