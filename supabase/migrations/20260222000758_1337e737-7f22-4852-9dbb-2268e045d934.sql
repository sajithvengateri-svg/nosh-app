
-- Food Complaints Log table
CREATE TABLE public.food_complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  complaint_date date NOT NULL DEFAULT CURRENT_DATE,
  complaint_text text NOT NULL,
  source text DEFAULT 'customer',
  severity text DEFAULT 'medium',
  recipe_id uuid REFERENCES public.recipes(id) ON DELETE SET NULL,
  recipe_name text,
  section_id uuid REFERENCES public.kitchen_sections(id) ON DELETE SET NULL,
  section_name text,
  assigned_to uuid,
  assigned_to_name text,
  dish_name text,
  category text DEFAULT 'quality',
  resolution text,
  resolved_at timestamptz,
  resolved_by uuid,
  status text DEFAULT 'open' NOT NULL,
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.food_complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view complaints"
  ON public.food_complaints FOR SELECT
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can insert complaints"
  ON public.food_complaints FOR INSERT
  WITH CHECK (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can update complaints"
  ON public.food_complaints FOR UPDATE
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can delete complaints"
  ON public.food_complaints FOR DELETE
  USING (public.is_org_member(auth.uid(), org_id));

CREATE INDEX idx_food_complaints_recipe ON public.food_complaints(recipe_id);
CREATE INDEX idx_food_complaints_org_date ON public.food_complaints(org_id, complaint_date);
