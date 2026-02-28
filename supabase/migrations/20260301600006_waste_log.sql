-- Track food waste for the kitchen money dashboard.
-- Users log wasted items with estimated cost; companion surfaces wastage stats.
CREATE TABLE IF NOT EXISTS public.ds_waste_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity DECIMAL(8,2) DEFAULT 1,
  unit TEXT,
  estimated_cost DECIMAL(6,2) NOT NULL DEFAULT 0,
  reason TEXT,  -- expired, spoiled, overcooked, leftover, other
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ds_waste_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own waste log"
  ON public.ds_waste_log FOR ALL
  USING (user_id = auth.uid());

CREATE INDEX idx_waste_log_user_date
  ON public.ds_waste_log(user_id, logged_at DESC);
