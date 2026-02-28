
-- ==========================================
-- res_settings: per-org reservation config
-- ==========================================
CREATE TABLE public.res_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  operating_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  active_channels text[] NOT NULL DEFAULT '{PHONE,WALK_IN,IN_PERSON,WEBSITE}'::text[],
  sms_templates jsonb NOT NULL DEFAULT '{}'::jsonb,
  deposit_threshold_party_size int NOT NULL DEFAULT 8,
  deposit_default_percent int NOT NULL DEFAULT 25,
  max_party_size_before_function int NOT NULL DEFAULT 12,
  cancellation_policy text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.res_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view res_settings"
  ON public.res_settings FOR SELECT
  TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Owners can insert res_settings"
  ON public.res_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_owner(auth.uid(), org_id));

CREATE POLICY "Owners can update res_settings"
  ON public.res_settings FOR UPDATE
  TO authenticated
  USING (public.is_org_owner(auth.uid(), org_id));

-- updated_at trigger
CREATE TRIGGER update_res_settings_updated_at
  BEFORE UPDATE ON public.res_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- Trigger: Auto-increment guest no-show count
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_reservation_no_show()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'NO_SHOW' AND OLD.status IS DISTINCT FROM 'NO_SHOW' AND NEW.guest_id IS NOT NULL THEN
    UPDATE public.res_guests
    SET 
      no_show_count = no_show_count + 1,
      guest_score = GREATEST(0, 100 - ((no_show_count + 1) * 15) + LEAST(total_visits * 2, 40)),
      updated_at = now()
    WHERE id = NEW.guest_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reservation_no_show
  AFTER UPDATE ON public.res_reservations
  FOR EACH ROW
  WHEN (NEW.status = 'NO_SHOW' AND OLD.status IS DISTINCT FROM 'NO_SHOW')
  EXECUTE FUNCTION public.handle_reservation_no_show();

-- ==========================================
-- Trigger: Auto-calculate turn time on COMPLETED
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_reservation_completed()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'COMPLETED' AND OLD.status IS DISTINCT FROM 'COMPLETED' THEN
    NEW.completed_at := COALESCE(NEW.completed_at, now());
    IF NEW.seated_at IS NOT NULL THEN
      NEW.turn_time_minutes := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.seated_at)) / 60;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reservation_completed
  BEFORE UPDATE ON public.res_reservations
  FOR EACH ROW
  WHEN (NEW.status = 'COMPLETED' AND OLD.status IS DISTINCT FROM 'COMPLETED')
  EXECUTE FUNCTION public.handle_reservation_completed();
