-- =============================================
-- Social Publisher: Connected Accounts
-- Stores OAuth tokens (encrypted) for each platform
-- =============================================

CREATE TABLE public.social_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform text NOT NULL CHECK (platform IN ('linkedin', 'x', 'tiktok', 'instagram')),
    platform_user_id text NOT NULL,
    display_name text,
    avatar_url text,
    access_token_encrypted text NOT NULL,
    refresh_token_encrypted text,
    token_expires_at timestamptz,
    scopes text[],
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, platform, platform_user_id)
);

-- RLS
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own social accounts"
    ON public.social_accounts FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Index for quick lookup
CREATE INDEX idx_social_accounts_user_platform
    ON public.social_accounts(user_id, platform)
    WHERE is_active = true;

-- =============================================
-- Scheduled Posts Queue
-- =============================================

CREATE TABLE public.scheduled_posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    social_account_id uuid NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
    report_id uuid,
    plan_id uuid,
    platform text NOT NULL CHECK (platform IN ('linkedin', 'x', 'tiktok', 'instagram')),
    post_content jsonb NOT NULL,
    status text DEFAULT 'queued' CHECK (status IN ('queued', 'publishing', 'published', 'failed', 'cancelled')),
    scheduled_for timestamptz NOT NULL,
    published_at timestamptz,
    platform_post_id text,
    platform_post_url text,
    last_error text,
    attempts int DEFAULT 0,
    max_attempts int DEFAULT 3,
    created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own scheduled posts"
    ON public.scheduled_posts FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Cron needs to query by status + time (service role bypasses RLS)
CREATE INDEX idx_scheduled_posts_due
    ON public.scheduled_posts(status, scheduled_for)
    WHERE status = 'queued';

CREATE INDEX idx_scheduled_posts_user
    ON public.scheduled_posts(user_id, status);

-- =============================================
-- Publish Logs (audit trail)
-- =============================================

CREATE TABLE public.publish_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scheduled_post_id uuid REFERENCES public.scheduled_posts(id) ON DELETE SET NULL,
    social_account_id uuid NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
    platform text NOT NULL,
    action text NOT NULL CHECK (action IN ('publish', 'refresh_token', 'schedule', 'cancel', 'retry')),
    status text NOT NULL CHECK (status IN ('success', 'error')),
    details jsonb,
    created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.publish_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own publish logs"
    ON public.publish_logs FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can INSERT (cron)
CREATE POLICY "Service inserts publish logs"
    ON public.publish_logs FOR INSERT
    WITH CHECK (true);

CREATE INDEX idx_publish_logs_user
    ON public.publish_logs(user_id, created_at DESC);
