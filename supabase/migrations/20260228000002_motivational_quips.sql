-- Motivational quips for cook mode glass bubbles
-- Admin-managed, pushed periodically during cooking sessions

CREATE TABLE ds_cook_quips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  emoji TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE ds_cook_quips ENABLE ROW LEVEL SECURITY;

-- Public read for active quips
CREATE POLICY "ds_cook_quips_public_read" ON ds_cook_quips
  FOR SELECT USING (is_active = true);

-- Admin full access
CREATE POLICY "ds_cook_quips_admin_all" ON ds_cook_quips
  FOR ALL USING (ds_is_admin());

-- Seed default quips
INSERT INTO ds_cook_quips (text, emoji) VALUES
  ('Going well!', '👌'),
  ('Nice one, chef!', '👨‍🍳'),
  ('Looking great!', '✨'),
  ('Let''s go!', '🔥'),
  ('You''re killing it!', '💪'),
  ('Smells amazing!', '😋'),
  ('Keep it up!', '🌟'),
  ('Nearly there!', '🎉'),
  ('Pro move!', '⭐'),
  ('That''s the way!', '👏'),
  ('Nailed it!', '🎯'),
  ('Chef''s kiss!', '💋');
