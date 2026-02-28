
-- Add onboarding fields to organizations
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS team_size_estimate integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS role_structure text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamp with time zone DEFAULT NULL;
