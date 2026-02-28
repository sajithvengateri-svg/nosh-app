-- Deal redemptions: tracks when consumers claim and redeem vendor deals
-- Used by both VendorOS (scan to redeem) and NOSH (claim and show QR)

CREATE TABLE public.deal_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES public.vendor_deals(id) ON DELETE CASCADE NOT NULL,
  consumer_user_id uuid NOT NULL,
  vendor_id uuid REFERENCES public.vendor_profiles(id) ON DELETE CASCADE NOT NULL,
  qr_code_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  status text NOT NULL DEFAULT 'claimed' CHECK (status IN ('claimed', 'redeemed', 'expired', 'cancelled')),
  claimed_at timestamptz NOT NULL DEFAULT now(),
  redeemed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_deal_redemptions_deal_id ON public.deal_redemptions(deal_id);
CREATE INDEX idx_deal_redemptions_consumer ON public.deal_redemptions(consumer_user_id);
CREATE INDEX idx_deal_redemptions_vendor ON public.deal_redemptions(vendor_id);
CREATE INDEX idx_deal_redemptions_qr ON public.deal_redemptions(qr_code_token);
CREATE INDEX idx_deal_redemptions_status ON public.deal_redemptions(status);

-- One active (claimed) redemption per consumer per deal
CREATE UNIQUE INDEX idx_one_active_redemption
  ON public.deal_redemptions(deal_id, consumer_user_id)
  WHERE status = 'claimed';

-- Auto-update updated_at
CREATE TRIGGER update_deal_redemptions_updated_at
  BEFORE UPDATE ON public.deal_redemptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.deal_redemptions ENABLE ROW LEVEL SECURITY;

-- Consumers can view their own redemptions
CREATE POLICY "Consumers view own redemptions"
  ON public.deal_redemptions FOR SELECT
  USING (auth.uid() = consumer_user_id);

-- Consumers can claim deals (insert)
CREATE POLICY "Consumers can claim deals"
  ON public.deal_redemptions FOR INSERT
  WITH CHECK (auth.uid() = consumer_user_id);

-- Consumers can cancel their own unclaimed redemptions
CREATE POLICY "Consumers can cancel own redemptions"
  ON public.deal_redemptions FOR UPDATE
  USING (auth.uid() = consumer_user_id AND status = 'claimed')
  WITH CHECK (status = 'cancelled');

-- Vendors can view redemptions for their deals
CREATE POLICY "Vendors view their deal redemptions"
  ON public.deal_redemptions FOR SELECT
  USING (vendor_id = public.get_vendor_id(auth.uid()));

-- Vendors can mark as redeemed
CREATE POLICY "Vendors can redeem"
  ON public.deal_redemptions FOR UPDATE
  USING (vendor_id = public.get_vendor_id(auth.uid()) AND status = 'claimed')
  WITH CHECK (status = 'redeemed');

-- Consumer-facing policies on vendor tables (if not already present)
-- Allow any authenticated user to view active deals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'vendor_deals' AND policyname = 'Anyone can view active deals'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can view active deals" ON public.vendor_deals FOR SELECT USING (is_active = true AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE)';
  END IF;
END $$;

-- Allow any authenticated user to view approved vendor profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'vendor_profiles' AND policyname = 'Anyone can view approved vendors'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can view approved vendors" ON public.vendor_profiles FOR SELECT USING (status = ''approved'')';
  END IF;
END $$;
