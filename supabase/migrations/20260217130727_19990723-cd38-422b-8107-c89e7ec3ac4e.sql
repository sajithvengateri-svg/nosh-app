
-- Add section column to rosters for multi-roster support
ALTER TABLE public.rosters ADD COLUMN section TEXT DEFAULT NULL;

-- Create unique index so only one roster per org+period+section
CREATE UNIQUE INDEX idx_rosters_org_period_section 
ON public.rosters (org_id, period_start, period_end, COALESCE(section, '__ALL__'));
