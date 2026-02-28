
-- ============================================
-- Part 1: delegated_tasks table
-- ============================================
CREATE TABLE public.delegated_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  venue_id uuid REFERENCES public.org_venues(id) ON DELETE SET NULL,
  created_by uuid NOT NULL,
  assigned_to uuid NOT NULL,
  assigned_to_name text NOT NULL,
  task text NOT NULL,
  quantity text,
  urgency text NOT NULL DEFAULT 'end_of_day',
  due_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'pending',
  completed_at timestamptz,
  source_todo_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.delegated_tasks ENABLE ROW LEVEL SECURITY;

-- Org members can read their org's tasks
CREATE POLICY "Org members can view delegated tasks"
  ON public.delegated_tasks FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));

-- Only head chef / owner can insert
CREATE POLICY "Head chefs can create delegated tasks"
  ON public.delegated_tasks FOR INSERT TO authenticated
  WITH CHECK (public.is_org_head_chef(auth.uid(), org_id));

-- Assigned user OR head chef can update (tick off / edit)
CREATE POLICY "Assigned user or head chef can update delegated tasks"
  ON public.delegated_tasks FOR UPDATE TO authenticated
  USING (auth.uid() = assigned_to OR public.is_org_head_chef(auth.uid(), org_id));

-- Only head chef / owner can delete
CREATE POLICY "Head chefs can delete delegated tasks"
  ON public.delegated_tasks FOR DELETE TO authenticated
  USING (public.is_org_head_chef(auth.uid(), org_id));

-- ============================================
-- Part 2: chef_wishlists table
-- ============================================
CREATE TABLE public.chef_wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  venue_id uuid REFERENCES public.org_venues(id) ON DELETE SET NULL,
  submitted_by uuid NOT NULL,
  submitted_by_name text NOT NULL,
  target_date date NOT NULL DEFAULT CURRENT_DATE,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  chef_notes text,
  ai_recommendations jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

ALTER TABLE public.chef_wishlists ENABLE ROW LEVEL SECURITY;

-- Org members can read their org's wishlists
CREATE POLICY "Org members can view wishlists"
  ON public.chef_wishlists FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));

-- Any org member can insert a wishlist
CREATE POLICY "Org members can create wishlists"
  ON public.chef_wishlists FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), org_id));

-- Submitter can update their own draft; head chef can update any
CREATE POLICY "Submitter or head chef can update wishlists"
  ON public.chef_wishlists FOR UPDATE TO authenticated
  USING (auth.uid() = submitted_by OR public.is_org_head_chef(auth.uid(), org_id));

-- Only head chef can delete
CREATE POLICY "Head chefs can delete wishlists"
  ON public.chef_wishlists FOR DELETE TO authenticated
  USING (public.is_org_head_chef(auth.uid(), org_id));

-- ============================================
-- Part 3: Enable realtime on both tables
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.delegated_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chef_wishlists;
