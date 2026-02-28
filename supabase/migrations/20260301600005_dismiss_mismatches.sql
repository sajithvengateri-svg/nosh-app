-- Track when users dismiss recipes that match their cuisine preferences.
-- The companion checks this after 14 days and asks "was that a mistake?"
CREATE TABLE IF NOT EXISTS public.ds_dismiss_mismatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL,
  recipe_title TEXT NOT NULL,
  cuisine TEXT NOT NULL,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  asked BOOLEAN NOT NULL DEFAULT false,         -- companion already asked about this
  restored BOOLEAN NOT NULL DEFAULT false,       -- user said "yes, bring it back"
  UNIQUE(user_id, recipe_id)
);

ALTER TABLE public.ds_dismiss_mismatches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own mismatches"
  ON public.ds_dismiss_mismatches FOR ALL
  USING (user_id = auth.uid());

CREATE INDEX idx_dismiss_mismatches_user_pending
  ON public.ds_dismiss_mismatches(user_id)
  WHERE asked = false;
