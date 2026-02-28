
-- Create todo_items table
CREATE TABLE public.todo_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  quantity text,
  unit text,
  status text NOT NULL DEFAULT 'pending',
  priority text NOT NULL DEFAULT 'medium',
  due_date date,
  source_type text NOT NULL DEFAULT 'manual',
  source_recipe_id uuid,
  source_batch_code text,
  photo_url text,
  photo_note text,
  created_by uuid,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create todo_templates table
CREATE TABLE public.todo_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_todo_items_org_status ON public.todo_items (org_id, status);
CREATE INDEX idx_todo_items_org_category ON public.todo_items (org_id, category);
CREATE INDEX idx_todo_items_due_date ON public.todo_items (due_date);
CREATE INDEX idx_todo_templates_org ON public.todo_templates (org_id);

-- Updated_at triggers
CREATE TRIGGER update_todo_items_updated_at
  BEFORE UPDATE ON public.todo_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_todo_templates_updated_at
  BEFORE UPDATE ON public.todo_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.todo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todo_templates ENABLE ROW LEVEL SECURITY;

-- RLS for todo_items
CREATE POLICY "Org members can view todo items"
  ON public.todo_items FOR SELECT
  TO authenticated
  USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Org members can insert todo items"
  ON public.todo_items FOR INSERT
  TO authenticated
  WITH CHECK (org_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Org members can update todo items"
  ON public.todo_items FOR UPDATE
  TO authenticated
  USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Org members can delete todo items"
  ON public.todo_items FOR DELETE
  TO authenticated
  USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- RLS for todo_templates
CREATE POLICY "Org members can view todo templates"
  ON public.todo_templates FOR SELECT
  TO authenticated
  USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Org members can insert todo templates"
  ON public.todo_templates FOR INSERT
  TO authenticated
  WITH CHECK (org_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Org members can update todo templates"
  ON public.todo_templates FOR UPDATE
  TO authenticated
  USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Org members can delete todo templates"
  ON public.todo_templates FOR DELETE
  TO authenticated
  USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- Create todo-photos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('todo-photos', 'todo-photos', true);

-- Storage RLS for todo-photos
CREATE POLICY "Authenticated users can upload todo photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'todo-photos');

CREATE POLICY "Anyone can view todo photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'todo-photos');

CREATE POLICY "Authenticated users can delete todo photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'todo-photos');
