
-- Add function widget columns to res_widget_config
ALTER TABLE public.res_widget_config
  ADD COLUMN IF NOT EXISTS function_widget_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_function_party_size integer NOT NULL DEFAULT 200,
  ADD COLUMN IF NOT EXISTS menu_sets jsonb NOT NULL DEFAULT '["Set Menu 1","Set Menu 2","Shared Platters","Cocktail Function","Custom"]'::jsonb;

-- Allow anonymous users to insert function enquiries
CREATE POLICY "anon_function_enquiry_insert" ON public.res_functions
  FOR INSERT TO anon
  WITH CHECK (status = 'ENQUIRY');
