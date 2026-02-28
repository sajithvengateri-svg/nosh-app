-- ============================================
-- NOSH: Personality Workflows + Social Cooking
-- Migration 003
-- ============================================

-- ============================================
-- SECTION A: PERSONALITY (Phase 2 — used NOW)
-- ============================================

-- Relax recipe time constraint for weekend project cooks (OCD Planner needs 60+ min)
ALTER TABLE ds_recipes DROP CONSTRAINT IF EXISTS ds_recipes_total_time_minutes_check;
ALTER TABLE ds_recipes ADD CONSTRAINT ds_recipes_total_time_minutes_check
  CHECK (total_time_minutes BETWEEN 1 AND 180);

-- Personality tags on recipes (JSONB — eligibility per personality type)
ALTER TABLE ds_recipes
  ADD COLUMN IF NOT EXISTS personality_tags JSONB DEFAULT '{}';

-- Add personality field to user profiles
ALTER TABLE ds_user_profiles
  ADD COLUMN IF NOT EXISTS primary_personality TEXT
    CHECK (primary_personality IN ('humpday_nosher', 'weekend_warrior', 'thrill_seeker', 'ocd_planner'));

-- User personality profile (AI-determined over time)
CREATE TABLE ds_user_personality (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE UNIQUE,

  -- Self-reported (onboarding)
  initial_selection TEXT,

  -- AI-determined (behavioural)
  primary_type TEXT,
  primary_weight DECIMAL(3,2) DEFAULT 0,
  secondary_type TEXT,
  secondary_weight DECIMAL(3,2) DEFAULT 0,
  tertiary_type TEXT,
  tertiary_weight DECIMAL(3,2) DEFAULT 0,

  -- Context overrides
  weekday_mode TEXT,
  weekend_mode TEXT,
  emergency_mode TEXT DEFAULT 'thrill_seeker',
  special_occasion_mode TEXT DEFAULT 'ocd_planner',

  -- Derived recipe constraints
  max_cook_time_weekday INTEGER,
  max_cook_time_weekend INTEGER,
  max_steps INTEGER,
  max_ingredients INTEGER,
  preferred_style TEXT CHECK (preferred_style IN ('sprint', 'run', 'jog', 'spread')),

  -- Nudge state
  nudge_direction TEXT,
  nudges_sent INTEGER DEFAULT 0,
  nudges_accepted INTEGER DEFAULT 0,
  nudges_declined INTEGER DEFAULT 0,
  last_nudge_at TIMESTAMPTZ,
  nudge_paused BOOLEAN DEFAULT false,

  -- Confidence
  profile_confidence DECIMAL(3,2) DEFAULT 0,
  signals_counted INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Personality signal log (for pattern detection + future ML)
CREATE TABLE ds_personality_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL,
  signal_value TEXT NOT NULL,
  personality_indicator TEXT,
  signal_weight DECIMAL(3,2),
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- Personality achievements / gamification
CREATE TABLE ds_personality_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  personality_type TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

-- ============================================
-- SECTION B: SOCIAL COOKING (Phase 3 — tables now, UI later)
-- ============================================

-- Social cooking events (Sunday Roast, Party Mode, Dutch Nosh)
CREATE TABLE ds_social_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('sunday_roast', 'party', 'dutch_nosh')),
  title TEXT NOT NULL,
  occasion TEXT,
  date_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  expected_guests INTEGER,
  kids_count INTEGER DEFAULT 0,
  dietary_requirements JSONB DEFAULT '[]',
  cuisine TEXT,
  vibe TEXT,
  budget_per_head DECIMAL(6,2),
  menu_selected JSONB,
  boss_user_id UUID,
  ai_decides BOOLEAN DEFAULT false,
  public_url TEXT UNIQUE,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'voting', 'locked', 'shopping', 'cooking', 'done', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Event guests (both Nosh users and non-users)
CREATE TABLE ds_social_event_guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES ds_social_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES ds_user_profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  is_nosh_user BOOLEAN DEFAULT false,
  rsvp_status TEXT DEFAULT 'invited' CHECK (rsvp_status IN ('invited', 'confirmed', 'declined', 'maybe')),
  dietary_requirements TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sunday Roast: votes from household/guests
CREATE TABLE ds_social_event_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES ds_social_events(id) ON DELETE CASCADE,
  voter_user_id UUID REFERENCES ds_user_profiles(id),
  voter_name TEXT,
  vote_category TEXT NOT NULL,
  vote_value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Dutch Nosh: dish assignments
