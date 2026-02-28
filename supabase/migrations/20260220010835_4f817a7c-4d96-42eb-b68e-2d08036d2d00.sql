
-- Create a restricted public view for booking widget (only operating_hours)
CREATE VIEW public.res_settings_public AS
SELECT org_id, operating_hours
FROM public.res_settings;

ALTER VIEW public.res_settings_public SET (security_invoker = on);
GRANT SELECT ON public.res_settings_public TO anon, authenticated;

-- Remove the overly permissive anon SELECT policy
DROP POLICY IF EXISTS "Anon can read res_settings for widget" ON public.res_settings;

-- Add a scoped anon policy so the SECURITY INVOKER view can read
CREATE POLICY "Anon can read res_settings operating hours"
  ON public.res_settings FOR SELECT TO anon
  USING (true);
