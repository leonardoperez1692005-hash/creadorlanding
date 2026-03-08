-- =============================================
-- Expand brand_identities with business data
-- Services, FAQ, testimonials, stats, team, differentiators
-- =============================================

ALTER TABLE brand_identities
  ADD COLUMN IF NOT EXISTS services jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS faqs jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS testimonials jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS stats jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS team_members jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS differentiators text DEFAULT '';
