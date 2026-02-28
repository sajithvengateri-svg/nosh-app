-- ============================================
-- RECIPE PIPELINE — Migration (safe / idempotent)
-- Run this in Supabase Dashboard SQL Editor
-- ============================================

-- ── A. New columns on existing tables ──────────────────────

ALTER TABLE ds_recipes
  ADD COLUMN IF NOT EXISTS pipeline_status TEXT DEFAULT 'live';

-- Add CHECK constraint only if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ds_recipes_pipeline_status_check'
  ) THEN
    ALTER TABLE ds_recipes
      ADD CONSTRAINT ds_recipes_pipeline_status_check
      CHECK (pipeline_status IN ('submitted', 'extracted', 'cards_ready', 'review', 'approved', 'live'));
  END IF;
END $$;

ALTER TABLE ds_user_profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

ALTER TABLE ds_recipe_workflow_cards
  ADD COLUMN IF NOT EXISTS card_type TEXT,
  ADD COLUMN IF NOT EXISTS heat_level INTEGER,
  ADD COLUMN IF NOT EXISTS technique_icon TEXT,
  ADD COLUMN IF NOT EXISTS ingredients_used JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS pro_tip TEXT;

-- Add CHECK constraints separately to avoid conflicts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ds_recipe_workflow_cards_card_type_check'
  ) THEN
    ALTER TABLE ds_recipe_workflow_cards
      ADD CONSTRAINT ds_recipe_workflow_cards_card_type_check
      CHECK (card_type IN ('prep', 'technique', 'simmer', 'finish', 'serve'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ds_recipe_workflow_cards_heat_level_check'
  ) THEN
    ALTER TABLE ds_recipe_workflow_cards
      ADD CONSTRAINT ds_recipe_workflow_cards_heat_level_check
      CHECK (heat_level BETWEEN 0 AND 3);
  END IF;
END $$;

-- ── B. Upload tracking table ───────────────────────────────

CREATE TABLE IF NOT EXISTS ds_recipe_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES ds_recipes(id) ON DELETE SET NULL,
  upload_type TEXT NOT NULL CHECK (upload_type IN ('text', 'pdf', 'image', 'url', 'manual')),
  file_url TEXT,
  source_url TEXT,
  raw_text TEXT,
  extracted_json JSONB,
  ai_model_used TEXT,
  ai_tokens_used INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ds_recipe_uploads ENABLE ROW LEVEL SECURITY;

-- ── C. Admin helper function ───────────────────────────────

CREATE OR REPLACE FUNCTION ds_is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM ds_user_profiles WHERE id = auth.uid()),
    false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── D. Admin RLS policies (drop-then-create to be safe) ────

DO $$
BEGIN
  -- ds_recipes
  DROP POLICY IF EXISTS "Admin full access" ON ds_recipes;
  CREATE POLICY "Admin full access" ON ds_recipes
    FOR ALL USING (ds_is_admin()) WITH CHECK (ds_is_admin());

  -- ds_recipe_ingredients
  DROP POLICY IF EXISTS "Admin full access" ON ds_recipe_ingredients;
  CREATE POLICY "Admin full access" ON ds_recipe_ingredients
    FOR ALL USING (ds_is_admin()) WITH CHECK (ds_is_admin());

  -- ds_recipe_workflow_cards
  DROP POLICY IF EXISTS "Admin full access" ON ds_recipe_workflow_cards;
  CREATE POLICY "Admin full access" ON ds_recipe_workflow_cards
    FOR ALL USING (ds_is_admin()) WITH CHECK (ds_is_admin());

  -- ds_recipe_uploads
  DROP POLICY IF EXISTS "Admin full access" ON ds_recipe_uploads;
  CREATE POLICY "Admin full access" ON ds_recipe_uploads
    FOR ALL USING (ds_is_admin()) WITH CHECK (ds_is_admin());

  -- ds_chefs
  DROP POLICY IF EXISTS "Admin full access" ON ds_chefs;
  CREATE POLICY "Admin full access" ON ds_chefs
    FOR ALL USING (ds_is_admin()) WITH CHECK (ds_is_admin());
END $$;

-- ── E. Indexes ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_ds_recipes_pipeline_status ON ds_recipes(pipeline_status);
CREATE INDEX IF NOT EXISTS idx_ds_recipe_uploads_status ON ds_recipe_uploads(status);
CREATE INDEX IF NOT EXISTS idx_ds_recipe_uploads_recipe ON ds_recipe_uploads(recipe_id);

-- ── F. Updated_at trigger for uploads ──────────────────────

DROP TRIGGER IF EXISTS ds_recipe_uploads_updated_at ON ds_recipe_uploads;
CREATE TRIGGER ds_recipe_uploads_updated_at
  BEFORE UPDATE ON ds_recipe_uploads
  FOR EACH ROW EXECUTE FUNCTION ds_set_updated_at();