CREATE TABLE ds_social_event_dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES ds_social_events(id) ON DELETE CASCADE,
  dish_category TEXT NOT NULL,
  dish_name TEXT NOT NULL,
  recipe_id UUID REFERENCES ds_recipes(id),
  recipe_data JSONB,
  assigned_to_user_id UUID REFERENCES ds_user_profiles(id),
  assigned_to_name TEXT,
  shopping_list JSONB,
  prep_timeline JSONB,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'claimed', 'prepping', 'ready', 'dropped')),
  check_in_48h BOOLEAN DEFAULT false,
  check_in_day_of BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Party Mode: cooking role assignments
CREATE TABLE ds_social_event_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES ds_social_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES ds_user_profiles(id),
  person_name TEXT NOT NULL,
  role_name TEXT NOT NULL,
  tasks JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Personality tables: own data only
ALTER TABLE ds_user_personality ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own personality" ON ds_user_personality FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE ds_personality_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own signals" ON ds_personality_signals FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE ds_personality_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own achievements" ON ds_personality_achievements FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Social events: host + guests can read, host can write
ALTER TABLE ds_social_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Host manages events" ON ds_social_events FOR ALL
  USING (host_user_id = auth.uid()) WITH CHECK (host_user_id = auth.uid());
CREATE POLICY "Guests view events" ON ds_social_events FOR SELECT
  USING (id IN (SELECT event_id FROM ds_social_event_guests WHERE user_id = auth.uid()));

ALTER TABLE ds_social_event_guests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Host manages guests" ON ds_social_event_guests FOR ALL
  USING (event_id IN (SELECT id FROM ds_social_events WHERE host_user_id = auth.uid()))
  WITH CHECK (event_id IN (SELECT id FROM ds_social_events WHERE host_user_id = auth.uid()));
CREATE POLICY "Guests view own record" ON ds_social_event_guests FOR SELECT
  USING (user_id = auth.uid());

ALTER TABLE ds_social_event_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Voters manage own votes" ON ds_social_event_votes FOR ALL
  USING (voter_user_id = auth.uid()) WITH CHECK (voter_user_id = auth.uid());
CREATE POLICY "Host views all votes" ON ds_social_event_votes FOR SELECT
  USING (event_id IN (SELECT id FROM ds_social_events WHERE host_user_id = auth.uid()));

ALTER TABLE ds_social_event_dishes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Host manages dishes" ON ds_social_event_dishes FOR ALL
  USING (event_id IN (SELECT id FROM ds_social_events WHERE host_user_id = auth.uid()))
  WITH CHECK (event_id IN (SELECT id FROM ds_social_events WHERE host_user_id = auth.uid()));
CREATE POLICY "Assigned user views dish" ON ds_social_event_dishes FOR SELECT
  USING (assigned_to_user_id = auth.uid());
CREATE POLICY "Claim open dishes" ON ds_social_event_dishes FOR UPDATE
  USING (status = 'open') WITH CHECK (assigned_to_user_id = auth.uid());

ALTER TABLE ds_social_event_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Host manages roles" ON ds_social_event_roles FOR ALL
  USING (event_id IN (SELECT id FROM ds_social_events WHERE host_user_id = auth.uid()))
  WITH CHECK (event_id IN (SELECT id FROM ds_social_events WHERE host_user_id = auth.uid()));
CREATE POLICY "Assigned user views role" ON ds_social_event_roles FOR SELECT
  USING (user_id = auth.uid());

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_user_personality_user ON ds_user_personality(user_id);
CREATE INDEX idx_personality_signals_user ON ds_personality_signals(user_id);
CREATE INDEX idx_personality_signals_type ON ds_personality_signals(user_id, signal_type);
CREATE INDEX idx_personality_achievements_user ON ds_personality_achievements(user_id);

CREATE INDEX idx_social_events_host ON ds_social_events(host_user_id);
CREATE INDEX idx_social_events_date ON ds_social_events(date_time);
CREATE INDEX idx_social_event_guests_event ON ds_social_event_guests(event_id);
CREATE INDEX idx_social_event_guests_user ON ds_social_event_guests(user_id);
CREATE INDEX idx_social_event_votes_event ON ds_social_event_votes(event_id);
CREATE INDEX idx_social_event_dishes_event ON ds_social_event_dishes(event_id);
CREATE INDEX idx_social_event_roles_event ON ds_social_event_roles(event_id);
