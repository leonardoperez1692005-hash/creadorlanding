-- =============================================
-- ZMOT Pipeline Tables: intel_reports + attack_plans
-- =============================================

-- Intel Reports (generalized competitive intelligence)
CREATE TABLE IF NOT EXISTS intel_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL DEFAULT 'market',
    targets JSONB NOT NULL,
    raw_data JSONB,
    analysis JSONB NOT NULL,
    meta JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Attack Plans (ZMOT core: weakness × strength → content)
CREATE TABLE IF NOT EXISTS attack_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    intel_report_id UUID REFERENCES intel_reports(id) ON DELETE SET NULL,
    attack_matrix JSONB NOT NULL,
    generated_outputs JSONB,
    landing_project_id UUID,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE intel_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own intel reports"
    ON intel_reports FOR ALL
    USING (auth.uid() = user_id);

ALTER TABLE attack_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own attack plans"
    ON attack_plans FOR ALL
    USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_intel_reports_user ON intel_reports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attack_plans_user ON attack_plans(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attack_plans_intel ON attack_plans(intel_report_id);
