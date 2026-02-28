-- Phase 1A: Add signup_source to signup_events
ALTER TABLE public.signup_events ADD COLUMN IF NOT EXISTS signup_source text;

-- Phase 1B: Create site_pages table (for T&Cs, Privacy)
CREATE TABLE IF NOT EXISTS public.site_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT '',
  body_html text NOT NULL DEFAULT '',
  body_text text NOT NULL DEFAULT '',
  is_published boolean NOT NULL DEFAULT true,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published site pages" ON public.site_pages FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage site pages" ON public.site_pages FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_permissions WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_permissions WHERE user_id = auth.uid()));

CREATE TRIGGER update_site_pages_updated_at BEFORE UPDATE ON public.site_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Phase 1H: Create gcc_chefos_landing_sections table
CREATE TABLE IF NOT EXISTS public.gcc_chefos_landing_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  is_visible boolean NOT NULL DEFAULT true,
  content jsonb DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gcc_chefos_landing_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read gcc chefos landing sections" ON public.gcc_chefos_landing_sections FOR SELECT USING (true);
CREATE POLICY "Admins can manage gcc chefos landing sections" ON public.gcc_chefos_landing_sections FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_permissions WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_permissions WHERE user_id = auth.uid()));

CREATE TRIGGER update_gcc_chefos_landing_sections_updated_at BEFORE UPDATE ON public.gcc_chefos_landing_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Phase 1G: Update help_articles RLS for anonymous FAQ access
DROP POLICY IF EXISTS "Authenticated users can read published help articles" ON public.help_articles;
DO $$ BEGIN
  CREATE POLICY "Anyone can read published help articles" ON public.help_articles FOR SELECT USING (is_published = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Phase 1J: Update handle_new_signup_event trigger to capture signup_source + auto-send welcome email
CREATE OR REPLACE FUNCTION public.handle_new_signup_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ref_code text;
  user_full_name text;
  v_store_mode text;
  v_signup_source text;
  v_org_name text;
  v_ref_code text;
  v_supabase_url text := 'https://gmvfjgkzbpjimmzxcniv.supabase.co';
  v_service_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtdmZqZ2t6YnBqaW1tenhjbml2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg4NzU5OCwiZXhwIjoyMDg3NDYzNTk4fQ.P0sTFCAqs3HHsQDfmx0O2liFGTHW-XZM3XkPyrOO2ro';
BEGIN
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  ref_code := upper(substring(replace(user_full_name, ' ', ''), 1, 4)) || substring(NEW.id::text, 1, 4);
  v_store_mode := NEW.raw_user_meta_data->>'store_mode';
  v_signup_source := NEW.raw_user_meta_data->>'signup_source';
  v_org_name := NEW.raw_user_meta_data->>'org_name';

  INSERT INTO public.referral_codes (user_id, code)
  VALUES (NEW.id, ref_code)
  ON CONFLICT (code) DO UPDATE SET code = ref_code || substring(gen_random_uuid()::text, 1, 3);

  SELECT code INTO v_ref_code FROM public.referral_codes WHERE user_id = NEW.id;

  INSERT INTO public.signup_events (user_id, user_name, user_email, store_mode, signup_source)
  VALUES (NEW.id, user_full_name, NEW.email, v_store_mode, v_signup_source);

  -- Auto-send welcome email via edge function
  PERFORM net.http_post(
    url := v_supabase_url || '/functions/v1/send-welcome-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body := jsonb_build_object(
      'userId', NEW.id::text,
      'email', NEW.email,
      'name', user_full_name,
      'orgName', COALESCE(v_org_name, ''),
      'referralCode', COALESCE(v_ref_code, ''),
      'signupSource', COALESCE(v_signup_source, 'chefos')
    )
  );

  RETURN NEW;
END;
$$;
