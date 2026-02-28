-- Generic table for tracking user interest in upcoming features
-- Used by "Coming Soon" prompts (e.g. wireless thermometers, service providers)
CREATE TABLE IF NOT EXISTS public.feature_interest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid,
  feature_key text NOT NULL,
  expressed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, feature_key)
);

ALTER TABLE public.feature_interest ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own interest"
  ON public.feature_interest FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own interest"
  ON public.feature_interest FOR SELECT
  USING (user_id = auth.uid());
