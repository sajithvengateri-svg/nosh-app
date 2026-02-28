
-- ═══════════════════════════════════════════════════
-- QUIET AUDIT — Phase 1: Database Schema Extensions
-- ═══════════════════════════════════════════════════

-- 1. Audit Intake Sessions (External questionnaire progress)
CREATE TABLE public.audit_intake_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations(id),
  created_by UUID NOT NULL,
  venue_name TEXT NOT NULL DEFAULT '',
  venue_type TEXT NOT NULL DEFAULT 'casual_dining',
  seats INTEGER,
  trading_days INTEGER,
  services TEXT,
  years_operating TEXT,
  answers JSONB NOT NULL DEFAULT '{}',
  completion_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  scored_at TIMESTAMPTZ,
  audit_score_id UUID REFERENCES public.audit_scores(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_intake_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own intake sessions"
  ON public.audit_intake_sessions FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create own intake sessions"
  ON public.audit_intake_sessions FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own intake sessions"
  ON public.audit_intake_sessions FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own intake sessions"
  ON public.audit_intake_sessions FOR DELETE
  USING (auth.uid() = created_by);

CREATE TRIGGER update_audit_intake_sessions_updated_at
  BEFORE UPDATE ON public.audit_intake_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Audit Uploaded Documents
CREATE TABLE public.audit_uploaded_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.audit_intake_sessions(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  document_type TEXT NOT NULL DEFAULT 'OTHER',
  extraction_status TEXT NOT NULL DEFAULT 'PENDING',
  extracted_data JSONB,
  confidence_score NUMERIC(3,2),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_uploaded_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own uploaded documents"
  ON public.audit_uploaded_documents FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create own uploaded documents"
  ON public.audit_uploaded_documents FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own uploaded documents"
  ON public.audit_uploaded_documents FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own uploaded documents"
  ON public.audit_uploaded_documents FOR DELETE
  USING (auth.uid() = created_by);

CREATE TRIGGER update_audit_uploaded_documents_updated_at
  BEFORE UPDATE ON public.audit_uploaded_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Audit Sub Scores (granular per-module breakdown)
CREATE TABLE public.audit_sub_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_score_id UUID NOT NULL REFERENCES public.audit_scores(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  sub_score_name TEXT NOT NULL,
  score NUMERIC(5,2) NOT NULL DEFAULT 0,
  value TEXT,
  target TEXT,
  weight NUMERIC(4,3) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'FAIR',
  recommendation JSONB,
  data_source TEXT DEFAULT 'INTERNAL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_sub_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sub scores via org membership"
  ON public.audit_sub_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.audit_scores a
      WHERE a.id = audit_sub_scores.audit_score_id
        AND public.is_org_member(auth.uid(), a.org_id)
    )
  );

CREATE POLICY "Users can insert sub scores via org membership"
  ON public.audit_sub_scores FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.audit_scores a
      WHERE a.id = audit_sub_scores.audit_score_id
        AND public.is_org_member(auth.uid(), a.org_id)
    )
  );

CREATE INDEX idx_audit_sub_scores_audit_score_id ON public.audit_sub_scores(audit_score_id);
CREATE INDEX idx_audit_intake_sessions_created_by ON public.audit_intake_sessions(created_by);

-- 4. Storage bucket for audit documents (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('audit-documents', 'audit-documents', false);

-- Storage policies for audit-documents bucket
CREATE POLICY "Users can upload audit documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'audit-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own audit documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'audit-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own audit documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'audit-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
