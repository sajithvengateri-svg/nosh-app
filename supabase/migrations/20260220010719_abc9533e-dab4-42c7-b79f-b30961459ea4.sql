
-- Fix: Make the view use SECURITY INVOKER instead of SECURITY DEFINER
ALTER VIEW public.referral_codes_public SET (security_invoker = on);
