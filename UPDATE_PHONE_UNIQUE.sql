-- Update users table to make phone_number unique
-- Run this in Supabase SQL Editor

-- First, check if there are any duplicate phone numbers
SELECT phone_number, COUNT(*) as count 
FROM users 
WHERE phone_number IS NOT NULL 
GROUP BY phone_number 
HAVING COUNT(*) > 1;

-- If there are duplicates, you'll need to clean them up first
-- Then add the unique constraint:

ALTER TABLE users ADD CONSTRAINT users_phone_number_unique UNIQUE (phone_number);

-- Verify the constraint was added
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'users' 
AND constraint_name = 'users_phone_number_unique';
