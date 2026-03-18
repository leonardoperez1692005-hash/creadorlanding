-- Strategic Chat Sessions — persistent conversation history for the political strategist agent
-- Replaces localStorage-only persistence with DB storage

CREATE TABLE public.strategic_chat_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title           TEXT NOT NULL DEFAULT 'Nueva conversacion',
    messages_json   JSONB NOT NULL DEFAULT '[]'::jsonb,
    message_count   INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_chat_sessions_user ON public.strategic_chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_updated ON public.strategic_chat_sessions(user_id, updated_at DESC);

-- RLS
ALTER TABLE public.strategic_chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own chat sessions"
    ON public.strategic_chat_sessions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_chat_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_chat_session_updated
    BEFORE UPDATE ON public.strategic_chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_session_timestamp();
