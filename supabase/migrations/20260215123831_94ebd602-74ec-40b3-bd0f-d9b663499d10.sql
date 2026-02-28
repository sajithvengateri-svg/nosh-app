
-- Table to store critical food safety alerts for head chefs / admins
CREATE TABLE public.food_safety_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id),
  log_id uuid REFERENCES public.food_safety_logs(id) ON DELETE CASCADE NOT NULL,
  log_type text NOT NULL,
  location text,
  temperature text,
  status text NOT NULL DEFAULT 'fail',
  recorded_by_name text,
  acknowledged_at timestamptz,
  acknowledged_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.food_safety_alerts ENABLE ROW LEVEL SECURITY;

-- Org members can view alerts for their org
CREATE POLICY "Org members can view alerts"
  ON public.food_safety_alerts FOR SELECT
  TO authenticated
  USING (
    org_id IN (SELECT public.get_user_org_ids(auth.uid()))
    OR public.has_role(auth.uid(), 'admin')
  );

-- Head chefs / owners / admins can update (acknowledge) alerts
CREATE POLICY "Head chefs can acknowledge alerts"
  ON public.food_safety_alerts FOR UPDATE
  TO authenticated
  USING (
    org_id IN (SELECT public.get_user_org_ids(auth.uid()))
    OR public.has_role(auth.uid(), 'admin')
  );

-- System inserts via trigger (SECURITY DEFINER function)
CREATE POLICY "System can insert alerts"
  ON public.food_safety_alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Enable realtime for alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.food_safety_alerts;

-- Trigger function: auto-create alert when a critical (fail) food safety log is inserted
CREATE OR REPLACE FUNCTION public.notify_critical_food_safety()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'fail' THEN
    INSERT INTO public.food_safety_alerts (
      org_id,
      log_id,
      log_type,
      location,
      temperature,
      status,
      recorded_by_name
    ) VALUES (
      NEW.org_id,
      NEW.id,
      NEW.log_type,
      NEW.location,
      CASE 
        WHEN NEW.readings IS NOT NULL AND NEW.readings->>'value' IS NOT NULL 
        THEN (NEW.readings->>'value') || '°' || COALESCE(NEW.readings->>'unit', 'C')
        ELSE NULL
      END,
      NEW.status,
      NEW.recorded_by_name
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_critical_food_safety_alert
  AFTER INSERT ON public.food_safety_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_critical_food_safety();
