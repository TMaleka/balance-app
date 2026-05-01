-- Daily check-ins table for streak tracking
CREATE TABLE IF NOT EXISTS daily_checkins (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('green', 'amber', 'red')),
  had_overspend BOOLEAN NOT NULL DEFAULT false,
  resolved_overspend BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, check_date)
);

-- Enable RLS
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

-- Users can only see their own check-ins
CREATE POLICY "Users can view own checkins"
  ON daily_checkins FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own check-ins
CREATE POLICY "Users can insert own checkins"
  ON daily_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own check-ins
CREATE POLICY "Users can update own checkins"
  ON daily_checkins FOR UPDATE
  USING (auth.uid() = user_id);
