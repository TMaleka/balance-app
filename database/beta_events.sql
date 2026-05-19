-- Beta event tracking table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS beta_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  event TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying by user and event type
CREATE INDEX IF NOT EXISTS idx_beta_events_user ON beta_events(user_id);
CREATE INDEX IF NOT EXISTS idx_beta_events_event ON beta_events(event);
CREATE INDEX IF NOT EXISTS idx_beta_events_created ON beta_events(created_at DESC);

-- RLS: users can insert their own events, admins can read all
ALTER TABLE beta_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own events"
  ON beta_events FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view own events"
  ON beta_events FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- Useful queries for analyzing beta data:
--
-- Event counts by type:
-- SELECT event, COUNT(*) FROM beta_events GROUP BY event ORDER BY count DESC;
--
-- Daily active users:
-- SELECT check_date, COUNT(DISTINCT user_id) FROM (
--   SELECT user_id, created_at::date AS check_date FROM beta_events
-- ) t GROUP BY check_date ORDER BY check_date DESC;
--
-- Onboarding funnel:
-- SELECT event, COUNT(DISTINCT user_id) FROM beta_events
-- WHERE event LIKE 'onboarding%' GROUP BY event;
--
-- Churn risk users:
-- SELECT user_id, properties->>'days_since_last' AS days_away
-- FROM beta_events WHERE event = 'churn_risk'
-- ORDER BY created_at DESC;
-- =====================================================
