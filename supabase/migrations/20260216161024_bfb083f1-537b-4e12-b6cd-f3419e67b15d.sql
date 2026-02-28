
-- Run sheets for daily service task management
CREATE TABLE public.bev_run_sheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  shift TEXT NOT NULL DEFAULT 'service',
  status TEXT NOT NULL DEFAULT 'draft',
  created_by TEXT,
  posted_to_wall BOOLEAN NOT NULL DEFAULT false,
  is_template BOOLEAN NOT NULL DEFAULT false,
  template_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.bev_run_sheet_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_sheet_id UUID NOT NULL REFERENCES public.bev_run_sheets(id) ON DELETE CASCADE,
  org_id UUID NOT NULL,
  task TEXT NOT NULL,
  assigned_to TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'normal',
  sort_order INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bev_run_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bev_run_sheet_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for run sheets
CREATE POLICY "Org members can view run sheets" ON public.bev_run_sheets
  FOR SELECT USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Bar managers can manage run sheets" ON public.bev_run_sheets
  FOR ALL USING (public.is_bar_manager(auth.uid()));

-- RLS policies for run sheet tasks
CREATE POLICY "Org members can view run sheet tasks" ON public.bev_run_sheet_tasks
  FOR SELECT USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Bar managers can manage run sheet tasks" ON public.bev_run_sheet_tasks
  FOR ALL USING (public.is_bar_manager(auth.uid()));

-- Indexes
CREATE INDEX idx_bev_run_sheets_org_date ON public.bev_run_sheets(org_id, date);
CREATE INDEX idx_bev_run_sheet_tasks_sheet ON public.bev_run_sheet_tasks(run_sheet_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.bev_run_sheets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bev_run_sheet_tasks;

-- Trigger for updated_at
CREATE TRIGGER update_bev_run_sheets_updated_at
  BEFORE UPDATE ON public.bev_run_sheets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
