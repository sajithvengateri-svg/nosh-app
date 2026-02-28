-- ============================================================================
-- REPAIR: Re-run gamification schema creation
-- The original migration 20260226000000 was marked as applied but the tables
-- were not actually created. This migration re-creates them safely.
-- ============================================================================

-- 0. Add country to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'AU';

-- 1. game_daily_unlocks
CREATE TABLE IF NOT EXISTS public.game_daily_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unlock_date DATE NOT NULL DEFAULT CURRENT_DATE,
  temps_logged BOOLEAN DEFAULT false,
  prep_done BOOLEAN DEFAULT false,
  wastage_checked BOOLEAN DEFAULT false,
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id, unlock_date)
);

ALTER TABLE public.game_daily_unlocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own game unlocks" ON public.game_daily_unlocks;
CREATE POLICY "Users can view their own game unlocks"
  ON public.game_daily_unlocks FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert game unlocks for their org" ON public.game_daily_unlocks;
CREATE POLICY "Users can insert game unlocks for their org"
  ON public.game_daily_unlocks FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT om.org_id FROM org_memberships om WHERE om.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own game unlocks" ON public.game_daily_unlocks;
CREATE POLICY "Users can update their own game unlocks"
  ON public.game_daily_unlocks FOR UPDATE
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_game_daily_unlocks_lookup
  ON public.game_daily_unlocks(user_id, unlock_date);

-- 2. game_profiles
CREATE TABLE IF NOT EXISTS public.game_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  display_name TEXT,
  xp_total INTEGER NOT NULL DEFAULT 0,
  league TEXT NOT NULL DEFAULT 'scullery' CHECK (league IN ('scullery', 'pro')),
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_compliance_date DATE,
  level_title TEXT NOT NULL DEFAULT 'Scullery Hand',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.game_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view game profiles in their org" ON public.game_profiles;
CREATE POLICY "Users can view game profiles in their org"
  ON public.game_profiles FOR SELECT
  USING (
    org_id IN (
      SELECT om.org_id FROM org_memberships om WHERE om.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view all game profiles for leaderboard" ON public.game_profiles;
CREATE POLICY "Users can view all game profiles for leaderboard"
  ON public.game_profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own game profile" ON public.game_profiles;
CREATE POLICY "Users can insert their own game profile"
  ON public.game_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own game profile" ON public.game_profiles;
CREATE POLICY "Users can update their own game profile"
  ON public.game_profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_game_profiles_org_xp
  ON public.game_profiles(org_id, xp_total DESC);

CREATE OR REPLACE FUNCTION update_game_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_game_profiles_updated_at ON public.game_profiles;
CREATE TRIGGER trg_game_profiles_updated_at
  BEFORE UPDATE ON public.game_profiles
  FOR EACH ROW EXECUTE FUNCTION update_game_profiles_updated_at();

-- 3. game_scores
CREATE TABLE IF NOT EXISTS public.game_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  game_key TEXT NOT NULL CHECK (game_key IN ('gauntlet', 'edge', 'onion_blitz', 'alley_cat')),
  score INTEGER NOT NULL,
  grade TEXT,
  meta JSONB DEFAULT '{}',
  league TEXT NOT NULL DEFAULT 'scullery',
  tournament_month TEXT,
  played_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view scores in their org" ON public.game_scores;
CREATE POLICY "Users can view scores in their org"
  ON public.game_scores FOR SELECT
  USING (
    org_id IN (
      SELECT om.org_id FROM org_memberships om WHERE om.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view all scores for global leaderboard" ON public.game_scores;
CREATE POLICY "Users can view all scores for global leaderboard"
  ON public.game_scores FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own scores" ON public.game_scores;
CREATE POLICY "Users can insert their own scores"
  ON public.game_scores FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_game_scores_leaderboard
  ON public.game_scores(game_key, tournament_month, league, score DESC);

CREATE INDEX IF NOT EXISTS idx_game_scores_org
  ON public.game_scores(org_id, game_key, played_at DESC);

CREATE INDEX IF NOT EXISTS idx_game_scores_user
  ON public.game_scores(user_id, game_key, played_at DESC);

-- 4. game_tournaments
CREATE TABLE IF NOT EXISTS public.game_tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month_key TEXT NOT NULL UNIQUE,
  games JSONB NOT NULL DEFAULT '["gauntlet", "edge"]',
  prize_1st TEXT,
  prize_2nd TEXT,
  prize_3rd TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.game_tournaments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view tournaments" ON public.game_tournaments;
CREATE POLICY "Anyone can view tournaments"
  ON public.game_tournaments FOR SELECT
  USING (true);

-- 5. game_achievements
CREATE TABLE IF NOT EXISTS public.game_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

ALTER TABLE public.game_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view achievements in their org" ON public.game_achievements;
CREATE POLICY "Users can view achievements in their org"
  ON public.game_achievements FOR SELECT
  USING (
    org_id IN (
      SELECT om.org_id FROM org_memberships om WHERE om.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own achievements" ON public.game_achievements;
CREATE POLICY "Users can insert their own achievements"
  ON public.game_achievements FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_game_achievements_user
  ON public.game_achievements(user_id);

-- 6. Release "games" module
INSERT INTO public.feature_releases (module_slug, module_name, status, released_at)
SELECT 'games', 'Mastery Suite', 'released', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.feature_releases WHERE module_slug = 'games'
);
