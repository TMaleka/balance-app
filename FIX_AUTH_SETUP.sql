-- Fix Authentication Setup for Balance App
-- This script ensures new users can sign up and log in seamlessly
-- Run this in Supabase SQL Editor

-- Step 1: Update the trigger function to handle phone number from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, phone_number, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'phone_number',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Update RLS policies to allow proper access
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- Create comprehensive RLS policies for users table
CREATE POLICY "Users can view own data" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" 
  ON users FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" 
  ON users FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Step 4: Ensure the users table has the correct structure
-- Add phone_number column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE users ADD COLUMN phone_number VARCHAR(15);
  END IF;
END $$;

-- Step 5: Remove unique constraint on phone_number if it exists (can cause issues)
-- We'll handle uniqueness at the application level for better error messages
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_phone_number_key'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_phone_number_key;
  END IF;
END $$;

-- Step 6: Verify setup
SELECT 
  'Trigger exists: ' || EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created'
  )::text as trigger_status,
  'RLS enabled: ' || (
    SELECT relrowsecurity FROM pg_class 
    WHERE relname = 'users'
  )::text as rls_status,
  'Policies count: ' || (
    SELECT COUNT(*) FROM pg_policies 
    WHERE tablename = 'users'
  )::text as policies_count;
