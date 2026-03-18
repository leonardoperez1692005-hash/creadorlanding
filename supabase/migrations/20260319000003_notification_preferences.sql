-- =============================================
-- Notification Preferences
-- =============================================

CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    push_enabled BOOLEAN NOT NULL DEFAULT true,
    email_enabled BOOLEAN NOT NULL DEFAULT true,
    email_digest_frequency TEXT NOT NULL DEFAULT 'weekly', -- 'daily', 'weekly', 'never'
    sentiment_alerts BOOLEAN NOT NULL DEFAULT true,
    report_ready_alerts BOOLEAN NOT NULL DEFAULT true,
    rival_activity_alerts BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own preferences"
    ON notification_preferences FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Auto-create preferences on first access (via function)
CREATE OR REPLACE FUNCTION get_or_create_notification_prefs(p_user_id UUID)
RETURNS notification_preferences AS $$
DECLARE
    prefs notification_preferences;
BEGIN
    SELECT * INTO prefs FROM notification_preferences WHERE user_id = p_user_id;
    IF NOT FOUND THEN
        INSERT INTO notification_preferences (user_id) VALUES (p_user_id)
        RETURNING * INTO prefs;
    END IF;
    RETURN prefs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
