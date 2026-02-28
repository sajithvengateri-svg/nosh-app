
-- Enable pgcrypto for PIN hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. pos_stores — POS settings per org
-- ============================================================
CREATE TABLE public.pos_stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  store_name TEXT NOT NULL DEFAULT 'My Store',
  mode TEXT NOT NULL DEFAULT 'FOCC_IT' CHECK (mode IN ('FOCC_IT', 'CHICC_IT')),
  tax_rate NUMERIC(5,4) NOT NULL DEFAULT 0.1000,
  card_surcharge_pct NUMERIC(5,4) NOT NULL DEFAULT 0.0150,
  stripe_account_id TEXT,
  stripe_location_id TEXT,
  stripe_reader_id TEXT,
  receipt_header TEXT,
  receipt_footer TEXT,
  trading_hours JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id)
);
ALTER TABLE public.pos_stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pos_stores_select" ON public.pos_stores FOR SELECT USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "pos_stores_insert" ON public.pos_stores FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "pos_stores_update" ON public.pos_stores FOR UPDATE USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "pos_stores_delete" ON public.pos_stores FOR DELETE USING (public.is_org_member(auth.uid(), org_id));
CREATE TRIGGER update_pos_stores_updated_at BEFORE UPDATE ON public.pos_stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. pos_staff — POS role + PIN per user
-- ============================================================
CREATE TABLE public.pos_staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  user_id UUID NOT NULL,
  display_name TEXT NOT NULL,
  pin_hash TEXT,
  pos_role TEXT NOT NULL DEFAULT 'cashier' CHECK (pos_role IN ('manager', 'supervisor', 'cashier', 'bartender', 'waiter')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);
ALTER TABLE public.pos_staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pos_staff_select" ON public.pos_staff FOR SELECT USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "pos_staff_insert" ON public.pos_staff FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "pos_staff_update" ON public.pos_staff FOR UPDATE USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "pos_staff_delete" ON public.pos_staff FOR DELETE USING (public.is_org_member(auth.uid(), org_id));
CREATE TRIGGER update_pos_staff_updated_at BEFORE UPDATE ON public.pos_staff FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 3. pos_categories — Menu categories
-- ============================================================
CREATE TABLE public.pos_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pos_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pos_categories_select" ON public.pos_categories FOR SELECT USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "pos_categories_insert" ON public.pos_categories FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "pos_categories_update" ON public.pos_categories FOR UPDATE USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "pos_categories_delete" ON public.pos_categories FOR DELETE USING (public.is_org_member(auth.uid(), org_id));
CREATE TRIGGER update_pos_categories_updated_at BEFORE UPDATE ON public.pos_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 4. pos_menu_items — Items on the menu
-- ============================================================
CREATE TABLE public.pos_menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  category_id UUID REFERENCES public.pos_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost_price NUMERIC(10,2) DEFAULT 0,
  station TEXT DEFAULT 'PASS' CHECK (station IN ('HOT', 'COLD', 'BAR', 'PASS', 'COFFEE')),
  image_url TEXT,
  bev_product_id UUID REFERENCES public.bev_products(id) ON DELETE SET NULL,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pos_menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pos_menu_items_select" ON public.pos_menu_items FOR SELECT USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "pos_menu_items_insert" ON public.pos_menu_items FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "pos_menu_items_update" ON public.pos_menu_items FOR UPDATE USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "pos_menu_items_delete" ON public.pos_menu_items FOR DELETE USING (public.is_org_member(auth.uid(), org_id));
CREATE TRIGGER update_pos_menu_items_updated_at BEFORE UPDATE ON public.pos_menu_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 5. pos_modifier_groups
-- ============================================================
CREATE TABLE public.pos_modifier_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT false,
  min_selections INT NOT NULL DEFAULT 0,
  max_selections INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pos_modifier_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pos_modifier_groups_select" ON public.pos_modifier_groups FOR SELECT USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "pos_modifier_groups_insert" ON public.pos_modifier_groups FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "pos_modifier_groups_update" ON public.pos_modifier_groups FOR UPDATE USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "pos_modifier_groups_delete" ON public.pos_modifier_groups FOR DELETE USING (public.is_org_member(auth.uid(), org_id));

-- ============================================================
-- 6. pos_modifiers
-- ============================================================
CREATE TABLE public.pos_modifiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.pos_modifier_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_adjustment NUMERIC(10,2) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);
ALTER TABLE public.pos_modifiers ENABLE ROW LEVEL SECURITY;
-- RLS via group -> org_id join
CREATE POLICY "pos_modifiers_select" ON public.pos_modifiers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.pos_modifier_groups g WHERE g.id = group_id AND public.is_org_member(auth.uid(), g.org_id))
);
CREATE POLICY "pos_modifiers_insert" ON public.pos_modifiers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.pos_modifier_groups g WHERE g.id = group_id AND public.is_org_member(auth.uid(), g.org_id))
);
CREATE POLICY "pos_modifiers_update" ON public.pos_modifiers FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.pos_modifier_groups g WHERE g.id = group_id AND public.is_org_member(auth.uid(), g.org_id))
);
CREATE POLICY "pos_modifiers_delete" ON public.pos_modifiers FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.pos_modifier_groups g WHERE g.id = group_id AND public.is_org_member(auth.uid(), g.org_id))
);

