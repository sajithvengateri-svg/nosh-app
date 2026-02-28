
-- Create org_email_settings table for per-org email provider configuration
CREATE TABLE public.org_email_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'resend' CHECK (provider IN ('resend', 'smtp')),
  smtp_host TEXT,
  smtp_port INTEGER DEFAULT 587,
  smtp_user TEXT,
  smtp_pass_encrypted TEXT,
  from_name TEXT,
  from_email TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT org_email_settings_org_id_key UNIQUE (org_id)
);

-- Enable RLS
ALTER TABLE public.org_email_settings ENABLE ROW LEVEL SECURITY;

-- Only org owners can read their own org's email settings
CREATE POLICY "Org owners can view email settings"
  ON public.org_email_settings FOR SELECT
  USING (public.is_org_owner(auth.uid(), org_id));

-- Only org owners can insert email settings
CREATE POLICY "Org owners can insert email settings"
  ON public.org_email_settings FOR INSERT
  WITH CHECK (public.is_org_owner(auth.uid(), org_id));

-- Only org owners can update email settings
CREATE POLICY "Org owners can update email settings"
  ON public.org_email_settings FOR UPDATE
  USING (public.is_org_owner(auth.uid(), org_id));

-- Only org owners can delete email settings
CREATE POLICY "Org owners can delete email settings"
  ON public.org_email_settings FOR DELETE
  USING (public.is_org_owner(auth.uid(), org_id));

-- Auto-update updated_at
CREATE TRIGGER update_org_email_settings_updated_at
  BEFORE UPDATE ON public.org_email_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
