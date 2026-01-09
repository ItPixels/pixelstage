import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Quick server-side test utility to verify Stripe connectivity
 */
export async function GET() {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      return NextResponse.json(
        {
          success: false,
          error: "STRIPE_SECRET_KEY is not set",
          hint: "Configure STRIPE_SECRET_KEY in environment variables",
        },
        { status: 500 },
      );
    }

    const stripeMode = stripeSecretKey.startsWith("sk_live_") ? "live" : "test";
    const stripe = getStripe();

    // Test 1: Verify API key by fetching account
    let accountId: string | null = null;
    try {
      const account = await stripe.accounts.retrieve();
      accountId = account.id;
    } catch (err: any) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to connect to Stripe API",
          message: err.message,
          stripeMode,
        },
        { status: 500 },
      );
    }

    // Test 2: Count prices
    const prices = await stripe.prices.list({
      active: true,
      type: "one_time",
      limit: 10,
    });

    // Test 3: Count products
    const products = await stripe.products.list({
      active: true,
      limit: 10,
    });

    return NextResponse.json({
      success: true,
      stripeMode,
      accountId,
      pricesCount: prices.data.length,
      productsCount: products.data.length,
      message: "Stripe connectivity verified",
    });
  } catch (error: any) {
    console.error("[Stripe Test] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}

