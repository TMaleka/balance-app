-- =====================================================
-- FIX PROFILE UPDATE PERMISSIONS
-- =====================================================
-- This script ensures users can update their own profile

-- 1. Ensure full_name and phone_number columns exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- 2. Create or replace RLS policy for users to update their own profile
-- First, enable RLS if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create policy allowing users to update their own record
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Ensure users can read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON users;

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- 4. Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users';

-- =====================================================
-- TESTING
-- =====================================================

-- Test query (run as authenticated user):
-- UPDATE users 
-- SET full_name = 'Test Name', phone_number = '1234567890'
-- WHERE id = auth.uid();

-- Verify update:
-- SELECT id, email, full_name, phone_number 
-- FROM users 
-- WHERE id = auth.uid();
