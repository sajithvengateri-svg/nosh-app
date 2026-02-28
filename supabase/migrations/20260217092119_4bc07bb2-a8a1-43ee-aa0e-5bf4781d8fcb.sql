
-- =============================================
-- GrowthOS: Marketing Module Tables
-- =============================================

-- 1. Campaigns table
CREATE TABLE public.growth_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'CUSTOM',
  trigger_type text NOT NULL DEFAULT 'MANUAL',
  channel text NOT NULL DEFAULT 'EMAIL',
  segment jsonb DEFAULT '{}',
  subject text,
  body text,
  cta_text text,
  cta_url text,
  social_caption text,
  status text NOT NULL DEFAULT 'DRAFT',
  scheduled_at timestamptz,
  sent_at timestamptz,
  recipients_count integer NOT NULL DEFAULT 0,
  opened_count integer NOT NULL DEFAULT 0,
  clicked_count integer NOT NULL DEFAULT 0,
  bookings_attributed integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.growth_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view campaigns"
  ON public.growth_campaigns FOR SELECT
  TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can insert campaigns"
  ON public.growth_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can update campaigns"
  ON public.growth_campaigns FOR UPDATE
  TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can delete campaigns"
  ON public.growth_campaigns FOR DELETE
  TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));

CREATE TRIGGER update_growth_campaigns_updated_at
  BEFORE UPDATE ON public.growth_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Campaign recipients table
CREATE TABLE public.growth_campaign_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.growth_campaigns(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL REFERENCES public.res_guests(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'QUEUED',
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.growth_campaign_recipients ENABLE ROW LEVEL SECURITY;

-- RLS via campaign's org_id
CREATE POLICY "Org members can view recipients"
  ON public.growth_campaign_recipients FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.growth_campaigns c
    WHERE c.id = campaign_id AND public.is_org_member(auth.uid(), c.org_id)
  ));

CREATE POLICY "Org members can insert recipients"
  ON public.growth_campaign_recipients FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.growth_campaigns c
    WHERE c.id = campaign_id AND public.is_org_member(auth.uid(), c.org_id)
  ));

CREATE POLICY "Org members can update recipients"
  ON public.growth_campaign_recipients FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.growth_campaigns c
    WHERE c.id = campaign_id AND public.is_org_member(auth.uid(), c.org_id)
  ));

CREATE POLICY "Org members can delete recipients"
  ON public.growth_campaign_recipients FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.growth_campaigns c
    WHERE c.id = campaign_id AND public.is_org_member(auth.uid(), c.org_id)
  ));

-- 3. Communications table
CREATE TABLE public.growth_communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  guest_id uuid REFERENCES public.res_guests(id) ON DELETE SET NULL,
  channel text NOT NULL DEFAULT 'EMAIL',
  type text NOT NULL DEFAULT 'MARKETING',
  campaign_id uuid REFERENCES public.growth_campaigns(id) ON DELETE SET NULL,
  subject text,
  body text,
  status text NOT NULL DEFAULT 'QUEUED',
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  booking_link_utm text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.growth_communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view communications"
  ON public.growth_communications FOR SELECT
  TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can insert communications"
  ON public.growth_communications FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can update communications"
  ON public.growth_communications FOR UPDATE
  TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can delete communications"
  ON public.growth_communications FOR DELETE
  TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));

-- Indexes for performance
CREATE INDEX idx_growth_campaigns_org_id ON public.growth_campaigns(org_id);
CREATE INDEX idx_growth_campaigns_status ON public.growth_campaigns(status);
CREATE INDEX idx_growth_campaign_recipients_campaign ON public.growth_campaign_recipients(campaign_id);
CREATE INDEX idx_growth_campaign_recipients_guest ON public.growth_campaign_recipients(guest_id);
CREATE INDEX idx_growth_communications_org_id ON public.growth_communications(org_id);
CREATE INDEX idx_growth_communications_guest ON public.growth_communications(guest_id);
CREATE INDEX idx_growth_communications_campaign ON public.growth_communications(campaign_id);
