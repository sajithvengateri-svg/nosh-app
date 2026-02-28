-- ============================================================
-- RECIPE LIFECYCLE — Full lifecycle tracking & features
-- ============================================================

-- A. Feedback columns on ds_cook_log
ALTER TABLE ds_cook_log
  ADD COLUMN IF NOT EXISTS difficulty_assessment TEXT
    CHECK (difficulty_assessment IN ('easier','as_expected','harder')),
  ADD COLUMN IF NOT EXISTS feedback_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_planned_cook BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS cooking_day_bypass BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS meal_plan_date DATE;

-- B. Feed tracking columns on ds_feed_impressions
ALTER TABLE ds_feed_impressions
  ADD COLUMN IF NOT EXISTS swipe_direction TEXT
    CHECK (swipe_direction IN ('left','right')),
  ADD COLUMN IF NOT EXISTS time_on_card_ms INTEGER;

-- C. Recipe page view tracking
CREATE TABLE IF NOT EXISTS ds_recipe_page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES ds_recipes(id) ON DELETE CASCADE,
  time_on_page_ms INTEGER,
  scroll_depth_pct INTEGER CHECK (scroll_depth_pct BETWEEN 0 AND 100),
  sections_viewed TEXT[] DEFAULT '{}',
  cta_tapped TEXT,
  ingredients_viewed BOOLEAN DEFAULT false,
  vendor_matches_shown INTEGER DEFAULT 0,
  entered_from TEXT DEFAULT 'feed',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ds_recipe_page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ds_recipe_page_views_own" ON ds_recipe_page_views
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_ds_recipe_page_views_user
  ON ds_recipe_page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_ds_recipe_page_views_recipe
  ON ds_recipe_page_views(recipe_id);

-- D. Video guide support on workflow cards
ALTER TABLE ds_recipe_workflow_cards
  ADD COLUMN IF NOT EXISTS video_url TEXT;

-- E. Video views tracking
CREATE TABLE IF NOT EXISTS ds_video_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  workflow_card_id UUID NOT NULL REFERENCES ds_recipe_workflow_cards(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES ds_recipes(id) ON DELETE CASCADE,
  watched_seconds INTEGER DEFAULT 0,
  total_seconds INTEGER,
  completed BOOLEAN DEFAULT false,
  watched_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ds_video_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ds_video_views_own" ON ds_video_views
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "ds_video_views_admin_read" ON ds_video_views
  FOR SELECT USING (ds_is_admin());

CREATE INDEX IF NOT EXISTS idx_ds_video_views_user
  ON ds_video_views(user_id);
CREATE INDEX IF NOT EXISTS idx_ds_video_views_card
  ON ds_video_views(workflow_card_id);
CREATE INDEX IF NOT EXISTS idx_ds_video_views_recipe
  ON ds_video_views(recipe_id);

-- F. Recipe cooldowns (recycling algorithm)
CREATE TABLE IF NOT EXISTS ds_recipe_cooldowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES ds_recipes(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('dismissed','cooked','favourited')),
  rating INTEGER,
  cooldown_until DATE NOT NULL,
  recycled_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

ALTER TABLE ds_recipe_cooldowns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ds_recipe_cooldowns_own" ON ds_recipe_cooldowns
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ds_recipe_cooldowns_user
  ON ds_recipe_cooldowns(user_id);
CREATE INDEX IF NOT EXISTS idx_ds_recipe_cooldowns_until
  ON ds_recipe_cooldowns(user_id, cooldown_until);

-- G. Storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('cook-log-photos', 'cook-log-photos', true, 10485760)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('recipe-videos', 'recipe-videos', true, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for cook-log-photos
CREATE POLICY "cook_log_photos_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'cook-log-photos' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "cook_log_photos_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'cook-log-photos');

CREATE POLICY "cook_log_photos_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'cook-log-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policies for recipe-videos
CREATE POLICY "recipe_videos_admin_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'recipe-videos' AND ds_is_admin()
  );

CREATE POLICY "recipe_videos_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'recipe-videos');

CREATE POLICY "recipe_videos_admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'recipe-videos' AND ds_is_admin()
  );

-- H. Ingredient demand view (admin heatmap)
CREATE OR REPLACE VIEW ds_ingredient_demand AS
SELECT
  ri.name AS ingredient_name,
  ri.supermarket_section,
  date_trunc('week', cl.cooked_at) AS week,
  COUNT(*) AS cook_count
FROM ds_cook_log cl
JOIN ds_recipe_ingredients ri ON ri.recipe_id = cl.recipe_id
WHERE cl.cooked_at IS NOT NULL
GROUP BY ri.name, ri.supermarket_section, date_trunc('week', cl.cooked_at);
