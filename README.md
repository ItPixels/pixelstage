This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Stripe Production Checklist

### 1. Stripe Dashboard Setup

#### Create Products and Prices
1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → Products
2. Create 3 products for credit packages:
   - **10 Credits** → Create a one-time price (e.g., $9.99)
   - **50 Credits** → Create a one-time price (e.g., $39.99)
   - **100 Credits** → Create a one-time price (e.g., $69.99)
3. Copy the **Price IDs** (starts with `price_...`) for each tier

#### Configure Webhook Endpoint
1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → Developers → Webhooks
2. Click **Add endpoint**
3. Enter your webhook URL:
   - **Production**: `https://your-domain.com/api/webhooks/stripe`
   - **Test Mode**: Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
4. Select events to listen to:
   - `checkout.session.completed`
   - `charge.refunded` (or `refund.created`)
   - `charge.dispute.created`
5. Copy the **Signing secret** (starts with `whsec_...`)

#### Get API Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → Developers → API keys
2. Copy your **Secret key** (starts with `sk_live_...` for production, `sk_test_...` for test mode)

### 2. Environment Variables

Add these to your `.env.local` (local) and Vercel environment variables (production):

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_live_... # or sk_test_... for test mode
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (from Products → Prices)
STRIPE_PRICE_10=price_...
STRIPE_PRICE_50=price_...
STRIPE_PRICE_100=price_...

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 3. Database Schema (Supabase)

Create these tables in your Supabase database:

```sql
-- Stripe Events (idempotency tracking)
CREATE TABLE stripe_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  livemode BOOLEAN NOT NULL,
  payload_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
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

-- Credit Ledger (audit trail)
CREATE TABLE credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  delta INTEGER NOT NULL, -- positive for credits added, negative for removed
  reason TEXT NOT NULL, -- e.g., "stripe_checkout_paid", "stripe_refund"
  payment_id TEXT, -- references payments.session_id
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update users table to ensure balance column exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS balance INTEGER DEFAULT 0;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_intent_id ON payments(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_user_id ON credit_ledger(user_id);
```

### 4. Test/Production Separation

- **Test Mode**: Use `sk_test_...` keys and test mode price IDs. Webhooks can be tested locally with Stripe CLI.
- **Production Mode**: Use `sk_live_...` keys and live mode price IDs. Configure webhook endpoint in Stripe Dashboard.

### 5. Testing

1. **Local Testing**:
   ```bash
   # Install Stripe CLI
   brew install stripe/stripe-cli/stripe
   
   # Login
   stripe login
   
   # Forward webhooks to local server
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

2. **Test Payment Flow**:
   - Use test card: `4242 4242 4242 4242`
   - Any future expiry date, any CVC
   - Complete checkout and verify credits are granted

3. **Verify Idempotency**:
   - Process same webhook event twice → should only grant credits once
   - Check `stripe_events` table for duplicate prevention

### 6. Production Deployment

1. Set all environment variables in Vercel
2. Configure webhook endpoint in Stripe Dashboard (production mode)
3. Test with a real payment (small amount)
4. Monitor webhook logs in Stripe Dashboard
5. Check application logs for any errors

### 7. Refund/Dispute Handling

- **Refunds**: Automatically handled via `charge.refunded` event. Credits are clawed back by default (configurable in `lib/payments.ts`).
- **Disputes**: Automatically flagged via `charge.dispute.created` event. Payment status updated to "disputed".

### Security Notes

- ✅ Webhook signature verification using raw request body
- ✅ Idempotent credit granting (prevents duplicate credits)
- ✅ Database unique constraints prevent duplicate processing
- ✅ Node.js runtime for webhook (required for raw body access)
- ✅ All payments tracked in database with audit trail
