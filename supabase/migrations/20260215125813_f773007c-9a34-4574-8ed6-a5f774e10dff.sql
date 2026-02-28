
-- Duty assignments
CREATE TABLE public.food_safety_duties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  user_id uuid NOT NULL,
  shift text NOT NULL DEFAULT 'am',
  duty_date date,
  assigned_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id, shift, duty_date)
);

ALTER TABLE food_safety_duties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view duties"
  ON food_safety_duties FOR SELECT
  USING (org_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Head chefs can manage duties"
  ON food_safety_duties FOR ALL
  USING (is_head_chef(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid())))
  WITH CHECK (is_head_chef(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid())));

-- Reminder tracking
CREATE TABLE public.food_safety_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  user_id uuid NOT NULL,
  reminder_type text NOT NULL,
  reminder_date date NOT NULL DEFAULT CURRENT_DATE,
  dismissed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id, reminder_type, reminder_date)
);

ALTER TABLE food_safety_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reminders"
  ON food_safety_reminders FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
