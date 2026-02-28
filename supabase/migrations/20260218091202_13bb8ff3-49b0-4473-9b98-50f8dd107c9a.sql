
-- Recipe method steps: structured, ordered method steps grouped into sections
CREATE TABLE public.recipe_method_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  section_number INTEGER NOT NULL DEFAULT 1,
  section_title TEXT NOT NULL DEFAULT 'Method',
  step_number INTEGER NOT NULL DEFAULT 1,
  instruction TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  timer_id UUID REFERENCES public.recipe_timers(id) ON DELETE SET NULL,
  tips TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recipe_method_steps_recipe ON public.recipe_method_steps(recipe_id, sort_order);

ALTER TABLE public.recipe_method_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view method steps" ON public.recipe_method_steps
  FOR SELECT USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Members can insert method steps" ON public.recipe_method_steps
  FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Members can update method steps" ON public.recipe_method_steps
  FOR UPDATE USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Members can delete method steps" ON public.recipe_method_steps
  FOR DELETE USING (public.is_org_member(auth.uid(), org_id));

-- Recipe plating steps: ordered plating guide
CREATE TABLE public.recipe_plating_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL DEFAULT 1,
  instruction TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recipe_plating_steps_recipe ON public.recipe_plating_steps(recipe_id, sort_order);

ALTER TABLE public.recipe_plating_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view plating steps" ON public.recipe_plating_steps
  FOR SELECT USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Members can insert plating steps" ON public.recipe_plating_steps
  FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Members can update plating steps" ON public.recipe_plating_steps
  FOR UPDATE USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Members can delete plating steps" ON public.recipe_plating_steps
  FOR DELETE USING (public.is_org_member(auth.uid(), org_id));
