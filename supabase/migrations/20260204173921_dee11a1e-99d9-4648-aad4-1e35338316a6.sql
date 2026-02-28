-- Drop the overly permissive SELECT policy on profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create proper SELECT policies that restrict access
-- 1. Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- 2. Head chefs can view all profiles for staff management
CREATE POLICY "Head chefs can view all profiles"
ON public.profiles
FOR SELECT
USING (is_head_chef(auth.uid()));

-- 3. Users with team view permission can view profiles
CREATE POLICY "Users with team permission can view profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM module_permissions
    WHERE module_permissions.user_id = auth.uid()
    AND module_permissions.module = 'team'
    AND module_permissions.can_view = true
  )
);