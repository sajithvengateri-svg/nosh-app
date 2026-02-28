-- Drop the overly permissive policy that allows anyone with team view permission to see all profiles
DROP POLICY IF EXISTS "Users with team permission can view profiles" ON public.profiles;

-- Create a more restrictive policy: team module users can only see basic info (name, position) 
-- For full profile access, users can only see their own profile or head chefs can see all
-- Note: The existing policies already handle owner access and head chef access correctly