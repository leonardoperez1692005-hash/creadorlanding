-- =============================================
-- Candidate Photos — Real photos for composition
-- =============================================

-- 1. Table for candidate photo metadata
CREATE TABLE IF NOT EXISTS public.candidate_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    storage_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    label TEXT NOT NULL DEFAULT '',
    description TEXT DEFAULT '',
    tags TEXT[] DEFAULT '{}',
    is_primary BOOLEAN DEFAULT false,
    width INTEGER NOT NULL DEFAULT 0,
    height INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.candidate_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own candidate photos"
    ON public.candidate_photos FOR ALL
    USING (auth.uid() = user_id);

CREATE INDEX idx_candidate_photos_user
    ON public.candidate_photos(user_id, created_at DESC);

-- 2. Storage bucket for candidate photos (10MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('candidate-photos', 'candidate-photos', true, 10485760)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload candidate photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'candidate-photos');

CREATE POLICY "Public read for candidate photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'candidate-photos');

CREATE POLICY "Users can delete own candidate photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'candidate-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Add composition columns to generated_images
ALTER TABLE public.generated_images
    ADD COLUMN IF NOT EXISTS generation_mode TEXT DEFAULT 'ai'
        CHECK (generation_mode IN ('ai', 'composition'));

ALTER TABLE public.generated_images
    ADD COLUMN IF NOT EXISTS composition_data JSONB;

-- 4. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
