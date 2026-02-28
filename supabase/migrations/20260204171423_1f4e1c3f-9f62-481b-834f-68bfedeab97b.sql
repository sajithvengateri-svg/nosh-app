-- Create kitchen_sections table
CREATE TABLE public.kitchen_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6B7280',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  monthly_budget NUMERIC DEFAULT 0,
  current_month_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kitchen_sections ENABLE ROW LEVEL SECURITY;

-- Anyone can view kitchen sections
CREATE POLICY "Anyone can view kitchen sections"
ON public.kitchen_sections
FOR SELECT
USING (true);

-- Head chefs can manage kitchen sections
CREATE POLICY "Head chefs can manage kitchen sections"
ON public.kitchen_sections
FOR ALL
USING (is_head_chef(auth.uid()));

-- Users with calendar edit permission can manage kitchen sections
CREATE POLICY "Users with edit permission can manage kitchen sections"
ON public.kitchen_sections
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM module_permissions
    WHERE module_permissions.user_id = auth.uid()
    AND module_permissions.module = 'calendar'
    AND module_permissions.can_edit = true
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_kitchen_sections_updated_at
BEFORE UPDATE ON public.kitchen_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();