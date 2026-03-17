-- Add source_meta JSONB column to sentiment_snapshots
-- Stores: total sources, breakdown by platform, date range of scraped content
-- This data was previously only in memory and lost on page refresh

ALTER TABLE sentiment_snapshots
ADD COLUMN IF NOT EXISTS source_meta JSONB DEFAULT NULL;

COMMENT ON COLUMN sentiment_snapshots.source_meta IS 'Source metadata: {total, breakdown: {twitter, reddit, youtube, serp, nitter}, dateRange: {from, to}}';

NOTIFY pgrst, 'reload schema';
