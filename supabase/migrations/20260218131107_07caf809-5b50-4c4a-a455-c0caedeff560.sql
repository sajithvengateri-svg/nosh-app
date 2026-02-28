
-- Create waste_logs table
CREATE TABLE public.waste_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  module text NOT NULL CHECK (module IN ('food', 'beverage')),
  item_type text NOT NULL DEFAULT 'other' CHECK (item_type IN ('ingredient', 'recipe', 'bev_product', 'other')),
  item_id uuid,
  item_name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'each',
  cost numeric NOT NULL DEFAULT 0,
  reason text NOT NULL DEFAULT 'other',
  notes text,
  logged_by uuid NOT NULL REFERENCES auth.users(id),
  logged_by_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  rejection_reason text,
  shift_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_waste_logs_org_id ON public.waste_logs(org_id);
CREATE INDEX idx_waste_logs_status ON public.waste_logs(org_id, status);
CREATE INDEX idx_waste_logs_shift_date ON public.waste_logs(org_id, shift_date);
CREATE INDEX idx_waste_logs_module ON public.waste_logs(org_id, module);

-- Enable RLS
ALTER TABLE public.waste_logs ENABLE ROW LEVEL SECURITY;

-- SELECT: org members can read their org's logs
CREATE POLICY "Org members can view waste logs"
ON public.waste_logs FOR SELECT TO authenticated
USING (public.is_org_member(auth.uid(), org_id));

-- INSERT: org members can insert waste logs
CREATE POLICY "Org members can insert waste logs"
ON public.waste_logs FOR INSERT TO authenticated
WITH CHECK (public.is_org_member(auth.uid(), org_id) AND logged_by = auth.uid());

-- UPDATE: only owner/head_chef can approve/reject
CREATE POLICY "Admins can update waste logs"
ON public.waste_logs FOR UPDATE TO authenticated
USING (public.is_org_head_chef(auth.uid(), org_id));

-- DELETE: only owner can delete
CREATE POLICY "Owners can delete waste logs"
ON public.waste_logs FOR DELETE TO authenticated
USING (public.is_org_owner(auth.uid(), org_id));
