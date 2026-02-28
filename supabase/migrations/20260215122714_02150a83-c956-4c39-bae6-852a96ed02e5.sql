
ALTER TABLE public.food_safety_logs ADD COLUMN IF NOT EXISTS receiving_data jsonb DEFAULT NULL;
ALTER TABLE public.food_safety_logs ADD COLUMN IF NOT EXISTS temp_image_url text DEFAULT NULL;
