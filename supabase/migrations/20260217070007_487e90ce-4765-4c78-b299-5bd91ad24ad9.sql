-- Add blocking and table combining support to res_tables
ALTER TABLE public.res_tables ADD COLUMN is_blocked boolean NOT NULL DEFAULT false;
ALTER TABLE public.res_tables ADD COLUMN block_reason text;
ALTER TABLE public.res_tables ADD COLUMN group_id uuid;

-- Index for quick group lookups
CREATE INDEX idx_res_tables_group_id ON public.res_tables(group_id) WHERE group_id IS NOT NULL;