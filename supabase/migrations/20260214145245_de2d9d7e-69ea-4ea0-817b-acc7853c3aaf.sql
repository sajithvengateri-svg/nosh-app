
-- Fix: Remove public recipe visibility from main recipe list to prevent cross-org leakage
-- Users should only see their own org's recipes in the recipe bank

-- Drop the permissive "Anyone can view public recipes" policy
DROP POLICY IF EXISTS "Anyone can view public recipes" ON public.recipes;

-- Update the main SELECT policy to only show own org recipes (admins see all)
DROP POLICY IF EXISTS "Users can view own org recipes" ON public.recipes;
CREATE POLICY "Users can view own org recipes"
ON public.recipes
FOR SELECT
USING (
  (org_id IN (SELECT get_user_org_ids(auth.uid())))
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Add a DELETE policy so head chefs can delete their own org's recipes
-- (covered by the ALL policy already, but let's ensure it's clear)
