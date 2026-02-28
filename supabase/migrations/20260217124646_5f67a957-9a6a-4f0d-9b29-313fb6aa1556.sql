
-- ============================================================
-- People OS tables (inside LabourOS)
-- ============================================================

-- 1. Recruitment Positions
CREATE TABLE public.recruitment_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  title TEXT NOT NULL,
  section TEXT NOT NULL DEFAULT 'KITCHEN',
  classification TEXT,
  employment_type TEXT NOT NULL DEFAULT 'FULL_TIME',
  description TEXT,
  requirements TEXT,
  wage_range_min NUMERIC,
  wage_range_max NUMERIC,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  posted_at TIMESTAMPTZ,
  closes_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recruitment_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage positions" ON public.recruitment_positions FOR ALL USING (public.is_org_member(auth.uid(), org_id));

-- 2. Recruitment Applicants
CREATE TABLE public.recruitment_applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  position_id UUID REFERENCES public.recruitment_positions(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  resume_url TEXT,
  cover_letter TEXT,
  source TEXT NOT NULL DEFAULT 'DIRECT',
  status TEXT NOT NULL DEFAULT 'NEW',
  ai_score INTEGER,
  ai_summary TEXT,
  interview_notes JSONB DEFAULT '[]'::jsonb,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recruitment_applicants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage applicants" ON public.recruitment_applicants FOR ALL USING (public.is_org_member(auth.uid(), org_id));

-- 3. Recruitment Interviews
CREATE TABLE public.recruitment_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  applicant_id UUID NOT NULL REFERENCES public.recruitment_applicants(id) ON DELETE CASCADE,
  interview_type TEXT NOT NULL DEFAULT 'IN_PERSON',
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 30,
  interviewer_id UUID,
  score INTEGER,
  scoring_notes JSONB,
  outcome TEXT NOT NULL DEFAULT 'PENDING',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recruitment_interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage interviews" ON public.recruitment_interviews FOR ALL USING (public.is_org_member(auth.uid(), org_id));

-- 4. Onboarding Checklists
CREATE TABLE public.onboarding_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  checklist_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  data JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage checklists" ON public.onboarding_checklists FOR ALL USING (public.is_org_member(auth.uid(), org_id));

-- 5. Employee Documents
CREATE TABLE public.employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'OTHER',
  name TEXT NOT NULL,
  file_url TEXT,
  expires_at TIMESTAMPTZ,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage documents" ON public.employee_documents FOR ALL USING (public.is_org_member(auth.uid(), org_id));

-- 6. Performance Reviews
CREATE TABLE public.performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  review_type TEXT NOT NULL DEFAULT 'ANNUAL',
  reviewer_id UUID,
  period_start DATE,
  period_end DATE,
  scores JSONB DEFAULT '{}'::jsonb,
  overall_score NUMERIC,
  comments TEXT,
  employee_comments TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  review_date DATE,
  next_review_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage reviews" ON public.performance_reviews FOR ALL USING (public.is_org_member(auth.uid(), org_id));

-- 7. Employee Warnings
CREATE TABLE public.employee_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  warning_type TEXT NOT NULL DEFAULT 'VERBAL',
  reason TEXT NOT NULL,
  details TEXT,
  issued_by UUID,
  witness_id UUID,
  employee_response TEXT,
  document_url TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_warnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage warnings" ON public.employee_warnings FOR ALL USING (public.is_org_member(auth.uid(), org_id));

-- 8. Employee Milestones
CREATE TABLE public.employee_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  milestone_type TEXT NOT NULL DEFAULT 'ANNIVERSARY',
  milestone_date DATE NOT NULL,
  description TEXT,
  is_acknowledged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage milestones" ON public.employee_milestones FOR ALL USING (public.is_org_member(auth.uid(), org_id));

-- Triggers for updated_at
CREATE TRIGGER update_recruitment_positions_updated_at BEFORE UPDATE ON public.recruitment_positions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_recruitment_applicants_updated_at BEFORE UPDATE ON public.recruitment_applicants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_onboarding_checklists_updated_at BEFORE UPDATE ON public.onboarding_checklists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_performance_reviews_updated_at BEFORE UPDATE ON public.performance_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for employee documents
INSERT INTO storage.buckets (id, name, public) VALUES ('employee-documents', 'employee-documents', false) ON CONFLICT DO NOTHING;

CREATE POLICY "Org members can upload employee docs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'employee-documents' AND auth.role() = 'authenticated');
CREATE POLICY "Org members can view employee docs" ON storage.objects FOR SELECT USING (bucket_id = 'employee-documents' AND auth.role() = 'authenticated');
