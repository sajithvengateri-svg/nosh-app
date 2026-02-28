
-- Add operational supplies & cleaning columns to pnl_snapshots
-- (idempotent - previous failed migrations may have already added these)
ALTER TABLE public.pnl_snapshots
  ADD COLUMN IF NOT EXISTS ops_supplies_cleaning NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ops_supplies_pct NUMERIC DEFAULT 0;

-- Add ops_supplies_score to audit_scores
ALTER TABLE public.audit_scores
  ADD COLUMN IF NOT EXISTS ops_supplies_score NUMERIC DEFAULT NULL;

-- Create overhead sub-categories for operational supplies tracking
INSERT INTO public.overhead_categories (id, org_id, name, type, sort_order, is_active)
SELECT gen_random_uuid(), o.id, unnest.name, 'VARIABLE', unnest.sort_order, true
FROM public.organizations o
CROSS JOIN (VALUES 
  ('Cleaning Chemicals', 200),
  ('Cleaning Materials', 201),
  ('Packaging & Takeaway', 202),
  ('Office Supplies', 203),
  ('Hospitality Supplies', 204),
  ('Smallwares & Utensils', 205),
  ('Plates & Glassware', 206),
  ('Miscellaneous Supplies', 207)
) AS unnest(name, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.overhead_categories oc 
  WHERE oc.org_id = o.id AND oc.name = unnest.name
);