-- ============================================================
-- 7. pos_menu_item_modifier_groups (M2M)
-- ============================================================
CREATE TABLE public.pos_menu_item_modifier_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID NOT NULL REFERENCES public.pos_menu_items(id) ON DELETE CASCADE,
  modifier_group_id UUID NOT NULL REFERENCES public.pos_modifier_groups(id) ON DELETE CASCADE,
  UNIQUE(menu_item_id, modifier_group_id)
);
ALTER TABLE public.pos_menu_item_modifier_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pos_mimg_select" ON public.pos_menu_item_modifier_groups FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.pos_menu_items i WHERE i.id = menu_item_id AND public.is_org_member(auth.uid(), i.org_id))
);
CREATE POLICY "pos_mimg_insert" ON public.pos_menu_item_modifier_groups FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.pos_menu_items i WHERE i.id = menu_item_id AND public.is_org_member(auth.uid(), i.org_id))
);
CREATE POLICY "pos_mimg_delete" ON public.pos_menu_item_modifier_groups FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.pos_menu_items i WHERE i.id = menu_item_id AND public.is_org_member(auth.uid(), i.org_id))
);

-- ============================================================
-- 8. pos_tabs
-- ============================================================
CREATE TABLE public.pos_tabs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  stripe_setup_intent_id TEXT,
  card_last_four TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
  opened_by UUID,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pos_tabs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pos_tabs_select" ON public.pos_tabs FOR SELECT USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "pos_tabs_insert" ON public.pos_tabs FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "pos_tabs_update" ON public.pos_tabs FOR UPDATE USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "pos_tabs_delete" ON public.pos_tabs FOR DELETE USING (public.is_org_member(auth.uid(), org_id));

-- ============================================================
-- 9. pos_orders
-- ============================================================
CREATE TABLE public.pos_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  order_number SERIAL,
  order_type TEXT NOT NULL DEFAULT 'DINE_IN' CHECK (order_type IN ('DINE_IN', 'TAKEAWAY', 'TAB', 'FUNCTION')),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'IN_PROGRESS', 'READY', 'COMPLETED', 'PAID', 'VOIDED')),
  table_number TEXT,
  tab_id UUID REFERENCES public.pos_tabs(id) ON DELETE SET NULL,
  function_id UUID,
  reservation_id UUID,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax NUMERIC(10,2) NOT NULL DEFAULT 0,
  surcharge NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pos_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pos_orders_select" ON public.pos_orders FOR SELECT USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "pos_orders_insert" ON public.pos_orders FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "pos_orders_update" ON public.pos_orders FOR UPDATE USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "pos_orders_delete" ON public.pos_orders FOR DELETE USING (public.is_org_member(auth.uid(), org_id));
CREATE TRIGGER update_pos_orders_updated_at BEFORE UPDATE ON public.pos_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 10. pos_order_items
-- ============================================================
CREATE TABLE public.pos_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.pos_orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.pos_menu_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  modifiers JSONB DEFAULT '[]',
  notes TEXT,
  station TEXT DEFAULT 'PASS',
  course_number INT DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pos_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pos_order_items_select" ON public.pos_order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.pos_orders o WHERE o.id = order_id AND public.is_org_member(auth.uid(), o.org_id))
);
CREATE POLICY "pos_order_items_insert" ON public.pos_order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.pos_orders o WHERE o.id = order_id AND public.is_org_member(auth.uid(), o.org_id))
);
CREATE POLICY "pos_order_items_update" ON public.pos_order_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.pos_orders o WHERE o.id = order_id AND public.is_org_member(auth.uid(), o.org_id))
);
CREATE POLICY "pos_order_items_delete" ON public.pos_order_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.pos_orders o WHERE o.id = order_id AND public.is_org_member(auth.uid(), o.org_id))
);

-- ============================================================
-- 11. pos_order_events (append-only, realtime)
-- ============================================================
CREATE TABLE public.pos_order_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  order_id UUID NOT NULL REFERENCES public.pos_orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  user_id UUID,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pos_order_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pos_order_events_select" ON public.pos_order_events FOR SELECT USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "pos_order_events_insert" ON public.pos_order_events FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), org_id));
-- No UPDATE or DELETE policies — append-only

ALTER PUBLICATION supabase_realtime ADD TABLE public.pos_order_events;

