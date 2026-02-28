-- ============================================================================
-- Auto-accept terms for all existing users who haven't accepted yet.
-- The terms gate was freezing mobile browsers due to backdrop-blur over
-- the full rendered app. This migration bypasses the issue for existing
-- users. New signups will accept terms inline during onboarding.
-- ============================================================================

UPDATE public.profiles
SET accepted_terms_at = now()
WHERE accepted_terms_at IS NULL;
