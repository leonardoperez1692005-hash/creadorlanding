-- =============================================
-- Unify Identity: Merge political_campaign_profiles into brand_identities
-- One table, one row per user — unified brain
-- =============================================

-- Step 1: Add political columns to brand_identities (all nullable)
ALTER TABLE brand_identities
  ADD COLUMN IF NOT EXISTS campaign_name TEXT,
  ADD COLUMN IF NOT EXISTS candidate_name TEXT,
  ADD COLUMN IF NOT EXISTS party TEXT,
  ADD COLUMN IF NOT EXISTS ideology_spectrum TEXT,
  ADD COLUMN IF NOT EXISTS core_positions JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS key_proposals JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS target_voters TEXT,
  ADD COLUMN IF NOT EXISTS coalition_allies JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS red_lines JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tone_guidelines TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS communication_style TEXT DEFAULT 'propositivo',
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'ar';

-- Step 2: Migrate existing data from political_campaign_profiles → brand_identities
-- Note: coalition_allies and red_lines in source are text[] — convert to jsonb
INSERT INTO brand_identities (user_id, campaign_name, candidate_name, party,
  ideology_spectrum, core_positions, key_proposals, target_voters,
  coalition_allies, red_lines, tone_guidelines, communication_style, country)
SELECT
  user_id,
  campaign_name,
  candidate_name,
  party,
  ideology_spectrum,
  core_positions,
  key_proposals,
  target_voters,
  to_jsonb(coalition_allies),
  to_jsonb(red_lines),
  tone_guidelines,
  communication_style,
  country
FROM political_campaign_profiles
ON CONFLICT (user_id) DO UPDATE SET
  campaign_name = EXCLUDED.campaign_name,
  candidate_name = EXCLUDED.candidate_name,
  party = EXCLUDED.party,
  ideology_spectrum = EXCLUDED.ideology_spectrum,
  core_positions = EXCLUDED.core_positions,
  key_proposals = EXCLUDED.key_proposals,
  target_voters = EXCLUDED.target_voters,
  coalition_allies = EXCLUDED.coalition_allies,
  red_lines = EXCLUDED.red_lines,
  tone_guidelines = EXCLUDED.tone_guidelines,
  communication_style = EXCLUDED.communication_style,
  country = EXCLUDED.country;

-- Step 3: Drop the old table
DROP TABLE IF EXISTS political_campaign_profiles;
