
-- Add columns to feature_releases
ALTER TABLE public.feature_releases 
  ADD COLUMN IF NOT EXISTS scheduled_release_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS version_tag TEXT;

-- Create user_seen_releases table
CREATE TABLE IF NOT EXISTS public.user_seen_releases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  release_id UUID NOT NULL REFERENCES public.feature_releases(id) ON DELETE CASCADE,
  seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, release_id)
);

-- Enable RLS
ALTER TABLE public.user_seen_releases ENABLE ROW LEVEL SECURITY;

-- Users can see their own seen records
CREATE POLICY "Users can view own seen releases"
  ON public.user_seen_releases FOR SELECT
  USING (auth.uid() = user_id);

-- Users can mark releases as seen
CREATE POLICY "Users can insert own seen releases"
  ON public.user_seen_releases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_user_seen_releases_user ON public.user_seen_releases(user_id);
CREATE INDEX idx_feature_releases_scheduled ON public.feature_releases(scheduled_release_at) WHERE status != 'released' AND scheduled_release_at IS NOT NULL;
