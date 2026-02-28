-- Create storage bucket for cleaning verification photos
INSERT INTO storage.buckets (id, name, public) VALUES ('cleaning-photos', 'cleaning-photos', true);

-- Storage policies for cleaning photos
CREATE POLICY "Anyone can view cleaning photos" ON storage.objects FOR SELECT USING (bucket_id = 'cleaning-photos');
CREATE POLICY "Authenticated users can upload cleaning photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'cleaning-photos' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own photos" ON storage.objects FOR UPDATE USING (bucket_id = 'cleaning-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own photos" ON storage.objects FOR DELETE USING (bucket_id = 'cleaning-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add reference_image_url column to food_safety_logs for cleaning schedules
ALTER TABLE public.food_safety_logs ADD COLUMN IF NOT EXISTS reference_image_url TEXT;
ALTER TABLE public.food_safety_logs ADD COLUMN IF NOT EXISTS verification_image_url TEXT;
ALTER TABLE public.food_safety_logs ADD COLUMN IF NOT EXISTS ai_verification_status TEXT CHECK (ai_verification_status IN ('pending', 'approved', 'rejected', 'not_required'));
ALTER TABLE public.food_safety_logs ADD COLUMN IF NOT EXISTS ai_verification_notes TEXT;

-- Create cleaning_areas table for reference photos
CREATE TABLE IF NOT EXISTS public.cleaning_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT,
    reference_image_url TEXT,
    cleaning_frequency TEXT DEFAULT 'daily',
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cleaning_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cleaning areas" ON public.cleaning_areas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Head chefs can manage cleaning areas" ON public.cleaning_areas FOR ALL USING (public.is_head_chef(auth.uid()));
CREATE POLICY "Users with edit permission can manage cleaning areas" ON public.cleaning_areas FOR ALL USING (
    EXISTS (SELECT 1 FROM public.module_permissions WHERE user_id = auth.uid() AND module = 'food-safety' AND can_edit = true)
);

CREATE TRIGGER update_cleaning_areas_updated_at BEFORE UPDATE ON public.cleaning_areas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();