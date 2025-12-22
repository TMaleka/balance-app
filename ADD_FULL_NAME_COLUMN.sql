-- Add full_name column to existing users table
-- Run this in Supabase SQL Editor if your users table already exists

-- Add full_name column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('full_name', 'phone_number');
