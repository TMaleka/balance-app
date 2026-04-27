-- Create monthly_income table (mirrors monthly_savings pattern)
CREATE TABLE IF NOT EXISTS monthly_income (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Enable RLS
ALTER TABLE monthly_income ENABLE ROW LEVEL SECURITY;

-- Users can only see their own income
CREATE POLICY "Users can view own income"
  ON monthly_income FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own income
CREATE POLICY "Users can insert own income"
  ON monthly_income FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own income
CREATE POLICY "Users can update own income"
  ON monthly_income FOR UPDATE
  USING (auth.uid() = user_id);
