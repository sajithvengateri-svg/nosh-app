-- Nudge configuration table for admin-controlled nudge content
CREATE TABLE ds_nudge_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  pill_text TEXT,
  voice_prompt TEXT,
  icon_name TEXT NOT NULL,
  variant TEXT NOT NULL DEFAULT 'bubble' CHECK (variant IN ('bubble', 'pill')),
  pastel_color TEXT DEFAULT '#E8F5E9',
  enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  modes TEXT[] DEFAULT '{voice,text,more}',
  cam_relevant BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ds_nudge_config ENABLE ROW LEVEL SECURITY;

-- Everyone can read nudge config
CREATE POLICY "Public read" ON ds_nudge_config FOR SELECT USING (true);

-- Authenticated users can write (dev-access gated in app)
CREATE POLICY "Authenticated write" ON ds_nudge_config FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Seed with default nudges
INSERT INTO ds_nudge_config (key, label, pill_text, voice_prompt, icon_name, variant, pastel_color, modes, cam_relevant, sort_order) VALUES
  ('kitchen', 'Kitchen', 'Open your kitchen', 'say: open kitchen', 'House', 'pill', '#E8F5E9', '{voice,text,more}', false, 1),
  ('bar', 'Bar', 'Check your bar', 'say: open bar', 'Martini', 'pill', '#FCE4EC', '{voice,text,more}', false, 2),
  ('shopping_list', 'Shopping', 'Start shopping', 'say: go shopping', 'ShoppingCart', 'pill', '#E3F2FD', '{voice,text,more}', false, 3),
  ('my_recipes', 'Recipes', 'Try a recipe', 'say: show recipes', 'UtensilsCrossed', 'pill', '#FFF3E0', '{voice,text,more}', false, 4),
  ('meal_plan', 'Plan', 'Plan your week', 'say: open plan', 'CalendarDays', 'pill', '#F3E5F5', '{voice,text,more}', false, 5),
  ('cellar', 'Cellar', 'Explore wines', 'say: open cellar', 'Wine', 'bubble', '#E8EAF6', '{voice,text,more}', false, 6),
  ('vendors', 'Vendors', 'Find deals', 'say: show vendors', 'Tag', 'bubble', '#EFEBE9', '{voice,text,more}', false, 7),
  ('nosh_dna', 'DNA', 'Your DNA', 'say: my DNA', 'Dna', 'bubble', '#E0F2F1', '{voice,text,more}', false, 8),
  ('nosh_run', 'Nosh Run', 'Cook something', 'say: start run', 'ChefHat', 'bubble', '#FFF8E1', '{voice,text,more}', true, 9),
  ('social_cooking', 'Social', 'Social nosh', 'say: social', 'Users', 'bubble', '#FCE4EC', '{voice,text,more}', false, 10);
