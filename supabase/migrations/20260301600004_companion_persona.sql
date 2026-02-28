-- Add persona column to companion_profiles
ALTER TABLE public.companion_profiles
  ADD COLUMN IF NOT EXISTS persona TEXT NOT NULL DEFAULT 'normal'
  CHECK (persona IN ('normal', 'sommelier', 'mixologist', 'kick_back'));
