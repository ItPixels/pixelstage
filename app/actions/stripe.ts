"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

// Теперь функция принимает аргументы: credits и price
export async function createStripeSession(credits: number, price: number) {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    throw new Error("Unauthorized");
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
          // Stripe принимает цену в центах, поэтому умножаем доллары на 100
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

  // Возвращаем объект, который ждет страница credits/page.tsx
  return { success: true, url: session.url! };
}