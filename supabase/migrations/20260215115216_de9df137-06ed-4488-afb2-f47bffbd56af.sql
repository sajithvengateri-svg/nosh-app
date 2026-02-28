
-- Section stock templates: defines items, par levels, and storage locations per section
CREATE TABLE public.section_stock_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES public.organizations(id),
  section_id uuid REFERENCES public.kitchen_sections(id) ON DELETE CASCADE,
  name text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- items format: [{"name": "Arancini", "par_level": "8 boxes"}, ...]
  storage_locations text[] NOT NULL DEFAULT '{Service Fridge,Walk In,Back Freezer}'::text[],
  prep_tasks jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- prep_tasks format: [{"task": "Veg Stock"}, {"task": "Grill Breads"}, ...]
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.section_stock_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org templates"
  ON public.section_stock_templates FOR SELECT
  USING (org_id IN (SELECT get_user_org_ids(auth.uid())) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Head chefs can manage own org templates"
  ON public.section_stock_templates FOR ALL
  USING (is_head_chef(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid())))
  WITH CHECK (is_head_chef(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Section leaders can manage their section templates"
  ON public.section_stock_templates FOR ALL
  USING (EXISTS (
    SELECT 1 FROM section_assignments
    WHERE section_assignments.section_id = section_stock_templates.section_id
      AND section_assignments.user_id = auth.uid()
      AND section_assignments.role = 'leader'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM section_assignments
    WHERE section_assignments.section_id = section_stock_templates.section_id
      AND section_assignments.user_id = auth.uid()
      AND section_assignments.role = 'leader'
  ));

CREATE TRIGGER update_section_stock_templates_updated_at
  BEFORE UPDATE ON public.section_stock_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Nightly stock count records
CREATE TABLE public.nightly_stock_counts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES public.organizations(id),
  template_id uuid REFERENCES public.section_stock_templates(id) ON DELETE CASCADE,
  section_id uuid REFERENCES public.kitchen_sections(id) ON DELETE CASCADE,
  count_date date NOT NULL DEFAULT CURRENT_DATE,
  recorded_by uuid,
  recorded_by_name text,
  stock_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- stock_data format: {"Arancini": {"Service Fridge": 5, "Walk In": 3, "Back Freezer": 0}, ...}
  prep_checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- prep_checklist format: [{"task": "Veg Stock", "completed": true}, ...]
  notes text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(template_id, count_date)
);

ALTER TABLE public.nightly_stock_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org nightly counts"
  ON public.nightly_stock_counts FOR SELECT
  USING (org_id IN (SELECT get_user_org_ids(auth.uid())) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Head chefs can manage own org nightly counts"
  ON public.nightly_stock_counts FOR ALL
  USING (is_head_chef(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid())))
  WITH CHECK (is_head_chef(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Authenticated users can create nightly counts"
  ON public.nightly_stock_counts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND org_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Assigned users can update counts"
  ON public.nightly_stock_counts FOR UPDATE
  USING (auth.uid() = recorded_by OR is_head_chef(auth.uid()));

CREATE TRIGGER update_nightly_stock_counts_updated_at
  BEFORE UPDATE ON public.nightly_stock_counts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_nightly_stock_org_date ON public.nightly_stock_counts(org_id, count_date DESC);
CREATE INDEX idx_nightly_stock_template_date ON public.nightly_stock_counts(template_id, count_date DESC);
