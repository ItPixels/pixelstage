-- Migration: Add balance column to users table with default 0
-- This ensures new users get 3 credits via webhook, but existing users have 0
-- Run this in Supabase SQL Editor if the column doesn't exist

-- Ensure users table has balance column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'balance'
  ) THEN
    ALTER TABLE users ADD COLUMN balance INTEGER DEFAULT 0;
    COMMENT ON COLUMN users.balance IS 'User credit balance. New users get 3 credits via Clerk webhook.';
  END IF;
END $$;

-- Optional: Update existing users with 0 balance if NULL
UPDATE users 
SET balance = 0 
WHERE balance IS NULL;

