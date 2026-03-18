-- =============================================
-- Strategic Knowledge Chunks — Improved RAG Search
-- =============================================
-- Splits long strategic_knowledge entries into ~500 char chunks
-- and provides ts_rank_cd scoring via a SQL function.

-- 1. Chunks table
CREATE TABLE IF NOT EXISTS strategic_knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES strategic_knowledge(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL DEFAULT 0,
    content TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. GIN index for FTS with Spanish config
CREATE INDEX IF NOT EXISTS idx_skc_fts
    ON strategic_knowledge_chunks
    USING GIN (to_tsvector('spanish', content));

CREATE INDEX IF NOT EXISTS idx_skc_user
    ON strategic_knowledge_chunks (user_id);

CREATE INDEX IF NOT EXISTS idx_skc_parent
    ON strategic_knowledge_chunks (parent_id);

-- 3. RLS
ALTER TABLE strategic_knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own chunks"
    ON strategic_knowledge_chunks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chunks"
    ON strategic_knowledge_chunks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chunks"
    ON strategic_knowledge_chunks FOR DELETE
    USING (auth.uid() = user_id);

-- 4. Function to auto-generate chunks on insert
CREATE OR REPLACE FUNCTION generate_knowledge_chunks()
RETURNS TRIGGER AS $$
DECLARE
    chunk_text TEXT;
    chunk_idx INT := 0;
    paragraphs TEXT[];
    para TEXT;
    current_chunk TEXT := '';
BEGIN
    -- Delete existing chunks for this entry (handles updates)
    DELETE FROM strategic_knowledge_chunks WHERE parent_id = NEW.id;

    -- Split by double newline (paragraphs) or single newline
    paragraphs := string_to_array(regexp_replace(NEW.content, E'\r\n', E'\n', 'g'), E'\n\n');

    FOREACH para IN ARRAY paragraphs LOOP
        -- Skip empty paragraphs
        IF trim(para) = '' THEN CONTINUE; END IF;

        -- If adding this paragraph would exceed ~500 chars, flush current chunk
        IF length(current_chunk) > 0 AND length(current_chunk) + length(para) > 500 THEN
            INSERT INTO strategic_knowledge_chunks (parent_id, chunk_index, content, user_id)
            VALUES (NEW.id, chunk_idx, trim(current_chunk), NEW.user_id);
            chunk_idx := chunk_idx + 1;
            current_chunk := '';
        END IF;

        -- Append paragraph
        IF length(current_chunk) > 0 THEN
            current_chunk := current_chunk || E'\n\n' || para;
        ELSE
            current_chunk := para;
        END IF;
    END LOOP;

    -- Flush remaining content
    IF length(trim(current_chunk)) > 0 THEN
        INSERT INTO strategic_knowledge_chunks (parent_id, chunk_index, content, user_id)
        VALUES (NEW.id, chunk_idx, trim(current_chunk), NEW.user_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger on insert AND update
CREATE TRIGGER trg_generate_knowledge_chunks
    AFTER INSERT OR UPDATE OF content ON strategic_knowledge
    FOR EACH ROW
    EXECUTE FUNCTION generate_knowledge_chunks();

-- 6. Search function with ts_rank_cd scoring
CREATE OR REPLACE FUNCTION search_knowledge_chunks(
    p_user_id UUID,
    p_query TEXT,
    p_top_k INT DEFAULT 5
)
RETURNS TABLE (
    chunk_id UUID,
    parent_id UUID,
    chunk_index INT,
    content TEXT,
    title TEXT,
    category TEXT,
    source_url TEXT,
    source_name TEXT,
    score FLOAT
) AS $$
DECLARE
    tsquery_val TSQUERY;
BEGIN
    -- Build tsquery from input (websearch handles natural language)
    tsquery_val := websearch_to_tsquery('spanish', p_query);

    RETURN QUERY
    SELECT
        c.id AS chunk_id,
        c.parent_id,
        c.chunk_index,
        c.content,
        sk.title,
        sk.category,
        sk.source_url,
        sk.source_name,
        ts_rank_cd(
            setweight(to_tsvector('spanish', coalesce(sk.title, '')), 'A') ||
            setweight(to_tsvector('spanish', c.content), 'D'),
            tsquery_val
        )::FLOAT AS score
    FROM strategic_knowledge_chunks c
    JOIN strategic_knowledge sk ON sk.id = c.parent_id
    WHERE c.user_id = p_user_id
      AND (
          to_tsvector('spanish', c.content) @@ tsquery_val
          OR to_tsvector('spanish', coalesce(sk.title, '')) @@ tsquery_val
      )
    ORDER BY score DESC
    LIMIT p_top_k;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Backfill existing entries (trigger fires on UPDATE)
-- This updates content to itself, triggering chunk generation
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN SELECT id, content FROM strategic_knowledge LOOP
        UPDATE strategic_knowledge SET content = rec.content WHERE id = rec.id;
    END LOOP;
END;
$$;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
