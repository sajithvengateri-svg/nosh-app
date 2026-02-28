-- Fix: Remove overly permissive recipe SELECT policy that leaks recipes across orgs
DROP POLICY IF EXISTS "Authenticated users can view all recipes" ON public.recipes;