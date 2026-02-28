
-- Storage retention settings per org
CREATE TABLE public.org_storage_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  bucket_name TEXT NOT NULL,
  retention_days INTEGER NOT NULL DEFAULT 30,
  auto_delete_after_parse BOOLEAN NOT NULL DEFAULT true,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, bucket_name)
);

ALTER TABLE public.org_storage_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view storage settings"
  ON public.org_storage_settings FOR SELECT
  USING (org_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Head chefs can manage storage settings"
  ON public.org_storage_settings FOR ALL
  USING (is_org_head_chef(auth.uid(), org_id))
  WITH CHECK (is_org_head_chef(auth.uid(), org_id));

-- Seed default settings for each org on creation (trigger)
CREATE OR REPLACE FUNCTION public.seed_storage_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.org_storage_settings (org_id, bucket_name, retention_days, auto_delete_after_parse) VALUES
    (NEW.id, 'invoices', 0, true),
    (NEW.id, 'audit-documents', 0, true),
    (NEW.id, 'clock-photos', 30, false),
    (NEW.id, 'cleaning-photos', 90, false),
    (NEW.id, 'recipe-images', -1, false),
    (NEW.id, 'employee-documents', -1, false),
    (NEW.id, 'floor-layouts', -1, false);
  RETURN NEW;
END;
$$;

CREATE TRIGGER seed_org_storage_settings
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_storage_settings();

-- Add updated_at trigger
CREATE TRIGGER update_org_storage_settings_updated_at
  BEFORE UPDATE ON public.org_storage_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed for existing orgs
INSERT INTO public.org_storage_settings (org_id, bucket_name, retention_days, auto_delete_after_parse)
SELECT o.id, b.bucket_name, b.retention_days, b.auto_delete_after_parse
FROM public.organizations o
CROSS JOIN (VALUES
  ('invoices', 0, true),
  ('audit-documents', 0, true),
  ('clock-photos', 30, false),
  ('cleaning-photos', 90, false),
  ('recipe-images', -1, false),
  ('employee-documents', -1, false),
  ('floor-layouts', -1, false)
) AS b(bucket_name, retention_days, auto_delete_after_parse)
ON CONFLICT (org_id, bucket_name) DO NOTHING;
