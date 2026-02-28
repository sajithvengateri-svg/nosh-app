
-- Add org_id to team_posts for org-scoped isolation
ALTER TABLE public.team_posts ADD COLUMN org_id uuid REFERENCES public.organizations(id);

-- Backfill existing posts with the poster's primary org
UPDATE public.team_posts tp
SET org_id = (
  SELECT om.org_id FROM public.org_memberships om
  WHERE om.user_id = tp.user_id AND om.is_active = true
  ORDER BY om.joined_at ASC LIMIT 1
);

-- Drop the old overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view team posts" ON public.team_posts;

-- Create org-scoped SELECT: only org members can see posts
CREATE POLICY "Org members can view team posts"
ON public.team_posts
FOR SELECT
TO authenticated
USING (
  org_id IN (SELECT get_user_org_ids(auth.uid()))
);

-- Update INSERT policy to enforce org_id
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.team_posts;
CREATE POLICY "Authenticated users can create org posts"
ON public.team_posts
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND org_id IN (SELECT get_user_org_ids(auth.uid()))
);

-- Also scope post_comments and post_reactions SELECT to authenticated users only
DROP POLICY IF EXISTS "Anyone can view comments" ON public.post_comments;
CREATE POLICY "Authenticated users can view comments"
ON public.post_comments
FOR SELECT
TO authenticated
USING (
  post_id IN (
    SELECT id FROM public.team_posts
    WHERE org_id IN (SELECT get_user_org_ids(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Anyone can view reactions" ON public.post_reactions;
CREATE POLICY "Authenticated users can view reactions"
ON public.post_reactions
FOR SELECT
TO authenticated
USING (
  post_id IN (
    SELECT id FROM public.team_posts
    WHERE org_id IN (SELECT get_user_org_ids(auth.uid()))
  )
);
