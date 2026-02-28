
-- =============================================
-- Res OS Phase 1: All tables, RLS, indexes, triggers, realtime, storage
-- =============================================

-- 1. res_guests
CREATE TABLE public.res_guests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  email text,
  date_of_birth date,
  anniversary_date date,
  dietary_requirements text,
  preferences jsonb NOT NULL DEFAULT '{}',
  vip_tier text NOT NULL DEFAULT 'NEW',
  total_visits integer NOT NULL DEFAULT 0,
  total_spend numeric NOT NULL DEFAULT 0,
  avg_spend_per_visit numeric NOT NULL DEFAULT 0,
  last_visit_date timestamptz,
  first_visit_date timestamptz,
  no_show_count integer NOT NULL DEFAULT 0,
  guest_score integer NOT NULL DEFAULT 50,
  sms_opt_in boolean NOT NULL DEFAULT true,
  email_opt_in boolean NOT NULL DEFAULT true,
  tags jsonb NOT NULL DEFAULT '[]',
  source text,
  referred_by_guest_id uuid REFERENCES public.res_guests(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.res_guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "res_guests_select" ON public.res_guests FOR SELECT USING (is_org_member(auth.uid(), org_id));
CREATE POLICY "res_guests_insert" ON public.res_guests FOR INSERT WITH CHECK (is_org_member(auth.uid(), org_id));
CREATE POLICY "res_guests_update" ON public.res_guests FOR UPDATE USING (is_org_member(auth.uid(), org_id));
CREATE POLICY "res_guests_delete" ON public.res_guests FOR DELETE USING (is_org_member(auth.uid(), org_id));

CREATE INDEX idx_res_guests_org_phone ON public.res_guests(org_id, phone);
CREATE INDEX idx_res_guests_org_email ON public.res_guests(org_id, email);

CREATE TRIGGER update_res_guests_updated_at BEFORE UPDATE ON public.res_guests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. res_tables
CREATE TABLE public.res_tables (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  name text NOT NULL,
  zone text NOT NULL DEFAULT 'INDOOR',
  min_capacity integer NOT NULL DEFAULT 1,
  max_capacity integer NOT NULL DEFAULT 2,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  x_position numeric,
  y_position numeric,
  width numeric NOT NULL DEFAULT 80,
  height numeric NOT NULL DEFAULT 80,
  shape text NOT NULL DEFAULT 'ROUND',
  rotation numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.res_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "res_tables_select" ON public.res_tables FOR SELECT USING (is_org_member(auth.uid(), org_id));
CREATE POLICY "res_tables_insert" ON public.res_tables FOR INSERT WITH CHECK (is_org_member(auth.uid(), org_id));
CREATE POLICY "res_tables_update" ON public.res_tables FOR UPDATE USING (is_org_member(auth.uid(), org_id));
CREATE POLICY "res_tables_delete" ON public.res_tables FOR DELETE USING (is_org_member(auth.uid(), org_id));

CREATE TRIGGER update_res_tables_updated_at BEFORE UPDATE ON public.res_tables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. res_floor_layouts
CREATE TABLE public.res_floor_layouts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  name text NOT NULL DEFAULT 'Main Floor',
  canvas_width integer NOT NULL DEFAULT 1200,
  canvas_height integer NOT NULL DEFAULT 800,
  background_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.res_floor_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "res_floor_layouts_select" ON public.res_floor_layouts FOR SELECT USING (is_org_member(auth.uid(), org_id));
CREATE POLICY "res_floor_layouts_insert" ON public.res_floor_layouts FOR INSERT WITH CHECK (is_org_member(auth.uid(), org_id));
CREATE POLICY "res_floor_layouts_update" ON public.res_floor_layouts FOR UPDATE USING (is_org_member(auth.uid(), org_id));
CREATE POLICY "res_floor_layouts_delete" ON public.res_floor_layouts FOR DELETE USING (is_org_member(auth.uid(), org_id));

CREATE TRIGGER update_res_floor_layouts_updated_at BEFORE UPDATE ON public.res_floor_layouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. res_reservations
CREATE TABLE public.res_reservations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  guest_id uuid REFERENCES public.res_guests(id),
  date date NOT NULL,
  time time NOT NULL,
  end_time time,
  party_size integer NOT NULL,
  status text NOT NULL DEFAULT 'CONFIRMED',
  channel text NOT NULL DEFAULT 'PHONE',
  table_id uuid REFERENCES public.res_tables(id),
  occasion text,
  dietary_requirements text,
  special_requests text,
  notes text,
  deposit_required boolean NOT NULL DEFAULT false,
  deposit_amount numeric,
  deposit_paid boolean NOT NULL DEFAULT false,
  stripe_payment_intent_id text,
  reminder_sent_24h boolean NOT NULL DEFAULT false,
  reminder_sent_2h boolean NOT NULL DEFAULT false,
  confirmation_sent boolean NOT NULL DEFAULT false,
  arrived_at timestamptz,
  seated_at timestamptz,
  completed_at timestamptz,
  turn_time_minutes integer,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.res_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "res_reservations_select" ON public.res_reservations FOR SELECT USING (is_org_member(auth.uid(), org_id));
CREATE POLICY "res_reservations_insert" ON public.res_reservations FOR INSERT WITH CHECK (is_org_member(auth.uid(), org_id));
CREATE POLICY "res_reservations_update" ON public.res_reservations FOR UPDATE USING (is_org_member(auth.uid(), org_id));
CREATE POLICY "res_reservations_delete" ON public.res_reservations FOR DELETE USING (is_org_member(auth.uid(), org_id));

CREATE INDEX idx_res_reservations_org_date ON public.res_reservations(org_id, date);

CREATE TRIGGER update_res_reservations_updated_at BEFORE UPDATE ON public.res_reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. res_waitlist
CREATE TABLE public.res_waitlist (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  guest_name text NOT NULL,
  guest_phone text,
  party_size integer NOT NULL,
  estimated_wait_minutes integer,
  status text NOT NULL DEFAULT 'WAITING',
  joined_at timestamptz NOT NULL DEFAULT now(),
  notified_at timestamptz,
  seated_at timestamptz,
  table_id uuid REFERENCES public.res_tables(id)
);

ALTER TABLE public.res_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "res_waitlist_select" ON public.res_waitlist FOR SELECT USING (is_org_member(auth.uid(), org_id));
CREATE POLICY "res_waitlist_insert" ON public.res_waitlist FOR INSERT WITH CHECK (is_org_member(auth.uid(), org_id));
CREATE POLICY "res_waitlist_update" ON public.res_waitlist FOR UPDATE USING (is_org_member(auth.uid(), org_id));
CREATE POLICY "res_waitlist_delete" ON public.res_waitlist FOR DELETE USING (is_org_member(auth.uid(), org_id));

CREATE INDEX idx_res_waitlist_org_status ON public.res_waitlist(org_id, status);

-- 6. res_functions
CREATE TABLE public.res_functions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  client_name text NOT NULL,
  client_email text,
  client_phone text,
  event_date date NOT NULL,
  start_time time NOT NULL,
  end_time time,
  party_size integer NOT NULL,
  event_type text NOT NULL DEFAULT 'CUSTOM',
  status text NOT NULL DEFAULT 'ENQUIRY',
  notes text,
  dietary_requirements text,
  run_sheet text,
  room text,
  minimum_spend numeric,
  quoted_total numeric,
  final_total numeric,
  deposit_schedule jsonb,
  terms_accepted boolean NOT NULL DEFAULT false,
  terms_accepted_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.res_functions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "res_functions_select" ON public.res_functions FOR SELECT USING (is_org_member(auth.uid(), org_id));
CREATE POLICY "res_functions_insert" ON public.res_functions FOR INSERT WITH CHECK (is_org_member(auth.uid(), org_id));
CREATE POLICY "res_functions_update" ON public.res_functions FOR UPDATE USING (is_org_member(auth.uid(), org_id));
CREATE POLICY "res_functions_delete" ON public.res_functions FOR DELETE USING (is_org_member(auth.uid(), org_id));

CREATE TRIGGER update_res_functions_updated_at BEFORE UPDATE ON public.res_functions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. res_function_packages
CREATE TABLE public.res_function_packages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_id uuid NOT NULL REFERENCES public.res_functions(id) ON DELETE CASCADE,
  description text NOT NULL,
  type text NOT NULL,
  per_head_price numeric,
  flat_price numeric,
  quantity integer NOT NULL DEFAULT 1,
  total numeric NOT NULL DEFAULT 0
);

ALTER TABLE public.res_function_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "res_function_packages_select" ON public.res_function_packages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.res_functions f WHERE f.id = function_id AND is_org_member(auth.uid(), f.org_id)));
CREATE POLICY "res_function_packages_insert" ON public.res_function_packages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.res_functions f WHERE f.id = function_id AND is_org_member(auth.uid(), f.org_id)));
CREATE POLICY "res_function_packages_update" ON public.res_function_packages FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.res_functions f WHERE f.id = function_id AND is_org_member(auth.uid(), f.org_id)));
CREATE POLICY "res_function_packages_delete" ON public.res_function_packages FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.res_functions f WHERE f.id = function_id AND is_org_member(auth.uid(), f.org_id)));

