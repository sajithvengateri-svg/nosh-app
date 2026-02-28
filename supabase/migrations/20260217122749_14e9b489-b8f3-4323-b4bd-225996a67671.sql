
-- Phase 2: Staff preferences table for RTD
CREATE TABLE IF NOT EXISTS public.staff_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  quiet_start TIME DEFAULT '21:00',
  quiet_end TIME DEFAULT '08:00',
  opt_in_extra_shifts BOOLEAN DEFAULT false,
  notify_sms BOOLEAN DEFAULT true,
  notify_email BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, user_id)
);

ALTER TABLE public.staff_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own preferences" ON public.staff_preferences
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Org managers can view staff preferences" ON public.staff_preferences
  FOR SELECT USING (public.is_org_member(auth.uid(), org_id));

-- Phase 7: Labour records storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('labour-records', 'labour-records', false)
ON CONFLICT DO NOTHING;

-- RLS for labour-records bucket
CREATE POLICY "Org members can read labour records" ON storage.objects
  FOR SELECT USING (bucket_id = 'labour-records');

CREATE POLICY "Org members can upload labour records" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'labour-records' AND auth.uid() IS NOT NULL);
