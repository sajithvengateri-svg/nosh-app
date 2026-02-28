-- Add member_status to org_memberships for tracking onboarding/active/departed
ALTER TABLE public.org_memberships 
ADD COLUMN member_status text NOT NULL DEFAULT 'active';

-- Add a comment for clarity
COMMENT ON COLUMN public.org_memberships.member_status IS 'onboarding | active | departed';

-- Backfill: all existing active members are "active", inactive ones are "departed"
UPDATE public.org_memberships SET member_status = 'departed' WHERE is_active = false;