-- Drop the overly permissive policy that allows marketplace view users to see all supplier data
DROP POLICY IF EXISTS "Users with view permission can view suppliers" ON public.suppliers;

-- Suppliers table should only be accessible by head chefs and users with food-safety edit permission
-- The existing policies "Head chefs can view suppliers" and "Head chefs can manage suppliers" already handle this correctly