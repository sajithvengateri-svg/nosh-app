
-- Stage 1: staff_certifications table
CREATE TABLE public.staff_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  cert_type text NOT NULL,
  cert_number text,
  issuing_state text,
  issue_date date,
  expiry_date date,
  file_url text,
  status text NOT NULL DEFAULT 'missing',
  verified_by uuid,
  verified_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view certs" ON public.staff_certifications
  FOR SELECT USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "Org members can insert certs" ON public.staff_certifications
  FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "Org members can update certs" ON public.staff_certifications
  FOR UPDATE USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "Org members can delete certs" ON public.staff_certifications
  FOR DELETE USING (public.is_org_member(auth.uid(), org_id));

CREATE TRIGGER update_staff_certifications_updated_at
  BEFORE UPDATE ON public.staff_certifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Stage 1: training_completions table
CREATE TABLE public.training_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  user_id uuid,
  training_type text NOT NULL,
  sections_completed jsonb NOT NULL DEFAULT '[]'::jsonb,
  quiz_score integer,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.training_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can insert training" ON public.training_completions
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Anon can insert training" ON public.training_completions
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Org members can view training" ON public.training_completions
  FOR SELECT USING (public.is_org_member(auth.uid(), org_id));

-- Stage 1: certification-files storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('certification-files', 'certification-files', false);

CREATE POLICY "Org members can upload cert files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'certification-files' AND auth.role() = 'authenticated');
CREATE POLICY "Org members can view cert files" ON storage.objects
  FOR SELECT USING (bucket_id = 'certification-files' AND auth.role() = 'authenticated');
CREATE POLICY "Org members can update cert files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'certification-files' AND auth.role() = 'authenticated');
CREATE POLICY "Org members can delete cert files" ON storage.objects
  FOR DELETE USING (bucket_id = 'certification-files' AND auth.role() = 'authenticated');
