-- Stripe Production Payment System - Database Schema
-- Run this migration in your Supabase SQL Editor

-- 1. Stripe Events table (idempotency tracking)
CREATE TABLE IF NOT EXISTS stripe_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  livemode BOOLEAN NOT NULL,
  payload_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  payment_intent_id TEXT UNIQUE,
  user_id TEXT NOT NULL,
  credits INTEGER NOT NULL,
  amount INTEGER NOT NULL, -- in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, refunded, disputed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  refunded_at TIMESTAMPTZ
);

-- 3. Credit Ledger table (audit trail)
CREATE TABLE IF NOT EXISTS credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  delta INTEGER NOT NULL, -- positive for credits added, negative for removed
  reason TEXT NOT NULL, -- e.g., "stripe_checkout_paid", "stripe_refund"
  payment_id TEXT, -- references payments.session_id
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3b. Webhook Events table (for failed event replay)
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'failed', -- failed, retrying, processed
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- 3c. Payment Attempts table (track checkout sessions for cancel/retry)
CREATE TABLE IF NOT EXISTS payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  price_id TEXT NOT NULL,
  credits INTEGER NOT NULL,
  checkout_session_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'open', -- open, completed, expired, canceled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Ensure users table has balance column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'balance'
  ) THEN
    ALTER TABLE users ADD COLUMN balance INTEGER DEFAULT 0;
  END IF;
END $$;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_intent_id ON payments(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_user_id ON credit_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_payment_id ON credit_ledger(payment_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_event_id ON stripe_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_user_id ON payment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_status ON payment_attempts(status);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_checkout_session_id ON payment_attempts(checkout_session_id);

-- 6. Add comments for documentation
COMMENT ON TABLE stripe_events IS 'Tracks processed Stripe webhook events for idempotency';
COMMENT ON TABLE payments IS 'Records all Stripe payment transactions';
COMMENT ON TABLE credit_ledger IS 'Audit trail of all credit balance changes';
COMMENT ON COLUMN payments.amount IS 'Amount in cents (e.g., 999 = $9.99)';
COMMENT ON COLUMN credit_ledger.delta IS 'Positive for credits added, negative for credits removed';

