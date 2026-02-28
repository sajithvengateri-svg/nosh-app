-- ============================================================================
-- Training Management System
-- Extends training_materials + training_records, adds notifications table,
-- storage bucket, and module limit RPC.
-- ============================================================================

-- ─── Extend training_materials with AI card data ────────────────────────────
ALTER TABLE public.training_materials
  ADD COLUMN IF NOT EXISTS cards jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS quiz jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS source_file_urls text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS processing_status text DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS card_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_minutes integer DEFAULT 0;

COMMENT ON COLUMN public.training_materials.cards IS 'AI-generated training cards: [{id, title, content, tips[], encouragement, order}]';
COMMENT ON COLUMN public.training_materials.quiz IS 'End-of-module quiz: [{id, question, options[], correct_index, explanation}]';
COMMENT ON COLUMN public.training_materials.processing_status IS 'draft | processing | ready | error';

-- ─── Extend training_records with card-level progress ───────────────────────
ALTER TABLE public.training_records
  ADD COLUMN IF NOT EXISTS cards_completed jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS last_card_index integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quiz_answers jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS quiz_score integer,
  ADD COLUMN IF NOT EXISTS quiz_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS started_at timestamptz DEFAULT now();

-- ─── Training notifications (admin CRM inbox) ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.training_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.training_notifications ENABLE ROW LEVEL SECURITY;

-- Org head chefs and owners see all notifications for their org
CREATE POLICY "Org members can view training notifications"
  ON public.training_notifications FOR SELECT
  USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- Authenticated users can insert (edge function creates these)
CREATE POLICY "Authenticated can insert training notifications"
  ON public.training_notifications FOR INSERT
  WITH CHECK (org_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- Mark-as-read update
CREATE POLICY "Org members can update training notifications"
  ON public.training_notifications FOR UPDATE
  USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE INDEX IF NOT EXISTS idx_training_notifications_org_unread
  ON public.training_notifications(org_id, created_at DESC)
  WHERE read_at IS NULL;

-- ─── Storage bucket for training file uploads ───────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('training-files', 'training-files', false)
ON CONFLICT DO NOTHING;

CREATE POLICY "Authenticated can upload training files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'training-files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated can read training files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'training-files' AND auth.role() = 'authenticated');

-- ─── Module creation limit by subscription tier ─────────────────────────────
CREATE OR REPLACE FUNCTION public.get_training_module_limit(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_tier text;
  v_count integer;
  v_limit integer;
BEGIN
  SELECT subscription_tier INTO v_tier
  FROM public.organizations WHERE id = p_org_id;

  SELECT count(*) INTO v_count
  FROM public.training_materials WHERE org_id = p_org_id;

  v_limit := CASE COALESCE(v_tier, 'free')
    WHEN 'free'    THEN 3
    WHEN 'starter' THEN 10
    WHEN 'premium' THEN 25
    WHEN 'pro'     THEN 999
    ELSE 5
  END;

  RETURN jsonb_build_object(
    'tier', COALESCE(v_tier, 'free'),
    'current_count', v_count,
    'max_modules', v_limit,
    'can_create', v_count < v_limit
  );
END;
$$;
