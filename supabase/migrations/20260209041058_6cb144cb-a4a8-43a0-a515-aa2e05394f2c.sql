-- Create prep_list_templates table for recurring prep lists
CREATE TABLE public.prep_list_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  section_id UUID REFERENCES public.kitchen_sections(id) ON DELETE SET NULL,
  schedule_type TEXT NOT NULL DEFAULT 'weekly', -- 'daily', 'weekly', 'one_time'
  schedule_days TEXT[] DEFAULT '{}', -- ['monday', 'wednesday', 'friday']
  items JSONB NOT NULL DEFAULT '[]',
  default_assignee_name TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add section_id and template_id to prep_lists
ALTER TABLE public.prep_lists 
ADD COLUMN section_id UUID REFERENCES public.kitchen_sections(id) ON DELETE SET NULL,
ADD COLUMN template_id UUID REFERENCES public.prep_list_templates(id) ON DELETE SET NULL;

-- Add linked_prep_list_id to team_posts for sharing prep lists to wall
ALTER TABLE public.team_posts
ADD COLUMN linked_prep_list_id UUID REFERENCES public.prep_lists(id) ON DELETE SET NULL;

-- Create prep_list_comments table for task-level comments (quality issues, etc.)
CREATE TABLE public.prep_list_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prep_list_id UUID NOT NULL REFERENCES public.prep_lists(id) ON DELETE CASCADE,
  task_id TEXT, -- Optional: specific task within the prep list items
  content TEXT NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.prep_list_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prep_list_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for prep_list_templates
-- Anyone can view active templates
CREATE POLICY "Anyone can view templates"
ON public.prep_list_templates
FOR SELECT
USING (true);

-- Head chefs can manage all templates
CREATE POLICY "Head chefs can manage templates"
ON public.prep_list_templates
FOR ALL
USING (is_head_chef(auth.uid()));

-- Section leaders can manage their section's templates
CREATE POLICY "Section leaders manage section templates"
ON public.prep_list_templates
FOR ALL
USING (is_section_leader(auth.uid(), section_id))
WITH CHECK (is_section_leader(auth.uid(), section_id));

-- RLS policies for prep_list_comments
-- Anyone can view comments
CREATE POLICY "Anyone can view prep list comments"
ON public.prep_list_comments
FOR SELECT
USING (true);

-- ALL authenticated users can add comments (for quality issues etc)
CREATE POLICY "Authenticated users can add comments"
ON public.prep_list_comments
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
ON public.prep_list_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Head chefs can manage all comments
CREATE POLICY "Head chefs can manage comments"
ON public.prep_list_comments
FOR ALL
USING (is_head_chef(auth.uid()));

-- Update prep_lists RLS to allow ALL authenticated users to update task completion
-- Keep existing policies but add one for task ticking
CREATE POLICY "Authenticated users can tick tasks"
ON public.prep_lists
FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Add triggers for updated_at
CREATE TRIGGER update_prep_list_templates_updated_at
BEFORE UPDATE ON public.prep_list_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();