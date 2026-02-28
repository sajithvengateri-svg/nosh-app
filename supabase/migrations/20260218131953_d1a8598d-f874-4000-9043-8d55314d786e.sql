
-- Create support_tickets table
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  created_by uuid NOT NULL,
  created_by_name text NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  attachment_urls text[] DEFAULT '{}',
  admin_response text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- RLS: org head_chefs/owners can insert
CREATE POLICY "Org admins can insert tickets"
ON public.support_tickets FOR INSERT
TO authenticated
WITH CHECK (public.is_org_head_chef(auth.uid(), org_id));

-- RLS: org head_chefs/owners can read their org tickets
CREATE POLICY "Org admins can read their tickets"
ON public.support_tickets FOR SELECT
TO authenticated
USING (public.is_org_head_chef(auth.uid(), org_id));

-- RLS: org head_chefs/owners can update their org tickets
CREATE POLICY "Org admins can update their tickets"
ON public.support_tickets FOR UPDATE
TO authenticated
USING (public.is_org_head_chef(auth.uid(), org_id));

-- Create storage bucket for support attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('support-attachments', 'support-attachments', false);

-- Storage: authenticated users can upload to their org folder
CREATE POLICY "Authenticated users can upload support attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'support-attachments');

-- Storage: authenticated users can read support attachments from their org
CREATE POLICY "Authenticated users can read support attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'support-attachments');

-- Storage: authenticated users can delete their own support attachments
CREATE POLICY "Authenticated users can delete support attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'support-attachments');
