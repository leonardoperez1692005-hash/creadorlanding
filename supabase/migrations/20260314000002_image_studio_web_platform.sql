-- =============================================
-- Image Studio — Add 'web' platform + '1920x800' size
-- Extend CHECK constraints on generated_images
-- =============================================

-- Drop old platform constraint and recreate with 'web'
ALTER TABLE public.generated_images
    DROP CONSTRAINT IF EXISTS generated_images_platform_check;

ALTER TABLE public.generated_images
    ADD CONSTRAINT generated_images_platform_check
    CHECK (platform IN ('instagram', 'linkedin', 'x', 'tiktok', 'general', 'web'));

-- Drop old size constraint and recreate with '1920x800'
ALTER TABLE public.generated_images
    DROP CONSTRAINT IF EXISTS generated_images_size_check;

ALTER TABLE public.generated_images
    ADD CONSTRAINT generated_images_size_check
    CHECK (size IN ('1024x1024', '1536x1024', '1024x1536', '1920x800'));

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
