-- =============================================
-- Multi-Source Political Intelligence
-- Extends political_statements for Reddit, YouTube, Google Trends
-- Creates youtube_video_cache table
-- =============================================

-- 1. Add new columns to political_statements for multi-source support
ALTER TABLE public.political_statements
    ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'tweet'
        CHECK (source_type IN ('tweet', 'news', 'interview', 'official', 'other',
                               'reddit_post', 'reddit_comment', 'youtube_comment', 'google_trends')),
    ADD COLUMN IF NOT EXISTS source_platform TEXT DEFAULT 'x',
    ADD COLUMN IF NOT EXISTS engagement_likes INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS engagement_retweets INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS engagement_replies INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS author_followers INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS reliability_score REAL DEFAULT 0.5;

-- 2. Indexes for new query patterns
CREATE INDEX IF NOT EXISTS idx_statements_source_type
    ON public.political_statements (user_id, source_type);

CREATE INDEX IF NOT EXISTS idx_statements_engagement
    ON public.political_statements (user_id, politician_handle, engagement_likes DESC);

-- 3. YouTube video cache (avoid wasting 100 units/search on search.list)
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

CREATE POLICY "Users manage own video cache"
    ON public.youtube_video_cache
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
