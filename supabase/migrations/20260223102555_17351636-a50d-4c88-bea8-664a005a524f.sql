
-- 1. Create daily_thoughts table (global content, no org_id)
CREATE TABLE public.daily_thoughts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_number INT NOT NULL,
  message TEXT NOT NULL,
  author TEXT,
  category TEXT NOT NULL DEFAULT 'motivational',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT daily_thoughts_day_number_unique UNIQUE (day_number),
  CONSTRAINT daily_thoughts_day_number_range CHECK (day_number >= 1 AND day_number <= 366)
);

ALTER TABLE public.daily_thoughts ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read
CREATE POLICY "Authenticated users can read daily thoughts"
  ON public.daily_thoughts FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admin can write
CREATE POLICY "Admins can insert daily thoughts"
  ON public.daily_thoughts FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update daily thoughts"
  ON public.daily_thoughts FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete daily thoughts"
  ON public.daily_thoughts FOR DELETE
  USING (public.is_admin(auth.uid()));

-- 2. Create todo_recurring_rules table
CREATE TABLE public.todo_recurring_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'medium',
  quantity TEXT,
  unit TEXT,
  recurrence_type TEXT NOT NULL DEFAULT 'daily',
  recurrence_days INT[],
  recurrence_day_of_month INT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  auto_assign_to UUID,
  auto_assign_name TEXT,
  auto_delegate BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.todo_recurring_rules ENABLE ROW LEVEL SECURITY;

-- Org members can read
CREATE POLICY "Org members can read recurring rules"
  ON public.todo_recurring_rules FOR SELECT
  USING (public.is_org_member(auth.uid(), org_id));

-- Head chef/owner can write
CREATE POLICY "Head chef/owner can insert recurring rules"
  ON public.todo_recurring_rules FOR INSERT
  WITH CHECK (public.is_org_head_chef(auth.uid(), org_id));

CREATE POLICY "Head chef/owner can update recurring rules"
  ON public.todo_recurring_rules FOR UPDATE
  USING (public.is_org_head_chef(auth.uid(), org_id));

CREATE POLICY "Head chef/owner can delete recurring rules"
  ON public.todo_recurring_rules FOR DELETE
  USING (public.is_org_head_chef(auth.uid(), org_id));

-- Timestamps trigger
CREATE TRIGGER update_daily_thoughts_updated_at
  BEFORE UPDATE ON public.daily_thoughts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_todo_recurring_rules_updated_at
  BEFORE UPDATE ON public.todo_recurring_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
