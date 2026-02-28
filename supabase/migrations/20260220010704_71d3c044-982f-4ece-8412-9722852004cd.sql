
-- Create a public view for referral code lookups that hides user_id
CREATE VIEW public.referral_codes_public AS
SELECT code, is_active
FROM public.referral_codes
WHERE is_active = true;

-- Grant anon/authenticated access to the view
GRANT SELECT ON public.referral_codes_public TO anon, authenticated;

-- Remove the overly permissive public SELECT policy from the table
DROP POLICY IF EXISTS "Anyone can look up active codes" ON public.referral_codes;
