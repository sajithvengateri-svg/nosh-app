
-- 1. Update invoice_scans for archiving
ALTER TABLE invoice_scans ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE invoice_scans ADD COLUMN IF NOT EXISTS invoice_type text NOT NULL DEFAULT 'food';
ALTER TABLE invoice_scans ADD COLUMN IF NOT EXISTS supplier_name text;
ALTER TABLE invoice_scans ADD COLUMN IF NOT EXISTS invoice_date date;
ALTER TABLE invoice_scans ADD COLUMN IF NOT EXISTS total_amount numeric;
ALTER TABLE invoice_scans ADD COLUMN IF NOT EXISTS notes text;

-- 2. Equipment inventory table
CREATE TABLE public.equipment_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  quantity integer NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'each',
  par_level integer DEFAULT 0,
  condition text DEFAULT 'good',
  location text DEFAULT 'Kitchen',
  supplier text,
  cost_per_unit numeric DEFAULT 0,
  last_counted date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE equipment_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org equipment inventory"
  ON equipment_inventory FOR SELECT
  USING ((org_id IN (SELECT get_user_org_ids(auth.uid()))) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Head chefs can manage own org equipment inventory"
  ON equipment_inventory FOR ALL
  USING (is_head_chef(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid())))
  WITH CHECK (is_head_chef(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Users with edit permission can manage equipment inventory"
  ON equipment_inventory FOR ALL
  USING (EXISTS (SELECT 1 FROM module_permissions WHERE module_permissions.user_id = auth.uid() AND module_permissions.module = 'inventory' AND module_permissions.can_edit = true));

-- 3. Cleaning inventory table
CREATE TABLE public.cleaning_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  quantity numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'each',
  par_level numeric DEFAULT 0,
  location text DEFAULT 'Storage',
  supplier text,
  cost_per_unit numeric DEFAULT 0,
  sds_url text,
  last_ordered date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cleaning_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org cleaning inventory"
  ON cleaning_inventory FOR SELECT
  USING ((org_id IN (SELECT get_user_org_ids(auth.uid()))) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Head chefs can manage own org cleaning inventory"
  ON cleaning_inventory FOR ALL
  USING (is_head_chef(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid())))
  WITH CHECK (is_head_chef(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Users with edit permission can manage cleaning inventory"
  ON cleaning_inventory FOR ALL
  USING (EXISTS (SELECT 1 FROM module_permissions WHERE module_permissions.user_id = auth.uid() AND module_permissions.module = 'inventory' AND module_permissions.can_edit = true));

-- 4. Invoices storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', false);

-- Storage RLS for invoices bucket
CREATE POLICY "Org members can upload invoices"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'invoices' AND auth.uid() IS NOT NULL);

CREATE POLICY "Org members can view invoices"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'invoices' AND auth.uid() IS NOT NULL);

CREATE POLICY "Head chefs can delete invoices"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'invoices' AND is_head_chef(auth.uid()));

-- Timestamps trigger for new tables
CREATE TRIGGER update_equipment_inventory_updated_at
  BEFORE UPDATE ON equipment_inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cleaning_inventory_updated_at
  BEFORE UPDATE ON cleaning_inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
