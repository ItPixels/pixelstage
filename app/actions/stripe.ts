"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover", // Та самая новая версия!
});

export async function createStripeSession() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    throw new Error("Unauthorized");
  }

  // Создаем сессию оплаты
  const session = await stripe.checkout.sessions.create({
    success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/credits`,
    payment_method_types: ["card"],
    mode: "payment",
    billing_address_collection: "auto",
    customer_email: user.emailAddresses[0].emailAddress,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Credits Package",
            description: "Purchase credits to generate content",
          },
          unit_amount: 1000, // $10.00
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId: userId,
    },
  });

  if (session.url) {
    redirect(session.url);
  }
}