-- 8. res_function_payments
CREATE TABLE public.res_function_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_id uuid NOT NULL REFERENCES public.res_functions(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_method text,
  payment_type text NOT NULL,
  stripe_payment_intent_id text,
  paid_at timestamptz NOT NULL DEFAULT now(),
  received_by text
);

ALTER TABLE public.res_function_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "res_function_payments_select" ON public.res_function_payments FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.res_functions f WHERE f.id = function_id AND is_org_member(auth.uid(), f.org_id)));
CREATE POLICY "res_function_payments_insert" ON public.res_function_payments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.res_functions f WHERE f.id = function_id AND is_org_member(auth.uid(), f.org_id)));
CREATE POLICY "res_function_payments_update" ON public.res_function_payments FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.res_functions f WHERE f.id = function_id AND is_org_member(auth.uid(), f.org_id)));
CREATE POLICY "res_function_payments_delete" ON public.res_function_payments FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.res_functions f WHERE f.id = function_id AND is_org_member(auth.uid(), f.org_id)));

-- 9. res_demand_forecasts
CREATE TABLE public.res_demand_forecasts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  date date NOT NULL,
  service_period text NOT NULL DEFAULT 'PM',
  predicted_covers integer NOT NULL DEFAULT 0,
  confirmed_reservations integer NOT NULL DEFAULT 0,
  predicted_walk_ins integer NOT NULL DEFAULT 0,
  predicted_no_shows integer NOT NULL DEFAULT 0,
  predicted_functions_covers integer NOT NULL DEFAULT 0,
  actual_covers integer,
  confidence_score integer NOT NULL DEFAULT 50,
  chef_os_prep_generated boolean NOT NULL DEFAULT false,
  bev_os_stock_checked boolean NOT NULL DEFAULT false,
  labour_os_coverage_checked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.res_demand_forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "res_demand_forecasts_select" ON public.res_demand_forecasts FOR SELECT USING (is_org_member(auth.uid(), org_id));
