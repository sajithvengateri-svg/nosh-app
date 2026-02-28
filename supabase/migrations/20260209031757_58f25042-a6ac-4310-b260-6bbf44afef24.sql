-- 1. Section Assignments - links chefs to kitchen sections (leader/member)
CREATE TABLE public.section_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid REFERENCES public.kitchen_sections(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  assigned_by uuid,
  assigned_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (section_id, user_id)
);

-- 2. Kitchen Tasks - task assignment system with full status workflow
CREATE TABLE public.kitchen_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid REFERENCES public.kitchen_sections(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'review', 'approved', 'completed', 'rejected')),
  assigned_to uuid,
  assigned_by uuid,
  due_date date,
  due_time time,
  estimated_minutes integer,
  actual_minutes integer,
  recipe_id uuid REFERENCES public.recipes(id) ON DELETE SET NULL,
  prep_list_id uuid REFERENCES public.prep_lists(id) ON DELETE SET NULL,
  completed_at timestamp with time zone,
  completed_by uuid,
  approved_at timestamp with time zone,
  approved_by uuid,
  rejection_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. Task Comments - back-and-forth on tasks
CREATE TABLE public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES public.kitchen_tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  user_name text,
  content text NOT NULL,
  is_system_message boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 4. Activity Log - tracks every contribution
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_name text,
  action_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  entity_name text,
  section_id uuid REFERENCES public.kitchen_sections(id) ON DELETE SET NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.section_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Section Assignments Policies
CREATE POLICY "Anyone can view section assignments"
  ON public.section_assignments FOR SELECT
  USING (true);

CREATE POLICY "Head chefs can manage section assignments"
  ON public.section_assignments FOR ALL
  USING (is_head_chef(auth.uid()));

-- Kitchen Tasks Policies
CREATE POLICY "Anyone can view kitchen tasks"
  ON public.kitchen_tasks FOR SELECT
  USING (true);

CREATE POLICY "Head chefs can manage all tasks"
  ON public.kitchen_tasks FOR ALL
  USING (is_head_chef(auth.uid()));

CREATE POLICY "Section leaders can manage their section tasks"
  ON public.kitchen_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.section_assignments
      WHERE section_assignments.section_id = kitchen_tasks.section_id
        AND section_assignments.user_id = auth.uid()
        AND section_assignments.role = 'leader'
    )
  );

CREATE POLICY "Assigned users can update their tasks"
  ON public.kitchen_tasks FOR UPDATE
  USING (auth.uid() = assigned_to);

-- Task Comments Policies
CREATE POLICY "Anyone can view task comments"
  ON public.task_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.task_comments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own comments"
  ON public.task_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Head chefs can manage all comments"
  ON public.task_comments FOR ALL
  USING (is_head_chef(auth.uid()));

-- Activity Log Policies
CREATE POLICY "Anyone can view activity log"
  ON public.activity_log FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create activity entries"
  ON public.activity_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Head chefs can manage activity log"
  ON public.activity_log FOR ALL
  USING (is_head_chef(auth.uid()));

-- Add updated_at triggers
CREATE TRIGGER update_section_assignments_updated_at
  BEFORE UPDATE ON public.section_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kitchen_tasks_updated_at
  BEFORE UPDATE ON public.kitchen_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON public.task_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create helper function to check if user is section leader
CREATE OR REPLACE FUNCTION public.is_section_leader(_user_id uuid, _section_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.section_assignments
    WHERE user_id = _user_id
      AND section_id = _section_id
      AND role = 'leader'
  )
$$;

-- Create helper function to get user's sections
CREATE OR REPLACE FUNCTION public.get_user_sections(_user_id uuid)
RETURNS TABLE(section_id uuid, role text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT section_id, role
  FROM public.section_assignments
  WHERE user_id = _user_id
$$;