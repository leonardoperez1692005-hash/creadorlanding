-- Add context_prompt to political_topics for enriched AI analysis
-- Users can write extensive context about their position/proposals per topic
ALTER TABLE public.political_topics
    ADD COLUMN IF NOT EXISTS context_prompt text DEFAULT '';
