-- Drop the overly permissive SELECT policy on suppliers
DROP POLICY IF EXISTS "Anyone can view suppliers" ON public.suppliers;

-- Create a proper SELECT policy that restricts access to head chefs and users with view permission
CREATE POLICY "Head chefs can view suppliers"
ON public.suppliers
FOR SELECT
USING (is_head_chef(auth.uid()));

CREATE POLICY "Users with view permission can view suppliers"
ON public.suppliers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM module_permissions
    WHERE module_permissions.user_id = auth.uid()
    AND module_permissions.module = 'marketplace'
    AND module_permissions.can_view = true
  )
);