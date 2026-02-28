-- Add missing columns to corrective_actions for full Phase 3 support
ALTER TABLE public.corrective_actions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS assigned_to text,
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_by text,
  ADD COLUMN IF NOT EXISTS log_type text;

-- Add a status column to daily_compliance_logs for quick filtering  
ALTER TABLE public.daily_compliance_logs
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pass';