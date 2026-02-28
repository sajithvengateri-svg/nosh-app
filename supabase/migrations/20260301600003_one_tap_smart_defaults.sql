-- Phase 6a: One-Tap Flow + Smart Defaults Tracking
-- Adds metadata columns to nosh runs and a log table for smart defaults application

ALTER TABLE ds_nosh_runs
  ADD COLUMN IF NOT EXISTS was_one_tap BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS smart_defaults_applied BOOLEAN DEFAULT false;

-- Log table for smart defaults application (Sprint 6b analytics)
CREATE TABLE IF NOT EXISTS ds_smart_defaults_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES ds_recipes(id),
  categories_applied INTEGER DEFAULT 0,
  user_adjusted BOOLEAN DEFAULT false,
  applied_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ds_smart_defaults_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own data" ON ds_smart_defaults_log FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
