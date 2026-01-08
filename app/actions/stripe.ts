"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

export async function createStripeSession(credits: number, price: number) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return { error: "Unauthorized", success: false };
    }

    const domain = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      success_url: `${domain}/dashboard`,
      cancel_url: `${domain}/dashboard/credits`,
      payment_method_types: ["card"],
      mode: "payment",
      billing_address_collection: "auto",
      customer_email: user.emailAddresses[0].emailAddress,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${credits} Credits`,
              description: `Purchase ${credits} credits`,
            },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: userId,
        credits: credits.toString(),
      },
    });

    if (!session.url) {
      return { error: "Error creating session", success: false };
    }

    // Теперь мы явно возвращаем error: undefined, чтобы TypeScript был счастлив
    return { success: true, url: session.url, error: undefined };
  } catch (error) {
    console.error("Payment error:", error);
    return { error: "Failed to create payment session", success: false };
  }
}