-- ============================================================================
-- Australian State-Based Compliance Engine
-- Adds au_state column to org_venues and creates au_inspection_grades table
-- ============================================================================

-- 1. Add au_state column to org_venues (mirrors the emirate column for GCC)
ALTER TABLE org_venues
  ADD COLUMN IF NOT EXISTS au_state TEXT;

-- Index for efficient state-based queries
CREATE INDEX IF NOT EXISTS idx_org_venues_au_state
  ON org_venues (au_state)
  WHERE au_state IS NOT NULL;

-- 2. Backfill au_state from existing venue postcodes
-- Australian postcodes are 3-4 digits; we detect state from the first numeric match
UPDATE org_venues
SET au_state = CASE
  WHEN postcode ~ '^\d{3,4}$' THEN
    CASE
      -- ACT: 200-299, 2600-2618, 2900-2920
      WHEN postcode::int BETWEEN 200 AND 299 THEN 'act'
      WHEN postcode::int BETWEEN 2600 AND 2618 THEN 'act'
      WHEN postcode::int BETWEEN 2900 AND 2920 THEN 'act'
      -- NSW: 1000-1999, 2000-2599, 2619-2899, 2921-2999
      WHEN postcode::int BETWEEN 1000 AND 1999 THEN 'nsw'
      WHEN postcode::int BETWEEN 2000 AND 2599 THEN 'nsw'
      WHEN postcode::int BETWEEN 2619 AND 2899 THEN 'nsw'
      WHEN postcode::int BETWEEN 2921 AND 2999 THEN 'nsw'
      -- VIC: 3000-3999, 8000-8999
      WHEN postcode::int BETWEEN 3000 AND 3999 THEN 'vic'
      WHEN postcode::int BETWEEN 8000 AND 8999 THEN 'vic'
      -- QLD: 4000-4999, 9000-9999
      WHEN postcode::int BETWEEN 4000 AND 4999 THEN 'qld'
      WHEN postcode::int BETWEEN 9000 AND 9999 THEN 'qld'
      -- SA: 5000-5999
      WHEN postcode::int BETWEEN 5000 AND 5999 THEN 'sa'
      -- WA: 6000-6999
      WHEN postcode::int BETWEEN 6000 AND 6999 THEN 'wa'
      -- TAS: 7000-7999
      WHEN postcode::int BETWEEN 7000 AND 7999 THEN 'tas'
      -- NT: 800-999
      WHEN postcode::int BETWEEN 800 AND 999 THEN 'nt'
      ELSE NULL
    END
  ELSE NULL
END
WHERE au_state IS NULL
  AND postcode IS NOT NULL
  AND postcode ~ '^\d{3,4}$';

-- 3. Australian inspection grades table (council inspection results)
CREATE TABLE IF NOT EXISTS au_inspection_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES org_venues(id) ON DELETE CASCADE,
  au_state TEXT NOT NULL,
  compliance_framework TEXT NOT NULL,

  -- Inspection details
  inspection_date DATE NOT NULL,
  inspector_name TEXT,
  council_name TEXT,
  report_reference TEXT,

  -- Grade (varies by state)
  grade_type TEXT NOT NULL DEFAULT 'star',  -- 'star' | 'scores_on_doors' | 'percentage' | 'pass_fail'
  grade_value NUMERIC,                       -- e.g. 4 for 4-star, 85 for percentage
  grade_label TEXT,                           -- e.g. "Very Good Performer", "Satisfactory"
  passed BOOLEAN NOT NULL DEFAULT true,

  -- Details
  notes TEXT,
  corrective_actions TEXT,
  follow_up_date DATE,
  document_url TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for au_inspection_grades
CREATE INDEX IF NOT EXISTS idx_au_inspection_grades_org
  ON au_inspection_grades (org_id);
CREATE INDEX IF NOT EXISTS idx_au_inspection_grades_venue
  ON au_inspection_grades (venue_id);
CREATE INDEX IF NOT EXISTS idx_au_inspection_grades_state
  ON au_inspection_grades (au_state);

-- RLS
ALTER TABLE au_inspection_grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "au_inspection_grades_select"
  ON au_inspection_grades FOR SELECT
  USING (org_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "au_inspection_grades_insert"
  ON au_inspection_grades FOR INSERT
  WITH CHECK (org_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "au_inspection_grades_update"
  ON au_inspection_grades FOR UPDATE
  USING (org_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "au_inspection_grades_delete"
  ON au_inspection_grades FOR DELETE
  USING (org_id IN (SELECT get_user_org_ids(auth.uid())));

-- Updated_at trigger
CREATE TRIGGER set_au_inspection_grades_updated_at
  BEFORE UPDATE ON au_inspection_grades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
