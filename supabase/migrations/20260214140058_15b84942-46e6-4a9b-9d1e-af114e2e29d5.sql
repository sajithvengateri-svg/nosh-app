-- Fix: Head chefs should only manage posts within their own org
DROP POLICY IF EXISTS "Head chefs can manage all posts" ON public.team_posts;
CREATE POLICY "Head chefs can manage own org posts"
ON public.team_posts
FOR ALL
USING (
  is_head_chef(auth.uid()) 
  AND org_id IN (SELECT get_user_org_ids(auth.uid()))
)
WITH CHECK (
  is_head_chef(auth.uid()) 
  AND org_id IN (SELECT get_user_org_ids(auth.uid()))
);

-- Fix: post_comments - scope view to own org posts only (already done via subquery)
-- Fix: head chef comment management should be org-scoped
DROP POLICY IF EXISTS "Head chefs can manage all comments" ON public.post_comments;
CREATE POLICY "Head chefs can manage own org comments"
ON public.post_comments
FOR ALL
USING (
  is_head_chef(auth.uid())
  AND post_id IN (
    SELECT id FROM public.team_posts 
    WHERE org_id IN (SELECT get_user_org_ids(auth.uid()))
  )
);

-- Fix: post_reactions - scope insert to own org posts
DROP POLICY IF EXISTS "Authenticated users can react" ON public.post_reactions;
CREATE POLICY "Users can react to own org posts"
ON public.post_reactions
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND post_id IN (
    SELECT id FROM public.team_posts
    WHERE org_id IN (SELECT get_user_org_ids(auth.uid()))
  )
);

-- Fix: post_comments insert - scope to own org
DROP POLICY IF EXISTS "Authenticated users can comment" ON public.post_comments;
CREATE POLICY "Users can comment on own org posts"
ON public.post_comments
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND post_id IN (
    SELECT id FROM public.team_posts
    WHERE org_id IN (SELECT get_user_org_ids(auth.uid()))
  )
);