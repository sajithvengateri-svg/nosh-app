-- ============================================================
-- NOSH Vendor Monetisation
-- Tables: deal_codes, vendor_invoices, vendor_payment_methods,
--         vendor_enforcement_log
-- Function: generate_deal_code()
-- Alter: vendor_profiles (payment_status, stripe_customer_id)
-- ============================================================

-- 1. Safe-charset deal code generation
-- Charset: ABCDEFGHJKLMNPQRSTUVWXYZ23456789 (32 chars)
-- Excludes ambiguous: 0/O, 1/I/L
CREATE OR REPLACE FUNCTION public.generate_deal_code(len integer DEFAULT 8)
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  charset text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  charset_len integer := 32;
  result text := '';
  i integer;
  rand_bytes bytea;
BEGIN
  rand_bytes := gen_random_bytes(len);
  FOR i IN 0..len-1 LOOP
    result := result || substr(charset, (get_byte(rand_bytes, i) % charset_len) + 1, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- 2. deal_codes — unique single-use codes for deal redemptions
CREATE TABLE public.deal_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE DEFAULT public.generate_deal_code(8),
  deal_id uuid NOT NULL REFERENCES public.vendor_deals(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'redeemed', 'expired')),
  claimed_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  redeemed_at timestamptz,
  scanned_by uuid,
  transaction_amount numeric,
  qr_payload text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_deal_codes_code ON public.deal_codes(code);
CREATE INDEX idx_deal_codes_deal ON public.deal_codes(deal_id);
CREATE INDEX idx_deal_codes_user ON public.deal_codes(user_id, status);
CREATE INDEX idx_deal_codes_vendor ON public.deal_codes(vendor_id, status);
CREATE INDEX idx_deal_codes_expiry ON public.deal_codes(expires_at)
  WHERE status = 'active';

-- One active code per user per deal
CREATE UNIQUE INDEX idx_one_active_code_per_user_deal
  ON public.deal_codes(deal_id, user_id)
  WHERE status = 'active';

-- Auto-update updated_at
CREATE TRIGGER update_deal_codes_updated_at
  BEFORE UPDATE ON public.deal_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.deal_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consumers view own codes"
  ON public.deal_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Consumers can claim codes"
  ON public.deal_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Vendors view their deal codes"
  ON public.deal_codes FOR SELECT
  USING (vendor_id = public.get_vendor_id(auth.uid()));

CREATE POLICY "Vendors can redeem codes"
  ON public.deal_codes FOR UPDATE
  USING (vendor_id = public.get_vendor_id(auth.uid()) AND status = 'active')
  WITH CHECK (status = 'redeemed');


-- 3. vendor_invoices — weekly usage + monthly listing invoices
CREATE TABLE public.vendor_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  invoice_type text NOT NULL DEFAULT 'usage'
    CHECK (invoice_type IN ('listing', 'usage')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  redemption_count integer NOT NULL DEFAULT 0,
  tracked_sales_total numeric NOT NULL DEFAULT 0,
  usage_fee_amount numeric NOT NULL DEFAULT 0,
  gst_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'disputed')),
  stripe_invoice_id text,
  xero_invoice_id text,
  issued_at timestamptz,
  due_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendor_invoices_vendor ON public.vendor_invoices(vendor_id);
CREATE INDEX idx_vendor_invoices_status ON public.vendor_invoices(status);
CREATE INDEX idx_vendor_invoices_due ON public.vendor_invoices(due_at)
  WHERE status IN ('sent', 'overdue');

CREATE TRIGGER update_vendor_invoices_updated_at
  BEFORE UPDATE ON public.vendor_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.vendor_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors view own invoices"
  ON public.vendor_invoices FOR SELECT
  USING (vendor_id = public.get_vendor_id(auth.uid()));


-- 4. vendor_payment_methods — card or BECS direct debit
CREATE TABLE public.vendor_payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  method_type text NOT NULL CHECK (method_type IN ('card', 'becs')),
  stripe_payment_method_id text,
  stripe_customer_id text,
  last_four text,
  is_default boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendor_payment_methods_vendor ON public.vendor_payment_methods(vendor_id);

-- Only one default payment method per vendor
CREATE UNIQUE INDEX idx_one_default_payment
  ON public.vendor_payment_methods(vendor_id)
  WHERE is_default = true;

CREATE TRIGGER update_vendor_payment_methods_updated_at
  BEFORE UPDATE ON public.vendor_payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.vendor_payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors manage own payment methods"
  ON public.vendor_payment_methods FOR ALL
  USING (vendor_id = public.get_vendor_id(auth.uid()));


-- 5. vendor_enforcement_log — tracks non-payment escalation
CREATE TABLE public.vendor_enforcement_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.vendor_invoices(id),
  action text NOT NULL
    CHECK (action IN ('reminder_sent', 'warning_sent', 'deals_disabled', 'account_suspended', 'resolved')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendor_enforcement_vendor ON public.vendor_enforcement_log(vendor_id);

ALTER TABLE public.vendor_enforcement_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors view own enforcement log"
  ON public.vendor_enforcement_log FOR SELECT
  USING (vendor_id = public.get_vendor_id(auth.uid()));


-- 6. Extend vendor_profiles for monetisation
ALTER TABLE public.vendor_profiles
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'good'
    CHECK (payment_status IN ('good', 'warning', 'overdue', 'suspended'));

ALTER TABLE public.vendor_profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;
