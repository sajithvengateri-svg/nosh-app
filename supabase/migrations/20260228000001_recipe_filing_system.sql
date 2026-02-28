-- ============================================
-- RECIPE FILING SYSTEM — Archive, FTS, Photo Library
-- Run this in Supabase Dashboard SQL Editor
-- ============================================

-- ── A. Archive columns on ds_recipes ─────────────────────

ALTER TABLE ds_recipes
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_ds_recipes_is_archived
  ON ds_recipes(is_archived);

CREATE INDEX IF NOT EXISTS idx_ds_recipes_active_updated
  ON ds_recipes(is_archived, updated_at DESC)
  WHERE is_archived = false;

-- Update public read policy to exclude archived
DROP POLICY IF EXISTS "Public read" ON ds_recipes;
CREATE POLICY "Public read" ON ds_recipes
  FOR SELECT USING (is_published = true AND (is_archived = false OR is_archived IS NULL));

-- ── B. Full-text search ──────────────────────────────────

-- Denormalized ingredient names for FTS
ALTER TABLE ds_recipes
  ADD COLUMN IF NOT EXISTS ingredient_text TEXT DEFAULT '';

-- tsvector column + GIN index
ALTER TABLE ds_recipes
  ADD COLUMN IF NOT EXISTS fts tsvector;

CREATE INDEX IF NOT EXISTS idx_ds_recipes_fts
  ON ds_recipes USING GIN(fts);

-- Function to compute weighted tsvector
CREATE OR REPLACE FUNCTION ds_recipes_fts_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fts :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.cuisine, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.dietary_tags, ' '), '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.season_tags, ' '), '')), 'D') ||
    setweight(to_tsvector('english', COALESCE(NEW.ingredient_text, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update fts on recipe changes
DROP TRIGGER IF EXISTS ds_recipes_fts_trigger ON ds_recipes;
CREATE TRIGGER ds_recipes_fts_trigger
  BEFORE INSERT OR UPDATE OF title, description, cuisine, dietary_tags, season_tags, ingredient_text
  ON ds_recipes
  FOR EACH ROW EXECUTE FUNCTION ds_recipes_fts_update();

-- Sync ingredient names from ds_recipe_ingredients → ds_recipes.ingredient_text
CREATE OR REPLACE FUNCTION ds_sync_recipe_ingredient_text()
RETURNS TRIGGER AS $$
DECLARE
  rid UUID;
BEGIN
  rid := COALESCE(NEW.recipe_id, OLD.recipe_id);
  UPDATE ds_recipes
    SET ingredient_text = (
      SELECT COALESCE(string_agg(name, ' '), '')
      FROM ds_recipe_ingredients
      WHERE recipe_id = rid
    )
  WHERE id = rid;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ds_sync_ingredients_to_recipe ON ds_recipe_ingredients;
CREATE TRIGGER ds_sync_ingredients_to_recipe
  AFTER INSERT OR UPDATE OR DELETE ON ds_recipe_ingredients
  FOR EACH ROW EXECUTE FUNCTION ds_sync_recipe_ingredient_text();

-- Backfill ingredient_text for existing recipes
UPDATE ds_recipes r SET ingredient_text = (
  SELECT COALESCE(string_agg(name, ' '), '')
  FROM ds_recipe_ingredients
  WHERE recipe_id = r.id
);

-- Backfill fts for all existing rows
UPDATE ds_recipes SET fts =
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(cuisine, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(dietary_tags, ' '), '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(season_tags, ' '), '')), 'D') ||
  setweight(to_tsvector('english', COALESCE(ingredient_text, '')), 'D');

-- ── C. Photo library table ───────────────────────────────

CREATE TABLE IF NOT EXISTS ds_recipe_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  recipe_id UUID REFERENCES ds_recipes(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  caption TEXT,
  size_bytes INTEGER,
  uploaded_by UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ds_recipe_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access" ON ds_recipe_photos;
CREATE POLICY "Admin full access" ON ds_recipe_photos
  FOR ALL USING (ds_is_admin()) WITH CHECK (ds_is_admin());

CREATE INDEX IF NOT EXISTS idx_ds_recipe_photos_recipe
  ON ds_recipe_photos(recipe_id);
CREATE INDEX IF NOT EXISTS idx_ds_recipe_photos_tags
  ON ds_recipe_photos USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_ds_recipe_photos_created
  ON ds_recipe_photos(created_at DESC);

-- ── D. Storage bucket ────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('recipe-photos', 'recipe-photos', true, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: allow admin uploads
CREATE POLICY "Admin upload recipe photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'recipe-photos' AND ds_is_admin()
  );

CREATE POLICY "Admin delete recipe photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'recipe-photos' AND ds_is_admin()
  );

CREATE POLICY "Public read recipe photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'recipe-photos'
  );
