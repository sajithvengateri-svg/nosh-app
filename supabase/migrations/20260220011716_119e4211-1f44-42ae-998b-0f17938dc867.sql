
-- Chef Ideas table
CREATE TABLE public.chef_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  submitted_by uuid NOT NULL,
  submitted_by_name text,
  title text NOT NULL,
  description text,
  category text DEFAULT 'other',
  status text DEFAULT 'submitted',
  badge_awarded boolean DEFAULT false,
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Chef Idea Badges table
CREATE TABLE public.chef_idea_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  idea_id uuid NOT NULL REFERENCES public.chef_ideas(id) ON DELETE CASCADE,
  badge_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_chef_ideas_org ON public.chef_ideas(org_id);
CREATE INDEX idx_chef_ideas_submitted_by ON public.chef_ideas(submitted_by);
CREATE INDEX idx_chef_idea_badges_org ON public.chef_idea_badges(org_id);
CREATE INDEX idx_chef_idea_badges_user ON public.chef_idea_badges(user_id);

-- RLS
ALTER TABLE public.chef_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chef_idea_badges ENABLE ROW LEVEL SECURITY;

-- Ideas: org members can SELECT
CREATE POLICY "Org members can view ideas"
  ON public.chef_ideas FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));

-- Ideas: authenticated users can INSERT their own
CREATE POLICY "Users can submit ideas"
  ON public.chef_ideas FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = submitted_by
    AND public.is_org_member(auth.uid(), org_id)
  );

-- Ideas: only head_chef/owner can UPDATE (status, badge_awarded, admin_note)
CREATE POLICY "Head chef can update ideas"
  ON public.chef_ideas FOR UPDATE TO authenticated
  USING (public.is_org_head_chef(auth.uid(), org_id));

-- Badges: org members can SELECT
CREATE POLICY "Org members can view badges"
  ON public.chef_idea_badges FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));

-- Badges: only head_chef/owner can INSERT
CREATE POLICY "Head chef can award badges"
  ON public.chef_idea_badges FOR INSERT TO authenticated
  WITH CHECK (public.is_org_head_chef(auth.uid(), org_id));
