-- =============================================
-- Push Notifications — Subscriptions + In-App Notifications
-- =============================================

-- 1. Push subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    user_agent TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_sub_user ON push_subscriptions(user_id);

-- 2. In-app notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    url TEXT DEFAULT '',
    type TEXT NOT NULL DEFAULT 'info', -- info, report_ready, sentiment_alert, rival_activity
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_user_unread
    ON notifications(user_id, is_read)
    WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_notif_created
    ON notifications(user_id, created_at DESC);

-- 3. RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own subscriptions"
    ON push_subscriptions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Service role inserts notifications (server-side)
CREATE POLICY "Service role inserts notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
