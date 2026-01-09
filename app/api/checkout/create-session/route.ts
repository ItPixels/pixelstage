import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * Extract credits from price lookup_key or metadata
 */
async function getCreditsFromPrice(
  stripe: ReturnType<typeof getStripe>,
  priceId: string,
): Promise<number | null> {
  try {
    const price = await stripe.prices.retrieve(priceId, {
      expand: ["product"],
    });

    // Try lookup_key first
    if (price.lookup_key) {
      const match = price.lookup_key.match(/^credits_(\d+)$/);
      if (match) {
        return parseInt(match[1], 10);
      }
    }

    // Fallback to metadata
    if (price.metadata?.credits) {
      const credits = parseInt(price.metadata.credits, 10);
      if (!isNaN(credits)) {
        return credits;
      }
    }

    // Fallback to product metadata
    if (
      price.product &&
      typeof price.product === "object" &&
      !price.product.deleted &&
      "metadata" in price.product &&
      price.product.metadata?.credits
    ) {
      const credits = parseInt(price.product.metadata.credits, 10);
      if (!isNaN(credits)) {
        return credits;
      }
    }

    return null;
  } catch (error) {
    console.error(`[Checkout] Failed to retrieve price ${priceId}:`, error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check auth
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { priceId, attemptId } = body;

    if (!priceId) {
      return NextResponse.json(
        { error: "priceId is required" },
        { status: 400 },
      );
    }

    // Validate priceId format
    if (!priceId.startsWith("price_")) {
      return NextResponse.json(
        { error: "Invalid priceId format. Expected price_*" },
        { status: 400 },
      );
    }

    const stripe = getStripe();
    const supabase = getSupabaseAdmin();

    // Verify price exists and is a credit pack
    const price = await stripe.prices.retrieve(priceId, {
      expand: ["product"],
    });

    if (!price.active) {
      return NextResponse.json(
        { error: "Price is not active" },
        { status: 400 },
      );
    }

    // Check if it's a credit pack (lookup_key or metadata)
    const credits = await getCreditsFromPrice(stripe, priceId);

    if (!credits || credits <= 0) {
      return NextResponse.json(
        { error: "Price is not a valid credit pack" },
        { status: 400 },
      );
    }

    // Check for existing open session (within last 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: existingAttempt } = await supabase
      .from("payment_attempts")
      .select("*")
      .eq("user_id", userId)
      .eq("price_id", priceId)
      .eq("status", "open")
      .gt("created_at", thirtyMinutesAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // If open session exists and is recent, return it
    if (existingAttempt?.checkout_session_id) {
      try {
        const existingSession = await stripe.checkout.sessions.retrieve(
          existingAttempt.checkout_session_id,
        );

        if (
          existingSession.status === "open" &&
          existingSession.payment_status !== "paid"
        ) {
          console.log(
            `[Checkout] Reusing existing session ${existingSession.id} for user ${userId}`,
          );
          return NextResponse.json({
            url: existingSession.url,
            sessionId: existingSession.id,
          });
        }
      } catch (err) {
        // Session might be expired, continue to create new one
        console.log(
          `[Checkout] Existing session ${existingAttempt.checkout_session_id} not found, creating new`,
        );
      }
    }

    const domain =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_URL ||
      "http://localhost:3000";

    // Generate idempotency key
    const idempotencyKey = attemptId
      ? `checkout:${userId}:${priceId}:${attemptId}`
      : `checkout:${userId}:${priceId}:${Date.now()}`;

    // Create checkout session
    const session = await stripe.checkout.sessions.create(
      {
        success_url: `${domain}/dashboard/credits?success=1&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${domain}/dashboard/credits?canceled=1`,
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
          credits: credits.toString(),
        },
      },
      {
        idempotencyKey,
      },
    );

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 },
      );
    }

    // Record payment attempt
    await supabase.from("payment_attempts").insert({
      user_id: userId,
      price_id: priceId,
      credits: credits,
      checkout_session_id: session.id,
      status: "open",
    });

    console.log(
      `[Checkout] Created session ${session.id} for user ${userId}, credits=${credits}, priceId=${priceId}`,
    );

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error("[Checkout] Error creating session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 },
    );
  }
}

