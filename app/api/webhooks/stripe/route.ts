import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import { grantCreditsOnce, handleRefund, handleDispute } from "@/lib/payments";

// Force Node.js runtime for Stripe webhooks (required for raw body access)
export const runtime = "nodejs";

// Price ID to credits mapping from environment variables
const PRICE_TO_CREDITS: Record<string, number> = {
  [process.env.STRIPE_PRICE_10 || ""]: 10,
  [process.env.STRIPE_PRICE_50 || ""]: 50,
  [process.env.STRIPE_PRICE_100 || ""]: 100,
};

/**
 * Get credits amount from price ID
 */
function getCreditsFromPriceId(priceId: string): number {
  return PRICE_TO_CREDITS[priceId] || 0;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  const stripe = getStripe();
  const supabase = getSupabaseAdmin();

  // Read raw body as ArrayBuffer for signature verification
  const arrayBuffer = await req.arrayBuffer();
  const body = Buffer.from(arrayBuffer);

  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  let event;

  try {
    // Verify webhook signature using raw body
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 },
    );
  }

  // Handle checkout.session.completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Require payment_status to be "paid"
    if (session.payment_status !== "paid") {
      console.log(
        `Session ${session.id} payment_status is ${session.payment_status}, skipping`,
      );
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Require userId in metadata
    const userId = session.metadata?.userId;
    if (!userId) {
      console.error(`Session ${session.id} missing userId in metadata`);
      return NextResponse.json(
        { error: "Missing userId in session metadata" },
        { status: 400 },
      );
    }

    // Retrieve full session with line items to get price ID
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["line_items.data.price"],
    });

    const lineItem = fullSession.line_items?.data[0];
    const priceId = lineItem?.price?.id;

    if (!priceId) {
      console.error(`Session ${session.id} missing price ID`);
      return NextResponse.json(
        { error: "Missing price ID in session" },
        { status: 400 },
      );
    }

    // Map price ID to credits
    const credits = getCreditsFromPriceId(priceId);

    if (credits === 0) {
      console.error(`Unknown price ID: ${priceId}`);
      return NextResponse.json(
        { error: "Unknown price ID" },
        { status: 400 },
      );
    }

    // Get payment intent ID if available
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    // Grant credits idempotently
    const result = await grantCreditsOnce(supabase, {
      sessionId: session.id,
      userId,
      credits,
      amount: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency || "usd",
      paymentIntentId,
      eventId: event.id,
    });

    if (!result.success) {
      console.error(`Failed to grant credits: ${result.error}`);
      return NextResponse.json(
        { error: result.error || "Failed to grant credits" },
        { status: 500 },
      );
    }

    if (result.alreadyProcessed) {
      console.log(`Payment ${session.id} was already processed`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Handle refund events
  if (event.type === "charge.refunded" || event.type === "refund.created") {
    const charge =
      event.type === "charge.refunded"
        ? (event.data.object as Stripe.Charge)
        : ((event.data.object as Stripe.Refund).charge as string);

    const paymentIntentId =
      typeof charge === "string"
        ? charge
        : (charge as Stripe.Charge).payment_intent as string;

    if (!paymentIntentId) {
      console.error("Missing payment_intent_id in refund event");
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const result = await handleRefund(supabase, {
      paymentIntentId,
      clawBackCredits: true, // Set to false if you don't want to claw back credits
    });

    if (!result.success) {
      console.error(`Failed to handle refund: ${result.error}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Handle dispute events
  if (event.type === "charge.dispute.created") {
    const dispute = event.data.object as Stripe.Dispute;
    const paymentIntentId = dispute.payment_intent as string;

    if (!paymentIntentId) {
      console.error("Missing payment_intent_id in dispute event");
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const result = await handleDispute(supabase, {
      paymentIntentId,
    });

    if (!result.success) {
      console.error(`Failed to handle dispute: ${result.error}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Acknowledge other events
  return NextResponse.json({ received: true }, { status: 200 });
}
