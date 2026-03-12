-- Create storage bucket for video clips (used by Shotstack integration)
INSERT INTO storage.buckets (id, name, public)
VALUES ('video-clips', 'video-clips', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload clips
CREATE POLICY "Users can upload video clips"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'video-clips');

-- Allow public read access (Shotstack needs to download)
CREATE POLICY "Public read for video clips"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'video-clips');

-- Allow users to delete their own clips
CREATE POLICY "Users can delete own video clips"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'video-clips' AND (storage.foldername(name))[2] = auth.uid()::text);
