import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import { grantCreditsOnce, handleRefund, handleDispute } from "@/lib/payments";

// Force Node.js runtime for Stripe webhooks (required for raw body access)
export const runtime = "nodejs";

/**
 * Extract credits from price metadata (required)
 */
async function getCreditsFromPrice(
  stripe: ReturnType<typeof getStripe>,
  priceId: string,
): Promise<number | null> {
  try {
    const price = await stripe.prices.retrieve(priceId, {
      expand: ["product"],
    });

    // Require metadata.credits
    if (!price.metadata?.credits) {
      return null;
    }

    const credits = parseInt(price.metadata.credits, 10);
    if (isNaN(credits) || credits <= 0) {
      return null;
    }

    return credits;
  } catch (error) {
    console.error(`[Webhook] Failed to retrieve price ${priceId}:`, error);
    return null;
  }
}

/**
 * Store failed webhook event for replay
 */
async function storeFailedEvent(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  eventId: string,
  eventType: string,
  error: string,
) {
  try {
    await supabase.from("webhook_events").insert({
      event_id: eventId,
      type: eventType,
      status: "failed",
      error_message: error,
      retry_count: 0,
    });
  } catch (err) {
    console.error("[Webhook] Failed to store failed event:", err);
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[Webhook] STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  const stripe = getStripe();
  const supabase = getSupabaseAdmin();

  // Read raw body as ArrayBuffer for signature verification
  let body: Buffer;
  try {
    const arrayBuffer = await req.arrayBuffer();
    body = Buffer.from(arrayBuffer);
  } catch (err: any) {
    console.error("[Webhook] Failed to read request body:", err);
    return NextResponse.json(
      { error: "Failed to read request body" },
      { status: 400 },
    );
  }

  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature using raw body
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("[Webhook] Signature verification failed:", err.message);
    // Signature failure = 400, don't store as failed event
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 },
    );
  }

  // Always respond 200 after signature verification (except signature fail)
  // This prevents Stripe from retrying on our errors

  // Handle checkout.session.completed
  if (event.type === "checkout.session.completed") {
    try {
      const session = event.data.object as Stripe.Checkout.Session;

      // Require payment_status to be "paid"
      if (session.payment_status !== "paid") {
        console.log(
          `[Webhook] Session ${session.id} payment_status is ${session.payment_status}, skipping`,
        );
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Require userId in metadata
      const userId = session.metadata?.userId;
      if (!userId) {
        console.error(`[Webhook] Session ${session.id} missing userId in metadata`);
        await storeFailedEvent(supabase, event.id, event.type, "Missing userId");
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Retrieve full session with line items to get price ID
      let fullSession: Stripe.Checkout.Session;
      try {
        fullSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ["line_items.data.price"],
        });
      } catch (err: any) {
        console.error(`[Webhook] Failed to retrieve session ${session.id}:`, err);
        await storeFailedEvent(supabase, event.id, event.type, `Failed to retrieve session: ${err.message}`);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const lineItem = fullSession.line_items?.data[0];
      const priceId = lineItem?.price?.id;

      if (!priceId) {
        console.error(`[Webhook] Session ${session.id} missing price ID`);
        await storeFailedEvent(supabase, event.id, event.type, "Missing price ID");
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Get credits from price metadata (required)
      const credits = await getCreditsFromPrice(stripe, priceId);

      if (!credits || credits <= 0) {
        console.error(
          `[Webhook] Failed to extract credits from price ${priceId}. Check metadata.credits.`,
        );
        await storeFailedEvent(
          supabase,
          event.id,
          event.type,
          `Failed to extract credits from price: ${priceId}`,
        );
        return NextResponse.json({ received: true }, { status: 200 });
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
        console.error(`[Webhook] Failed to grant credits: ${result.error}`);
        await storeFailedEvent(supabase, event.id, event.type, result.error || "Failed to grant credits");
        return NextResponse.json({ received: true }, { status: 200 });
      }

      if (result.alreadyProcessed) {
        console.log(`[Webhook] Payment ${session.id} was already processed`);
      } else {
        console.log(
          `[Webhook] Successfully processed payment ${session.id} for user ${userId}, credits: ${credits}`,
        );
      }

      // Update payment_attempts status to completed
      await supabase
        .from("payment_attempts")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("checkout_session_id", session.id);

      return NextResponse.json({ received: true }, { status: 200 });
    } catch (err: any) {
      console.error("[Webhook] Error processing checkout.session.completed:", err);
      await storeFailedEvent(supabase, event.id, event.type, err.message || "Unknown error");
      return NextResponse.json({ received: true }, { status: 200 });
    }
  }

  // Handle payment_intent.succeeded (reconcile, don't duplicate credits)
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    console.log(
      `[Webhook] Payment intent ${paymentIntent.id} succeeded (reconcile only, credits already granted via checkout.session.completed)`,
    );
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Handle async payment events (future-proof)
  if (
    event.type === "checkout.session.async_payment_succeeded" ||
    event.type === "checkout.session.async_payment_failed"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log(
      `[Webhook] Async payment ${event.type} for session ${session.id} (not implemented yet)`,
    );
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Handle refund events
  if (event.type === "charge.refunded" || event.type === "refund.created") {
    try {
      const charge =
        event.type === "charge.refunded"
          ? (event.data.object as Stripe.Charge)
          : ((event.data.object as Stripe.Refund).charge as string);

      const paymentIntentId =
        typeof charge === "string"
          ? charge
          : (charge as Stripe.Charge).payment_intent as string;

      if (!paymentIntentId) {
        console.error("[Webhook] Missing payment_intent_id in refund event");
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const result = await handleRefund(supabase, {
        paymentIntentId,
        clawBackCredits: true, // Claw back credits only if they were granted by this payment
      });

      if (!result.success) {
        console.error(`[Webhook] Failed to handle refund: ${result.error}`);
      } else {
        console.log(`[Webhook] Successfully processed refund for payment ${paymentIntentId}`);
      }

      return NextResponse.json({ received: true }, { status: 200 });
    } catch (err: any) {
      console.error("[Webhook] Error processing refund:", err);
      return NextResponse.json({ received: true }, { status: 200 });
    }
  }

  // Handle dispute events
  if (event.type === "charge.dispute.created") {
    try {
      const dispute = event.data.object as Stripe.Dispute;
      const paymentIntentId = dispute.payment_intent as string;

      if (!paymentIntentId) {
        console.error("[Webhook] Missing payment_intent_id in dispute event");
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const result = await handleDispute(supabase, {
        paymentIntentId,
      });

      if (!result.success) {
        console.error(`[Webhook] Failed to handle dispute: ${result.error}`);
      } else {
        console.log(`[Webhook] Successfully flagged dispute for payment ${paymentIntentId}`);
      }

      return NextResponse.json({ received: true }, { status: 200 });
    } catch (err: any) {
      console.error("[Webhook] Error processing dispute:", err);
      return NextResponse.json({ received: true }, { status: 200 });
    }
  }

  // Acknowledge other events
  console.log(`[Webhook] Received unhandled event type: ${event.type}`);
  return NextResponse.json({ received: true }, { status: 200 });
}
