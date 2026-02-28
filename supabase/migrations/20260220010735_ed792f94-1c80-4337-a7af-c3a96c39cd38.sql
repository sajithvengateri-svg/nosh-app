
-- Add a restricted anon SELECT policy that only allows reading active codes
-- The view already filters to only code + is_active columns, 
-- but we need the underlying table to allow anon SELECT for the view to work
CREATE POLICY "Anon can look up active referral codes"
  ON public.referral_codes FOR SELECT TO anon
  USING (is_active = true);
