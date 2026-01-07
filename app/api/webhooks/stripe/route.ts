import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { increaseUserBalance } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    // Верификация подписи для защиты от поддельных запросов
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 },
    );
  }

  // Обработка события checkout.session.completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const clerkId = session.metadata?.clerkId;
    const credits = session.metadata?.credits;

    if (!clerkId) {
      console.error("Missing clerkId in session metadata");
      return NextResponse.json(
        { error: "Missing clerkId in metadata" },
        { status: 400 },
      );
    }

    // Начисляем 100 кредитов пользователю
    const creditsToAdd = 100;

    const newBalance = await increaseUserBalance(clerkId, creditsToAdd);

    if (newBalance === null) {
      console.error("Failed to increase user balance");
      return NextResponse.json(
        { error: "Failed to increase user balance" },
        { status: 500 },
      );
    }

    console.log(
      `Successfully added ${creditsToAdd} credits to user ${clerkId}. New balance: ${newBalance}`,
    );

    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Для других типов событий просто подтверждаем получение
  return NextResponse.json({ received: true }, { status: 200 });
}

