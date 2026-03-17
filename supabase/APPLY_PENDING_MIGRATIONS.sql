-- =============================================
-- SCRIPT CONSOLIDADO — 7 Migraciones Pendientes
-- Aplicar en SQL Editor de Supabase (app.supabase.com)
-- Fecha: 2026-03-16
-- Orden: image_studio → plan_permissions → RAG → statements → candidate_photos → web_platform → multi_source
-- =============================================

-- =============================================
-- 1/7: Image Studio — Tables + Storage
-- (20260312000002_image_studio.sql)
-- =============================================

CREATE TABLE IF NOT EXISTS public.brand_image_styles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    color_palette JSONB DEFAULT '[]'::jsonb,
    style_keywords JSONB DEFAULT '[]'::jsonb,
    mood_descriptors JSONB DEFAULT '[]'::jsonb,
    avoid_keywords JSONB DEFAULT '[]'::jsonb,
    brand_name TEXT DEFAULT '',
    industry TEXT DEFAULT '',
    visual_references TEXT DEFAULT '',
    preferred_font_style TEXT DEFAULT 'sans-serif'
        CHECK (preferred_font_style IN ('sans-serif', 'serif', 'display', 'handwritten')),
    background_style TEXT DEFAULT 'minimal'
        CHECK (background_style IN ('gradient', 'solid', 'photographic', 'abstract', 'minimal')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

ALTER TABLE public.brand_image_styles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users manage own brand image styles"
        ON public.brand_image_styles FOR ALL
        USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.generated_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    storage_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    prompt TEXT NOT NULL,
    revised_prompt TEXT,
    platform TEXT NOT NULL DEFAULT 'general'
        CHECK (platform IN ('instagram', 'linkedin', 'x', 'tiktok', 'general')),
    size TEXT NOT NULL DEFAULT '1024x1024'
        CHECK (size IN ('1024x1024', '1536x1024', '1024x1536')),
    quality TEXT NOT NULL DEFAULT 'low'
        CHECK (quality IN ('low', 'medium', 'high')),
    post_reference JSONB,
    brand_style_id UUID REFERENCES public.brand_image_styles(id) ON DELETE SET NULL,
    tags JSONB DEFAULT '[]'::jsonb,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users manage own generated images"
        ON public.generated_images FOR ALL
        USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_generated_images_user
    ON public.generated_images(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generated_images_platform
    ON public.generated_images(user_id, platform);

INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-images', 'generated-images', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
    CREATE POLICY "Users can upload generated images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'generated-images');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Public read for generated images"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'generated-images');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete own generated images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'generated-images'
        AND (storage.foldername(name))[1] = 'images'
        AND (storage.foldername(name))[2] = auth.uid()::text
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- 2/7: Plan Permissions
-- (20260312000003_plan_permissions.sql)
-- =============================================

ALTER TABLE public.plans
    ADD COLUMN IF NOT EXISTS max_ai_analyses INTEGER NOT NULL DEFAULT 0;

-- =============================================
-- 3/7: Political Knowledge Corpora (RAG)
-- (20260313000003_political_knowledge_corpora.sql)
-- =============================================

CREATE TABLE IF NOT EXISTS public.political_knowledge_corpora (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    politician_handle TEXT NOT NULL,
    politician_name   TEXT,
    corpus_name       TEXT NOT NULL UNIQUE,
    statement_count   INT DEFAULT 0,
    topics_indexed    TEXT[] DEFAULT '{}',
    last_indexed_at   TIMESTAMPTZ,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pkc_user_handle ON public.political_knowledge_corpora(user_id, politician_handle);
CREATE INDEX IF NOT EXISTS idx_pkc_user ON public.political_knowledge_corpora(user_id);

ALTER TABLE public.political_knowledge_corpora ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users manage their own knowledge corpora"
        ON public.political_knowledge_corpora
        FOR ALL
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- 4/7: Political Statements (RAG — FTS)
-- (20260313000004_political_statements.sql)
-- =============================================

CREATE TABLE IF NOT EXISTS public.political_statements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    politician_handle TEXT NOT NULL,
    politician_name TEXT,
    topic           TEXT NOT NULL,
    statement_text  TEXT NOT NULL,
    source_url      TEXT DEFAULT '',
    source_title    TEXT DEFAULT '',
    statement_date  TEXT DEFAULT '',
    source_type     TEXT DEFAULT 'other',
    platform        TEXT DEFAULT 'web',
    indexed_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ps_user_handle     ON public.political_statements(user_id, politician_handle);
CREATE INDEX IF NOT EXISTS idx_ps_topic           ON public.political_statements(user_id, politician_handle, topic);
CREATE INDEX IF NOT EXISTS idx_ps_indexed_at      ON public.political_statements(indexed_at DESC);

-- Full-text search in Spanish
CREATE INDEX IF NOT EXISTS idx_ps_fts ON public.political_statements
    USING gin(to_tsvector('spanish', statement_text));

ALTER TABLE public.political_statements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users manage their own statements"
        ON public.political_statements
        FOR ALL
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- 5/7: Candidate Photos + Composition columns
-- (20260314000001_candidate_photos.sql)
-- =============================================

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

DO $$ BEGIN
    CREATE POLICY "Users manage own candidate photos"
        ON public.candidate_photos FOR ALL
        USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_candidate_photos_user
    ON public.candidate_photos(user_id, created_at DESC);

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('candidate-photos', 'candidate-photos', true, 10485760)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
    CREATE POLICY "Users can upload candidate photos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'candidate-photos');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Public read for candidate photos"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'candidate-photos');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete own candidate photos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'candidate-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Composition columns on generated_images
ALTER TABLE public.generated_images
    ADD COLUMN IF NOT EXISTS generation_mode TEXT DEFAULT 'ai';

-- Add CHECK for generation_mode safely
DO $$ BEGIN
    ALTER TABLE public.generated_images
        ADD CONSTRAINT generated_images_generation_mode_check
        CHECK (generation_mode IN ('ai', 'composition'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.generated_images
    ADD COLUMN IF NOT EXISTS composition_data JSONB;

-- =============================================
-- 6/7: Image Studio — web platform + 1920x800
-- (20260314000002_image_studio_web_platform.sql)
-- =============================================

-- Drop old constraints and recreate with expanded values
ALTER TABLE public.generated_images
    DROP CONSTRAINT IF EXISTS generated_images_platform_check;

ALTER TABLE public.generated_images
    ADD CONSTRAINT generated_images_platform_check
    CHECK (platform IN ('instagram', 'linkedin', 'x', 'tiktok', 'general', 'web'));

ALTER TABLE public.generated_images
    DROP CONSTRAINT IF EXISTS generated_images_size_check;

ALTER TABLE public.generated_images
    ADD CONSTRAINT generated_images_size_check
    CHECK (size IN ('1024x1024', '1536x1024', '1024x1536', '1920x800'));

-- =============================================
-- 7/7: Multi-Source Intel — Reddit, YouTube, Trends
-- (20260316000001_multi_source_intel.sql)
-- =============================================

-- Add multi-source columns to political_statements
-- (source_type already exists from migration 4, so IF NOT EXISTS handles it)
ALTER TABLE public.political_statements
    ADD COLUMN IF NOT EXISTS source_platform TEXT DEFAULT 'x',
    ADD COLUMN IF NOT EXISTS engagement_likes INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS engagement_retweets INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS engagement_replies INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS author_followers INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS reliability_score REAL DEFAULT 0.5;

-- Update source_type CHECK to include new platforms
-- (original from migration 4 had no CHECK, so we add it now)
DO $$ BEGIN
    ALTER TABLE public.political_statements
        ADD CONSTRAINT political_statements_source_type_check
        CHECK (source_type IN ('tweet', 'news', 'interview', 'official', 'other',
                               'reddit_post', 'reddit_comment', 'youtube_comment', 'google_trends'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes for multi-source queries
CREATE INDEX IF NOT EXISTS idx_statements_source_type
    ON public.political_statements (user_id, source_type);

CREATE INDEX IF NOT EXISTS idx_statements_engagement
    ON public.political_statements (user_id, politician_handle, engagement_likes DESC);

-- YouTube video cache
CREATE TABLE IF NOT EXISTS public.youtube_video_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    channel_title TEXT NOT NULL DEFAULT '',
    search_query TEXT NOT NULL DEFAULT '',
    published_at TIMESTAMPTZ,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, video_id)
);

ALTER TABLE public.youtube_video_cache ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users manage own video cache"
        ON public.youtube_video_cache
        FOR ALL
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- FINAL: Reload PostgREST schema
-- =============================================
NOTIFY pgrst, 'reload schema';

-- =============================================
-- RESUMEN DE LO QUE SE CREÓ:
--
-- TABLAS NUEVAS (5):
--   1. brand_image_styles — estilos de imagen por marca
--   2. generated_images — galería de imágenes generadas
--   3. political_knowledge_corpora — corpus RAG por rival
--   4. political_statements — declaraciones con FTS español
--   5. candidate_photos — fotos reales del candidato
--   6. youtube_video_cache — cache de videos YouTube
--
-- COLUMNAS NUEVAS:
--   - plans.max_ai_analyses (permisos de plan)
--   - generated_images.generation_mode ('ai'|'composition')
--   - generated_images.composition_data (JSONB)
--   - political_statements.source_platform, engagement_*, reliability_score
--
-- CONSTRAINTS ACTUALIZADOS:
--   - generated_images.platform: + 'web'
--   - generated_images.size: + '1920x800'
--   - political_statements.source_type: + reddit_post, reddit_comment, youtube_comment, google_trends
--
-- STORAGE BUCKETS (2):
--   - generated-images (público)
--   - candidate-photos (público, 10MB limit)
--
-- ÍNDICES (7 nuevos)
-- RLS + POLICIES en todas las tablas
-- =============================================