CREATE POLICY "res_demand_forecasts_insert" ON public.res_demand_forecasts FOR INSERT WITH CHECK (is_org_member(auth.uid(), org_id));
CREATE POLICY "res_demand_forecasts_update" ON public.res_demand_forecasts FOR UPDATE USING (is_org_member(auth.uid(), org_id));
CREATE POLICY "res_demand_forecasts_delete" ON public.res_demand_forecasts FOR DELETE USING (is_org_member(auth.uid(), org_id));

CREATE TRIGGER update_res_demand_forecasts_updated_at BEFORE UPDATE ON public.res_demand_forecasts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.res_reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.res_waitlist;
ALTER PUBLICATION supabase_realtime ADD TABLE public.res_tables;

-- Storage bucket for floor layout images
INSERT INTO storage.buckets (id, name, public) VALUES ('floor-layouts', 'floor-layouts', true);

CREATE POLICY "floor_layouts_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'floor-layouts');
CREATE POLICY "floor_layouts_auth_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'floor-layouts' AND auth.role() = 'authenticated');
CREATE POLICY "floor_layouts_auth_update" ON storage.objects FOR UPDATE USING (bucket_id = 'floor-layouts' AND auth.role() = 'authenticated');
CREATE POLICY "floor_layouts_auth_delete" ON storage.objects FOR DELETE USING (bucket_id = 'floor-layouts' AND auth.role() = 'authenticated');
