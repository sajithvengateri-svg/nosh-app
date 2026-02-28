-- Add new fields to recipes table for tasting notes and batch recipe support
ALTER TABLE public.recipes 
ADD COLUMN IF NOT EXISTS tasting_notes TEXT,
ADD COLUMN IF NOT EXISTS is_batch_recipe BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS batch_yield_quantity NUMERIC DEFAULT 1,
ADD COLUMN IF NOT EXISTS batch_yield_unit TEXT DEFAULT 'kg';

-- Create storage bucket for recipe images
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for recipe images
CREATE POLICY "Recipe images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'recipe-images');

CREATE POLICY "Authenticated users can upload recipe images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'recipe-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update recipe images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'recipe-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete recipe images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'recipe-images' AND auth.role() = 'authenticated');