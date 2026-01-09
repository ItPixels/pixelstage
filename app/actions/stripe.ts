"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { getStripe } from "@/lib/stripe";

// Credits to Price ID mapping (reverse of PRICE_TO_CREDITS)
const CREDITS_TO_PRICE_ID: Record<number, string> = {
  10: process.env.STRIPE_PRICE_10 || "",
  50: process.env.STRIPE_PRICE_50 || "",
  100: process.env.STRIPE_PRICE_100 || "",
};

/**
 * Create a Stripe Checkout session for purchasing credits
 * @param credits - Number of credits to purchase (10, 50, or 100)
 * @param price - Price in USD (for backward compatibility, not used if priceId exists)
 * @returns Checkout session URL or error
 */
export async function createStripeSession(credits: number, price: number) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return { error: "Unauthorized", success: false };
    }

    // Map credits to price ID
    const priceId = CREDITS_TO_PRICE_ID[credits];

    if (!priceId) {
      return {
        error: `Invalid credits amount: ${credits}. Supported: 10, 50, 100`,
        success: false,
      };
    }

    const stripe = getStripe();
    const domain = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

    // Generate idempotency key: checkout:{userId}:{priceId}:{date}:{nonce}
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const nonce = Math.random().toString(36).substring(2, 9);
    const idempotencyKey = `checkout:${userId}:${priceId}:${today}:${nonce}`;

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
          priceId: priceId,
        },
      },
      {
        idempotencyKey,
      },
    );

    if (!session.url) {
      return { error: "Error creating session", success: false };
    }

    return { success: true, url: session.url, error: undefined };
  } catch (error: any) {
    console.error("Payment error:", error);
    return {
      error: error.message || "Failed to create payment session",
      success: false,
    };
  }
}
