import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

// Simple in-memory cache (60 seconds)
let cachedPlans: any = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 1000; // 60 seconds

interface PricingPlan {
  priceId: string;
  credits: number;
  amount: number;
  currency: string;
  productName: string;
  formatted: string;
  isPopular?: boolean;
}

/**
 * Format price amount
 */
function formatPrice(amount: number, currency: string): string {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  });
  return formatter.format(amount);
}

export async function GET() {
  try {
    // Check cache
    const now = Date.now();
    if (cachedPlans && now - cacheTimestamp < CACHE_TTL) {
      return NextResponse.json(cachedPlans);
    }

    const stripe = getStripe();

    // Fetch active one-time prices with product expansion
    const prices = await stripe.prices.list({
      active: true,
      type: "one_time",
      limit: 100,
      expand: ["data.product"],
    });

    const plans: PricingPlan[] = [];

    for (const price of prices.data) {
      // Skip if not a valid price ID
      if (!price.id.startsWith("price_")) {
        continue;
      }

      // Require unit_amount to be present
      if (!price.unit_amount || price.unit_amount <= 0) {
        continue;
      }

      // Require credits in metadata
      if (!price.metadata?.credits) {
        continue;
      }

      const credits = parseInt(price.metadata.credits, 10);
      if (isNaN(credits) || credits <= 0) {
        continue;
      }

      // Check product is active (if expanded)
      if (price.product) {
        if (typeof price.product === "string") {
          // Product ID only, need to fetch
          try {
            const product = await stripe.products.retrieve(price.product);
            if (!product.active) {
              continue;
            }
          } catch (err) {
            console.error(`[Pricing] Failed to fetch product ${price.product}:`, err);
            continue;
          }
        } else if (typeof price.product === "object") {
          // Product object expanded
          if (price.product.deleted || !price.product.active) {
            continue;
          }
        }
      }

      // Get product name
      let productName = "Credits";
      if (price.product && typeof price.product === "object" && !price.product.deleted) {
        productName = price.product.name || "Credits";
      }

      plans.push({
        priceId: price.id,
        credits,
        amount: price.unit_amount / 100,
        currency: price.currency || "usd",
        productName,
        formatted: formatPrice(price.unit_amount / 100, price.currency || "usd"),
      });
    }

    // Sort by credits ASC
    plans.sort((a, b) => a.credits - b.credits);

    // Mark popular plan (highest credits if 2 plans, or middle if 3+)
    if (plans.length > 0) {
      if (plans.length === 2) {
        // Mark the higher tier as popular
        plans[plans.length - 1].isPopular = true;
      } else if (plans.length >= 3) {
        // Mark middle tier as popular
        const middleIndex = Math.floor(plans.length / 2);
        plans[middleIndex].isPopular = true;
      } else {
        // Single plan - mark as popular
        plans[0].isPopular = true;
      }
    }

    // Update cache
    cachedPlans = plans;
    cacheTimestamp = now;

    return NextResponse.json(plans);
  } catch (error: any) {
    console.error("[Pricing API] Error fetching prices:", error);
    return NextResponse.json(
      { error: "Failed to fetch pricing plans" },
      { status: 500 },
    );
  }
}
