ALTER TABLE res_function_proposals ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;
ALTER TABLE res_function_proposals ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;
ALTER TABLE res_function_proposals ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE res_function_proposals ADD COLUMN IF NOT EXISTS signature_name TEXT;
ALTER TABLE res_function_proposals ADD COLUMN IF NOT EXISTS signature_date TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_res_function_proposals_token
  ON res_function_proposals(share_token) WHERE share_token IS NOT NULL;