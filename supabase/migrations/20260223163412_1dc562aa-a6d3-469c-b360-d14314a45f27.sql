-- Drop old policies
DROP POLICY IF EXISTS "proposal_public_view_by_token" ON res_function_proposals;
DROP POLICY IF EXISTS "proposal_public_accept_by_token" ON res_function_proposals;

-- Recreate with uppercase status values matching the check constraint
CREATE POLICY "proposal_public_view_by_token" ON res_function_proposals
  FOR SELECT USING (
    share_token IS NOT NULL
    AND status IN ('SENT', 'ACCEPTED')
    AND (expires_at IS NULL OR expires_at > now())
  );

CREATE POLICY "proposal_public_accept_by_token" ON res_function_proposals
  FOR UPDATE USING (
    share_token IS NOT NULL
    AND status = 'SENT'
  );