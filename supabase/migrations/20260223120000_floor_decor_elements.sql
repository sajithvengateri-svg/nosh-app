-- Add decor_elements JSONB column to res_floor_layouts
ALTER TABLE public.res_floor_layouts
  ADD COLUMN IF NOT EXISTS decor_elements jsonb NOT NULL DEFAULT '[]';

-- Add comment for clarity
COMMENT ON COLUMN public.res_floor_layouts.decor_elements IS 'Array of decorative elements (walls, doors, pillars, etc.) stored as JSON';
