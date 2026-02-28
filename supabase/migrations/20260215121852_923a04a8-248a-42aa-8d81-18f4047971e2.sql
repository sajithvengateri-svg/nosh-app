
CREATE TABLE public.induction_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid NOT NULL,
  step_key text NOT NULL,
  completed_at timestamptz,
  skipped boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, org_id, step_key)
);

ALTER TABLE public.induction_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own induction"
  ON public.induction_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
