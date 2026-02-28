
-- Fix: Replace the overly permissive INSERT policy with a properly scoped one
DROP POLICY "System can insert alerts" ON public.food_safety_alerts;

CREATE POLICY "Org members can insert alerts"
  ON public.food_safety_alerts FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (SELECT public.get_user_org_ids(auth.uid()))
  );
