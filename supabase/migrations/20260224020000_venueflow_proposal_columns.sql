-- VenueFlow: Add proposal share/payment columns
ALTER TABLE res_function_proposals ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;
ALTER TABLE res_function_proposals ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;
ALTER TABLE res_function_proposals ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE res_function_proposals ADD COLUMN IF NOT EXISTS signature_name TEXT;
ALTER TABLE res_function_proposals ADD COLUMN IF NOT EXISTS signature_date TIMESTAMPTZ;

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_res_function_proposals_token
  ON res_function_proposals(share_token) WHERE share_token IS NOT NULL;

-- Public access: allow anyone to view proposals by share_token (no auth needed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'res_function_proposals'
    AND policyname = 'proposal_public_view_by_token'
  ) THEN
    CREATE POLICY "proposal_public_view_by_token" ON res_function_proposals
      FOR SELECT USING (
        share_token IS NOT NULL
        AND status IN ('sent', 'accepted')
        AND (expires_at IS NULL OR expires_at > now())
      );
  END IF;
END $$;

-- Public access: allow accepting proposals by token
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'res_function_proposals'
    AND policyname = 'proposal_public_accept_by_token'
  ) THEN
    CREATE POLICY "proposal_public_accept_by_token" ON res_function_proposals
      FOR UPDATE USING (
        share_token IS NOT NULL
        AND status = 'sent'
      );
  END IF;
END $$;

-- Venue photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('venue-photos', 'venue-photos', true)
ON CONFLICT (id) DO NOTHING;
