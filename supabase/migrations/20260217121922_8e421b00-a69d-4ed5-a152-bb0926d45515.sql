-- Add payday column to labour_settings (day of week: 1=Monday, 7=Sunday)
ALTER TABLE public.labour_settings 
ADD COLUMN IF NOT EXISTS payday integer NOT NULL DEFAULT 1;

-- Add comment for clarity
COMMENT ON COLUMN public.labour_settings.payday IS 'Day of week for pay day: 1=Monday through 7=Sunday';