
-- ═══════════════════════════════════════════════════════════════
-- Prep List Automation + Todo Kanban: Schema Changes
-- ═══════════════════════════════════════════════════════════════

-- 1. prep_list_templates: auto-generation settings
ALTER TABLE public.prep_list_templates
  ADD COLUMN IF NOT EXISTS auto_generate_time TIME DEFAULT '21:00',
  ADD COLUMN IF NOT EXISTS auto_generate_enabled BOOLEAN DEFAULT false;

-- 2. prep_lists: lifecycle & review columns
ALTER TABLE public.prep_lists
  ADD COLUMN IF NOT EXISTS is_auto_generated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS head_chef_reviewed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS head_chef_notes TEXT,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- 3. todo_items: kanban columns (section_id, assigned_to_name, archived_at)
-- Note: todo_items already has no section_id or assigned_to_name, so add them
ALTER TABLE public.todo_items
  ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.kitchen_sections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_to_name TEXT,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- 4. Update RLS: restrict DELETE on todo_items to head_chef/owner only
-- First drop existing delete policy if any
DROP POLICY IF EXISTS "Users can delete own org todo items" ON public.todo_items;
DROP POLICY IF EXISTS "Org members can delete todo items" ON public.todo_items;
DROP POLICY IF EXISTS "delete_todo_items" ON public.todo_items;

-- Create restrictive delete policy: only head chef / owner
CREATE POLICY "Only head chef or owner can delete todo items"
  ON public.todo_items
  FOR DELETE
  TO authenticated
  USING (public.is_org_head_chef(auth.uid(), org_id));

-- Ensure all org members can still SELECT, INSERT, UPDATE
-- (these should already exist, but add IF NOT EXISTS equivalent)
DROP POLICY IF EXISTS "Org members can view todo items" ON public.todo_items;
CREATE POLICY "Org members can view todo items"
  ON public.todo_items
  FOR SELECT
  TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));

DROP POLICY IF EXISTS "Org members can insert todo items" ON public.todo_items;
CREATE POLICY "Org members can insert todo items"
  ON public.todo_items
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), org_id));

DROP POLICY IF EXISTS "Org members can update todo items" ON public.todo_items;
CREATE POLICY "Org members can update todo items"
  ON public.todo_items
  FOR UPDATE
  TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));
