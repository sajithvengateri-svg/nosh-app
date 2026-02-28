-- Allow authenticated chefs to view demand insights in Marketplace
CREATE POLICY "Authenticated users can view demand insights"
ON public.demand_insights
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Update vendor policy to allow real-time access (remove 7-day delay for now)
DROP POLICY IF EXISTS "Approved vendors can view demand insights" ON public.demand_insights;

CREATE POLICY "Approved vendors can view demand insights"
ON public.demand_insights
FOR SELECT
USING (is_vendor(auth.uid()));