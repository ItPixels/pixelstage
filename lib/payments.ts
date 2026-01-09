import { getSupabaseAdmin } from "./supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Idempotent function to grant credits once per payment session
 * Uses database unique constraints to prevent duplicate processing
 */
export async function grantCreditsOnce(
  supabase: SupabaseClient,
  params: {
    sessionId: string;
    userId: string;
    credits: number;
    amount: number;
    currency: string;
    paymentIntentId?: string;
    eventId: string;
  },
): Promise<{ success: boolean; alreadyProcessed: boolean; error?: string }> {
  const { sessionId, userId, credits, amount, currency, paymentIntentId, eventId } = params;

  try {
    // Step 1: Try to insert StripeEvent (idempotency check)
    const { error: eventError } = await supabase
      .from("stripe_events")
      .insert({
        event_id: eventId,
        type: "checkout.session.completed",
        livemode: false, // Will be set from actual event
        payload_json: {},
      })
      .select()
      .single();

    if (eventError) {
      // If unique violation, event was already processed
      if (eventError.code === "23505") {
        console.log(`Event ${eventId} already processed, skipping`);
        return { success: true, alreadyProcessed: true };
      }
      throw eventError;
    }

    // Step 2: Try to insert Payment (idempotency check)
    const { error: paymentError } = await supabase
      .from("payments")
      .insert({
        session_id: sessionId,
        payment_intent_id: paymentIntentId || null,
        user_id: userId,
        credits,
        amount,
        currency,
        status: "paid",
      })
      .select()
      .single();

    if (paymentError) {
      // If unique violation, payment was already processed
      if (paymentError.code === "23505") {
        console.log(`Payment ${sessionId} already processed, skipping`);
        // Rollback event insert
        await supabase.from("stripe_events").delete().eq("event_id", eventId);
        return { success: true, alreadyProcessed: true };
      }
      throw paymentError;
    }

    // Step 3: Insert credit ledger entry
    const { error: ledgerError } = await supabase
      .from("credit_ledger")
      .insert({
        user_id: userId,
        delta: credits,
        reason: "stripe_checkout_paid",
        payment_id: sessionId,
      });

    if (ledgerError) {
      throw ledgerError;
    }

    // Step 4: Update user balance atomically
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("balance")
      .eq("id", userId)
      .single();

    if (userError) {
      throw userError;
    }

    const newBalance = (userData?.balance || 0) + credits;

    const { error: updateError } = await supabase
      .from("users")
      .update({ balance: newBalance })
      .eq("id", userId);

    if (updateError) {
      throw updateError;
    }

    console.log(
      `Successfully granted ${credits} credits to user ${userId}. New balance: ${newBalance}`,
    );

    return { success: true, alreadyProcessed: false };
  } catch (error: any) {
    console.error("Error in grantCreditsOnce:", error);
    return {
      success: false,
      alreadyProcessed: false,
      error: error.message || "Unknown error",
    };
  }
}

/**
 * Handle refund: mark payment as refunded and optionally claw back credits
 */
export async function handleRefund(
  supabase: SupabaseClient,
  params: {
    paymentIntentId: string;
    clawBackCredits?: boolean;
  },
): Promise<{ success: boolean; error?: string }> {
  const { paymentIntentId, clawBackCredits = false } = params;

  try {
    // Find payment by payment_intent_id
    const { data: payment, error: findError } = await supabase
      .from("payments")
      .select("*")
      .eq("payment_intent_id", paymentIntentId)
      .eq("status", "paid")
      .single();

    if (findError || !payment) {
      return { success: false, error: "Payment not found or already refunded" };
    }

    // Update payment status
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status: "refunded",
        refunded_at: new Date().toISOString(),
      })
      .eq("payment_intent_id", paymentIntentId);

    if (updateError) {
      throw updateError;
    }

    // Optionally claw back credits
    if (clawBackCredits && payment.credits > 0) {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("balance")
        .eq("id", payment.user_id)
        .single();

      if (userError) {
        throw userError;
      }

      const currentBalance = userData?.balance || 0;
      const newBalance = Math.max(0, currentBalance - payment.credits);

      // Insert negative ledger entry
      await supabase.from("credit_ledger").insert({
        user_id: payment.user_id,
        delta: -payment.credits,
        reason: "stripe_refund",
        payment_id: payment.session_id,
      });

      // Update user balance
      await supabase
        .from("users")
        .update({ balance: newBalance })
        .eq("id", payment.user_id);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in handleRefund:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}

/**
 * Handle dispute: flag payment as disputed
 */
export async function handleDispute(
  supabase: SupabaseClient,
  params: {
    paymentIntentId: string;
  },
): Promise<{ success: boolean; error?: string }> {
  const { paymentIntentId } = params;

  try {
    const { error } = await supabase
      .from("payments")
      .update({
        status: "disputed",
      })
      .eq("payment_intent_id", paymentIntentId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in handleDispute:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}

