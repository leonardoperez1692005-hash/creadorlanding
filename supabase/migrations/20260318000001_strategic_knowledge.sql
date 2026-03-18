-- Strategic Knowledge Base — user-curated political strategy content
-- Used by the strategic agent (RAG) to give advice grounded in real methodology

CREATE TABLE IF NOT EXISTS public.strategic_knowledge (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    content         TEXT NOT NULL,
    category        TEXT NOT NULL DEFAULT 'general',
    -- Categories: 'campaign_case' | 'framework' | 'tactic' | 'speech' | 'lesson' | 'general'
    source_url      TEXT DEFAULT '',
    source_name     TEXT DEFAULT '',
    tags            TEXT[] DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sk_user ON public.strategic_knowledge(user_id);
CREATE INDEX IF NOT EXISTS idx_sk_user_category ON public.strategic_knowledge(user_id, category);
CREATE INDEX IF NOT EXISTS idx_sk_created ON public.strategic_knowledge(created_at DESC);

-- Full-text search (Spanish)
CREATE INDEX IF NOT EXISTS idx_sk_fts ON public.strategic_knowledge
    USING GIN (to_tsvector('spanish', title || ' ' || content));

-- RLS
ALTER TABLE public.strategic_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own strategic knowledge"
    ON public.strategic_knowledge
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
