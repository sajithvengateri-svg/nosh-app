-- ============================================================
-- Companion Profiles — AI cooking companion for HomeChef
-- ============================================================

-- 1. companion_profiles — one per user, stores identity + progressive personalization
CREATE TABLE IF NOT EXISTS public.companion_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Companion identity
  companion_name TEXT NOT NULL DEFAULT 'Buddy',
  avatar_key TEXT NOT NULL DEFAULT 'robot_chef_01',
  personality TEXT NOT NULL DEFAULT 'friendly'
    CHECK (personality IN ('friendly', 'witty', 'calm', 'energetic')),

  -- User cooking profile (populated progressively)
  preferences JSONB NOT NULL DEFAULT '{
    "skill_level": null,
    "cuisine_interests": [],
    "dietary_restrictions": [],
    "favorite_ingredients": [],
    "disliked_ingredients": [],
    "cooking_goals": [],
    "household_size": null,
    "household_allergies": [],
    "kitchen_equipment": [],
    "time_preference": null,
    "budget_preference": null,
    "spice_tolerance": null
  }'::jsonb,

  -- Interaction memory (summarised, not raw chat logs)
  memory JSONB NOT NULL DEFAULT '{
    "successful_recipes": [],
    "failed_attempts": [],
    "learned_techniques": [],
    "conversation_topics": [],
    "last_interaction_summary": null,
    "interaction_count": 0,
    "tips_given": 0
  }'::jsonb,

  -- Region context (denormalised for fast system-prompt building)
  region TEXT NOT NULL DEFAULT 'au',
  locale TEXT NOT NULL DEFAULT 'en-AU',
  units TEXT NOT NULL DEFAULT 'metric',
  currency TEXT NOT NULL DEFAULT 'AUD',

  -- Voice settings
  voice_enabled BOOLEAN NOT NULL DEFAULT false,
  voice_provider TEXT DEFAULT NULL CHECK (voice_provider IN ('elevenlabs', 'vapi')),

  -- Feature flag
  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.companion_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own companion profile"
  ON public.companion_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own companion profile"
  ON public.companion_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own companion profile"
  ON public.companion_profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE INDEX idx_companion_profiles_user ON public.companion_profiles(user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_companion_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_companion_profiles_updated_at
  BEFORE UPDATE ON public.companion_profiles
  FOR EACH ROW EXECUTE FUNCTION update_companion_profiles_updated_at();


-- 2. companion_conversations — session summaries (NOT raw messages)
CREATE TABLE IF NOT EXISTS public.companion_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  companion_profile_id UUID NOT NULL REFERENCES companion_profiles(id) ON DELETE CASCADE,

  topic TEXT,
  summary TEXT,
  message_count INTEGER NOT NULL DEFAULT 0,
  preferences_extracted JSONB DEFAULT '{}',

  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

ALTER TABLE public.companion_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON public.companion_conversations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own conversations"
  ON public.companion_conversations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own conversations"
  ON public.companion_conversations FOR UPDATE
  USING (user_id = auth.uid());

CREATE INDEX idx_companion_conversations_user
  ON public.companion_conversations(user_id, started_at DESC);


-- 3. companion_feedback — thumbs up/down on responses
CREATE TABLE IF NOT EXISTS public.companion_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES companion_conversations(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating IN (-1, 1)),
  message_index INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.companion_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback"
  ON public.companion_feedback FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own feedback"
  ON public.companion_feedback FOR SELECT
  USING (user_id = auth.uid());
