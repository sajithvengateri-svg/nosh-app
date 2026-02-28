-- Menu Engineering Workflow Enhancement
-- Adds workflow stage tracking, archive notes, and remedial notes to menus table

ALTER TABLE public.menus
  ADD COLUMN IF NOT EXISTS workflow_stage TEXT DEFAULT 'input'
    CHECK (workflow_stage IN ('input', 'saved', 'approved', 'sales_added', 'analysed', 'acted', 'archived')),
  ADD COLUMN IF NOT EXISTS archive_notes TEXT,
  ADD COLUMN IF NOT EXISTS remedial_notes JSONB DEFAULT '[]'::jsonb;

-- Index for filtering by workflow stage
CREATE INDEX IF NOT EXISTS idx_menus_workflow_stage ON public.menus (workflow_stage);

-- Comment for documentation
COMMENT ON COLUMN public.menus.workflow_stage IS 'Current stage in the menu engineering workflow: input → saved → approved → sales_added → analysed → acted → archived';
COMMENT ON COLUMN public.menus.archive_notes IS 'Notes recorded when archiving a menu (what worked, what didn''t)';
COMMENT ON COLUMN public.menus.remedial_notes IS 'Array of remedial action notes: [{id, text, author, date, item_id?, item_name?}]';
