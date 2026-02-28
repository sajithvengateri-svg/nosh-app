
-- 1. Add missing columns to res_function_proposals
ALTER TABLE public.res_function_proposals
  ADD COLUMN IF NOT EXISTS menu_template_id uuid,
  ADD COLUMN IF NOT EXISTS beverage_package_id uuid,
  ADD COLUMN IF NOT EXISTS client_name text,
  ADD COLUMN IF NOT EXISTS client_company text,
  ADD COLUMN IF NOT EXISTS client_email text,
  ADD COLUMN IF NOT EXISTS client_phone text,
  ADD COLUMN IF NOT EXISTS add_ons jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS deposit_percent numeric DEFAULT 50,
  ADD COLUMN IF NOT EXISTS balance_due_days_before integer DEFAULT 7,
  ADD COLUMN IF NOT EXISTS deposit_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hero_headline text,
  ADD COLUMN IF NOT EXISTS hero_subheadline text,
  ADD COLUMN IF NOT EXISTS venue_address text,
  ADD COLUMN IF NOT EXISTS venue_parking_notes text,
  ADD COLUMN IF NOT EXISTS invite_message text,
  ADD COLUMN IF NOT EXISTS runsheet jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sections_config jsonb DEFAULT '{}'::jsonb;

-- 2. Create res_proposal_media table
CREATE TABLE IF NOT EXISTS public.res_proposal_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.res_function_proposals(id) ON DELETE CASCADE,
  url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image',
  caption text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.res_proposal_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view proposal media"
  ON public.res_proposal_media FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM res_function_proposals p
    WHERE p.id = res_proposal_media.proposal_id
    AND is_org_member(auth.uid(), p.org_id)
  ));

CREATE POLICY "Org members can manage proposal media"
  ON public.res_proposal_media FOR ALL
  USING (EXISTS (
    SELECT 1 FROM res_function_proposals p
    WHERE p.id = res_proposal_media.proposal_id
    AND is_org_member(auth.uid(), p.org_id)
  ));

-- 3. Fix RLS: allow org members (not just owners) to manage proposals
DROP POLICY IF EXISTS "Org owners can manage proposals" ON public.res_function_proposals;
CREATE POLICY "Org members can manage proposals"
  ON public.res_function_proposals FOR ALL
  USING (is_org_member(auth.uid(), org_id))
  WITH CHECK (is_org_member(auth.uid(), org_id));

DROP POLICY IF EXISTS "Org owners can manage proposal menu sections" ON public.res_proposal_menu_sections;
CREATE POLICY "Org members can manage proposal menu sections"
  ON public.res_proposal_menu_sections FOR ALL
  USING (EXISTS (
    SELECT 1 FROM res_function_proposals p
    WHERE p.id = res_proposal_menu_sections.proposal_id
    AND is_org_member(auth.uid(), p.org_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM res_function_proposals p
    WHERE p.id = res_proposal_menu_sections.proposal_id
    AND is_org_member(auth.uid(), p.org_id)
  ));

-- 4. Fix status case mismatch in public token policies
DROP POLICY IF EXISTS "proposal_public_view_by_token" ON public.res_function_proposals;
CREATE POLICY "proposal_public_view_by_token"
  ON public.res_function_proposals FOR SELECT
  USING (
    share_token IS NOT NULL
    AND status IN ('sent', 'SENT', 'accepted', 'ACCEPTED')
    AND (expires_at IS NULL OR expires_at > now())
  );

DROP POLICY IF EXISTS "proposal_public_accept_by_token" ON public.res_function_proposals;
CREATE POLICY "proposal_public_accept_by_token"
  ON public.res_function_proposals FOR UPDATE
  USING (
    share_token IS NOT NULL
    AND status IN ('sent', 'SENT')
  );
