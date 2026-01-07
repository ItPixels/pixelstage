"use server";

import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export type CreateStripeSessionResult =
  | { success: true; url: string }
  | { success: false; error: string };

export const createStripeSession = async (
  credits: number,
  price: number,
): Promise<CreateStripeSessionResult> => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Необходима авторизация" };
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${credits} кредитов`,
              description: `Пополнение баланса на ${credits} кредитов`,
            },
            unit_amount: price * 100, // цена в центах
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/credits?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/credits?canceled=true`,
      metadata: {
        clerkId: userId,
        credits: credits.toString(),
      },
    });

    if (!session.url) {
      return { success: false, error: "Ошибка создания сессии оплаты" };
    }

    return { success: true, url: session.url };
  } catch (error) {
    console.error("Error creating Stripe session:", error);
    return {
      success: false,
      error: "Произошла ошибка при создании сессии оплаты",
    };
  }
};

