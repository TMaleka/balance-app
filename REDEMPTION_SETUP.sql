-- Create points_redemptions table for tracking cashback redemptions
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS points_redemptions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points_redeemed INTEGER NOT NULL,
  redemption_type VARCHAR(50) NOT NULL DEFAULT 'cashback',
  redemption_value DECIMAL(10,2) NOT NULL,
  partner_id VARCHAR(20) REFERENCES partners(partner_id),
  status VARCHAR(20) DEFAULT 'completed',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_points_redemptions_user_id ON points_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_redemptions_created_at ON points_redemptions(created_at);
CREATE INDEX IF NOT EXISTS idx_points_redemptions_status ON points_redemptions(status);

-- Add RLS (Row Level Security) policies
ALTER TABLE points_redemptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own redemptions
CREATE POLICY IF NOT EXISTS "Users can view own redemptions" ON points_redemptions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own redemptions (for the API)
CREATE POLICY IF NOT EXISTS "Users can insert own redemptions" ON points_redemptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Verify the table was created
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'points_redemptions' 
ORDER BY ordinal_position;
