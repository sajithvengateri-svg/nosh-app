-- Add is_public column to recipes table if it doesn't exist
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;

-- Enable realtime for recipes table
ALTER PUBLICATION supabase_realtime ADD TABLE public.recipes;

-- Drop existing "Anyone can view recipes" policy and create a more restrictive one for vendors
DROP POLICY IF EXISTS "Anyone can view recipes" ON public.recipes;

-- Create policy for authenticated users to view all recipes (ChefOS)
CREATE POLICY "Authenticated users can view all recipes" 
ON public.recipes FOR SELECT 
TO authenticated
USING (true);

-- Create policy for public/anon access to only public recipes (VendorOS)
CREATE POLICY "Anyone can view public recipes" 
ON public.recipes FOR SELECT 
TO anon
USING (is_public = true);