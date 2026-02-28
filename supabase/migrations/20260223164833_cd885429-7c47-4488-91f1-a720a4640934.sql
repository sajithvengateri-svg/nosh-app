INSERT INTO storage.buckets (id, name, public)
VALUES ('venue-photos', 'venue-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "venue_photos_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'venue-photos');

CREATE POLICY "venue_photos_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'venue-photos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "venue_photos_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'venue-photos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "venue_photos_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'venue-photos'
    AND auth.role() = 'authenticated'
  );