
-- Tighten INSERT policies
DROP POLICY "System can insert price history" ON public.ingredient_price_history;
CREATE POLICY "Authenticated users can insert price history"
  ON public.ingredient_price_history FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY "Authenticated users can create invoice scans" ON public.invoice_scans;
CREATE POLICY "Authenticated users can create invoice scans"
  ON public.invoice_scans FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
