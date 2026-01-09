import Stripe from "stripe";

/**
 * Singleton Stripe instance configured for production use
 * Uses the latest stable API version
 */
let stripeInstance: Stripe | null = null;

export const getStripe = (): Stripe => {
  if (stripeInstance) {
    return stripeInstance;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Please configure it in your environment variables.",
    );
  }

  stripeInstance = new Stripe(secretKey, {
    apiVersion: "2025-12-15.clover",
    typescript: true,
  });

  return stripeInstance;
};

