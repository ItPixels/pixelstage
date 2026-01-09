"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { getStripe } from "@/lib/stripe";
import { validateCredits } from "@/lib/validations";

// Credits to Price ID mapping - only include if env var exists
function getCreditsToPriceIdMap(): Record<number, string> {
  const map: Record<number, string> = {};
  
  const price10 = process.env.STRIPE_PRICE_10;
  const price50 = process.env.STRIPE_PRICE_50;
  const price100 = process.env.STRIPE_PRICE_100;

  if (price10) map[10] = price10;
  if (price50) map[50] = price50;
  if (price100) map[100] = price100;

  return map;
}

/**
 * Create a Stripe Checkout session for purchasing credits
 * @param credits - Number of credits to purchase (10, 50, or 100)
 * @param price - Price in USD (for backward compatibility, not used)
 * @returns Checkout session URL or error
 */
export async function createStripeSession(
  credits: number | string,
  price: number,
) {
  try {
    // Validate and normalize credits
    const validation = validateCredits(credits);
    if (!validation.valid || validation.credits === null) {
      console.error(
        `[Stripe] Invalid credits: type=${typeof credits}, value=${credits}, error=${validation.error}`,
      );
      return {
        error: validation.error || "Invalid credits amount",
        success: false,
      };
    }

    const normalizedCredits = validation.credits;

    // Check auth
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return { error: "Unauthorized", success: false };
    }

    // TODO: Add rate limiting (1 request per 5 seconds per userId)
    // Option 1: Use Vercel Edge Config or Redis for distributed rate limiting
    // Option 2: Simple in-memory Map for single-instance (not recommended for production)
    // Option 3: Database-based rate limiting table with cleanup job

    // Get price ID mapping
    const CREDITS_TO_PRICE_ID = getCreditsToPriceIdMap();
    const priceId = CREDITS_TO_PRICE_ID[normalizedCredits];

    if (!priceId) {
      console.error(
        `[Stripe] Missing price ID for credits=${normalizedCredits}. Check STRIPE_PRICE_${normalizedCredits} env var`,
      );
      return {
        error: `Price configuration missing for ${normalizedCredits} credits`,
        success: false,
      };
    }

    const stripe = getStripe();
    const domain =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_URL ||
      "http://localhost:3000";

    // Generate idempotency key: checkout:{userId}:{credits}:{dayBucket}
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const idempotencyKey = `checkout:${userId}:${normalizedCredits}:${today}`;

    // Generate request ID for tracking
    const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const session = await stripe.checkout.sessions.create(
      {
        success_url: `${domain}/dashboard/credits?success=true`,
        cancel_url: `${domain}/dashboard/credits?canceled=true`,
        payment_method_types: ["card"],
        mode: "payment",
        billing_address_collection: "auto",
        customer_email: user.emailAddresses[0]?.emailAddress,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        metadata: {
          userId: userId,
          credits: normalizedCredits.toString(),
          priceId: priceId,
          environment: process.env.NODE_ENV || "development",
          requestId: requestId,
        },
      },
      {
        idempotencyKey,
      },
    );

    if (!session.url) {
      return { error: "Error creating session", success: false };
    }

    console.log(
      `[Stripe] Checkout session created: sessionId=${session.id}, userId=${userId}, credits=${normalizedCredits}`,
    );

    return { success: true, url: session.url, error: undefined };
  } catch (error: any) {
    console.error("[Stripe] Payment error:", error);
    return {
      error: error.message || "Failed to create payment session",
      success: false,
    };
  }
}
