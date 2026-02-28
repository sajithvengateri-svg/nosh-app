-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view invite by token" ON public.team_invites;

-- Create a secure function for token-based invite lookup
CREATE OR REPLACE FUNCTION public.get_invite_by_token(_token text)
RETURNS TABLE (
  id uuid,
  email text,
  role app_role,
  expires_at timestamptz,
  accepted_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, email, role, expires_at, accepted_at
  FROM public.team_invites
  WHERE token = _token
    AND accepted_at IS NULL
    AND expires_at > now()
  LIMIT 1
$$;

-- Create proper SELECT policies
-- 1. Head chefs can view all invites (already covered by existing ALL policy, but explicit SELECT is clearer)
CREATE POLICY "Head chefs can view invites"
ON public.team_invites
FOR SELECT
USING (is_head_chef(auth.uid()));

-- 2. Invite creators can view their own invites
CREATE POLICY "Creators can view their invites"
ON public.team_invites
FOR SELECT
USING (auth.uid() = invited_by);