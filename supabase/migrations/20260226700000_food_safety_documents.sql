-- ============================================================
-- Food Safety Documents — venue food safety folder
-- ============================================================

CREATE TABLE IF NOT EXISTS public.food_safety_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other'
    CHECK (category IN ('certificate', 'manual', 'self_audit', 'report', 'other')),
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size_bytes BIGINT,
  notes TEXT,
  uploaded_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.food_safety_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org food safety docs"
  ON public.food_safety_documents FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM public.org_memberships
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Users can insert food safety docs"
  ON public.food_safety_documents FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM public.org_memberships
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Users can update own org food safety docs"
  ON public.food_safety_documents FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM public.org_memberships
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Users can delete own org food safety docs"
  ON public.food_safety_documents FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM public.org_memberships
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE INDEX idx_food_safety_documents_org ON public.food_safety_documents(org_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_food_safety_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_food_safety_documents_updated_at
  BEFORE UPDATE ON public.food_safety_documents
  FOR EACH ROW EXECUTE FUNCTION update_food_safety_documents_updated_at();
