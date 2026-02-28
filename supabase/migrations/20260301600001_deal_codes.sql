-- Deal codes: unique single-use codes generated when user claims a deal
-- Part of vendor monetisation — tracks deal redemptions for 2% usage fee billing

CREATE TABLE IF NOT EXISTS deal_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,              -- 8-char alphanumeric e.g. "A8X4N2P9"
  deal_id uuid NOT NULL REFERENCES vendor_deals(id),
  vendor_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'active',  -- active / redeemed / expired
  claimed_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,        -- claimed_at + 24 hours
  redeemed_at timestamptz,
  scanned_by uuid,                        -- vendor user who scanned
  transaction_amount numeric,             -- sale amount entered by vendor at scan
  qr_payload text,                        -- deep link encoded in QR
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deal_codes_code ON deal_codes(code);
CREATE INDEX IF NOT EXISTS idx_deal_codes_user ON deal_codes(user_id, status);
CREATE INDEX IF NOT EXISTS idx_deal_codes_vendor ON deal_codes(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_deal_codes_expiry ON deal_codes(expires_at) WHERE status = 'active';

-- RLS: users can read their own codes, vendors can read codes for their deals
ALTER TABLE deal_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own deal codes"
  ON deal_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deal codes"
  ON deal_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);