-- ============================================================
-- 12. pos_payments
-- ============================================================
CREATE TABLE public.pos_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  order_id UUID NOT NULL REFERENCES public.pos_orders(id) ON DELETE CASCADE,
  method TEXT NOT NULL DEFAULT 'CASH' CHECK (method IN ('CASH', 'CARD', 'TAB', 'SPLIT', 'OTHER')),
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  tip NUMERIC(10,2) NOT NULL DEFAULT 0,
  tendered NUMERIC(10,2),
  change_given NUMERIC(10,2),
  stripe_payment_intent_id TEXT,
  card_last_four TEXT,
  card_brand TEXT,
  is_refund BOOLEAN NOT NULL DEFAULT false,
  refund_reason TEXT,
  processed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pos_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pos_payments_select" ON public.pos_payments FOR SELECT USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "pos_payments_insert" ON public.pos_payments FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "pos_payments_update" ON public.pos_payments FOR UPDATE USING (public.is_org_member(auth.uid(), org_id));

-- ============================================================
-- 13. pos_certifications
-- ============================================================
CREATE TABLE public.pos_certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  user_id UUID NOT NULL,
  cert_type TEXT NOT NULL,
  cert_name TEXT NOT NULL,
  issue_date DATE,
  expiry_date DATE,
  file_url TEXT,
  qr_code TEXT,
  status TEXT NOT NULL DEFAULT 'VALID' CHECK (status IN ('VALID', 'EXPIRING', 'EXPIRED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pos_certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pos_certifications_select" ON public.pos_certifications FOR SELECT USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "pos_certifications_insert" ON public.pos_certifications FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "pos_certifications_update" ON public.pos_certifications FOR UPDATE USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "pos_certifications_delete" ON public.pos_certifications FOR DELETE USING (public.is_org_member(auth.uid(), org_id));
CREATE TRIGGER update_pos_certifications_updated_at BEFORE UPDATE ON public.pos_certifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 14. pos_shifts
-- ============================================================
CREATE TABLE public.pos_shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  user_id UUID NOT NULL,
  clock_in TIMESTAMPTZ NOT NULL DEFAULT now(),
  clock_out TIMESTAMPTZ,
  hours NUMERIC(5,2),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pos_shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pos_shifts_select" ON public.pos_shifts FOR SELECT USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "pos_shifts_insert" ON public.pos_shifts FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "pos_shifts_update" ON public.pos_shifts FOR UPDATE USING (public.is_org_member(auth.uid(), org_id));

-- ============================================================
-- 15. pos_audit_events (append-only)
-- ============================================================
CREATE TABLE public.pos_audit_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  user_id UUID,
  authorised_by UUID,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  before_data JSONB,
  after_data JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pos_audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pos_audit_events_select" ON public.pos_audit_events FOR SELECT USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "pos_audit_events_insert" ON public.pos_audit_events FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), org_id));
-- No UPDATE or DELETE — append-only

-- ============================================================
-- 16. pos_daily_close
-- ============================================================
CREATE TABLE public.pos_daily_close (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  close_date DATE NOT NULL,
  total_sales NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_cash NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_card NUMERIC(10,2) NOT NULL DEFAULT 0,
  expected_cash NUMERIC(10,2) NOT NULL DEFAULT 0,
  actual_cash NUMERIC(10,2) NOT NULL DEFAULT 0,
  variance NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_discounts NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_voids NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_refunds NUMERIC(10,2) NOT NULL DEFAULT 0,
  order_count INT NOT NULL DEFAULT 0,
  closed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, close_date)
);
ALTER TABLE public.pos_daily_close ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pos_daily_close_select" ON public.pos_daily_close FOR SELECT USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "pos_daily_close_insert" ON public.pos_daily_close FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "pos_daily_close_update" ON public.pos_daily_close FOR UPDATE USING (public.is_org_member(auth.uid(), org_id));

-- ============================================================
-- 17. pos_waste_logs
-- ============================================================
CREATE TABLE public.pos_waste_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  menu_item_id UUID REFERENCES public.pos_menu_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  reason TEXT,
  logged_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pos_waste_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pos_waste_logs_select" ON public.pos_waste_logs FOR SELECT USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "pos_waste_logs_insert" ON public.pos_waste_logs FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), org_id));

-- ============================================================
-- 18. xero_journal_queue
-- ============================================================
CREATE TABLE public.xero_journal_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  journal_date DATE NOT NULL,
  entries JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'SYNCED', 'FAILED')),
  xero_journal_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.xero_journal_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "xero_journal_queue_select" ON public.xero_journal_queue FOR SELECT USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "xero_journal_queue_insert" ON public.xero_journal_queue FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "xero_journal_queue_update" ON public.xero_journal_queue FOR UPDATE USING (public.is_org_member(auth.uid(), org_id));
CREATE TRIGGER update_xero_journal_queue_updated_at BEFORE UPDATE ON public.xero_journal_queue FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- PIN verification function
-- ============================================================
CREATE OR REPLACE FUNCTION public.verify_pos_pin(_org_id UUID, _user_id UUID, _pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.pos_staff
    WHERE org_id = _org_id AND user_id = _user_id AND is_active = true
      AND pin_hash = crypt(_pin, pin_hash)
  );
END;
$$;
