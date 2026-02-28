-- Create debug log table for auth trigger errors
CREATE TABLE IF NOT EXISTS public._auth_debug_log (
  id serial PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  step text,
  error_msg text,
  user_email text,
  user_id uuid
);

-- Allow anon to read for debugging
ALTER TABLE public._auth_debug_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read debug log" ON public._auth_debug_log FOR SELECT USING (true);
