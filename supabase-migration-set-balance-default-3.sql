-- Migration: Set default balance to 3 for new users
-- This ensures new users automatically get 3 free credits at database level
-- Run this in Supabase SQL Editor

-- Step 1: Ensure balance column exists (if it doesn't exist, create it with DEFAULT 3)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'balance'
  ) THEN
    ALTER TABLE users ADD COLUMN balance INTEGER DEFAULT 3;
    COMMENT ON COLUMN users.balance IS 'User credit balance. Default is 3 free credits for new users.';
  END IF;
END $$;

-- Step 2: Change the default value of existing balance column to 3
-- This only affects NEW rows, existing rows are not changed
ALTER TABLE users 
ALTER COLUMN balance SET DEFAULT 3;

-- Step 3: Update the column comment
COMMENT ON COLUMN users.balance IS 'User credit balance. Default is 3 free credits for new users. Automatically set to 3 when user is created.';

-- Step 4: Ensure existing users with NULL balance get 0 (not 3)
-- This prevents giving credits to old users who shouldn't have them
UPDATE users 
SET balance = 0 
WHERE balance IS NULL;

-- Note: This migration:
-- - Sets DEFAULT to 3 for NEW users (database-level guarantee)
-- - Does NOT change existing users' balances
-- - Works even if webhook code doesn't explicitly set balance: 3
-- - Provides a safety net at the database level

