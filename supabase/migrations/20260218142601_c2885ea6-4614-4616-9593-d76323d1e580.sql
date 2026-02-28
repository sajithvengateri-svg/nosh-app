
-- Widget config table
CREATE TABLE public.res_widget_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  org_slug text NOT NULL UNIQUE,
  primary_color text NOT NULL DEFAULT '#0f766e',
  logo_url text,
  venue_name text,
  welcome_message text,
  slot_interval_minutes integer NOT NULL DEFAULT 30,
  max_online_party_size integer NOT NULL DEFAULT 8,
  chat_agent_enabled boolean NOT NULL DEFAULT true,
  voice_agent_enabled boolean NOT NULL DEFAULT false,
  faq_answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.res_widget_config ENABLE ROW LEVEL SECURITY;

-- Public read for widget
CREATE POLICY "Anyone can read active widget config"
  ON public.res_widget_config FOR SELECT
  USING (is_active = true);

-- Org members can insert/update their own
CREATE POLICY "Org members can insert widget config"
  ON public.res_widget_config FOR INSERT
  WITH CHECK (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can update widget config"
  ON public.res_widget_config FOR UPDATE
  USING (public.is_org_member(auth.uid(), org_id));

-- Updated_at trigger
CREATE TRIGGER update_res_widget_config_updated_at
  BEFORE UPDATE ON public.res_widget_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Allow anon to insert reservations via widget (WEBSITE/VOICE_AI channels)
CREATE POLICY "Anon can insert website reservations"
  ON public.res_reservations FOR INSERT
  WITH CHECK (channel IN ('WEBSITE', 'VOICE_AI'));

-- Allow anon to read widget-relevant settings (operating hours)
CREATE POLICY "Anon can read res_settings for widget"
  ON public.res_settings FOR SELECT
  USING (true);

-- Allow anon to insert guests from widget
CREATE POLICY "Anon can insert guests from widget"
  ON public.res_guests FOR INSERT
  WITH CHECK (true);

-- Allow anon to search guests by phone/email for matching
CREATE POLICY "Anon can search guests by contact"
  ON public.res_guests FOR SELECT
  USING (true);
