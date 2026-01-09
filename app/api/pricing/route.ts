import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

// Simple in-memory cache (60 seconds)
let cachedPlans: any = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 1000; // 60 seconds

interface PricingPlan {
  credits: number;
  priceId: string;
  unitAmount: number;
  currency: string;
  formatted: string;
  isPopular?: boolean;
}

/**
 * Extract credits from lookup_key or metadata
 */
function extractCredits(price: any): number | null {
  // Try lookup_key first (e.g., "credits_10" => 10)
  if (price.lookup_key) {
    const match = price.lookup_key.match(/^credits_(\d+)$/);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  // Fallback to metadata.credits
  if (price.metadata?.credits) {
    const credits = parseInt(price.metadata.credits, 10);
    if (!isNaN(credits)) {
      return credits;
    }
  }

  // Fallback to product metadata
  if (
    price.product &&
    typeof price.product === "object" &&
    !price.product.deleted &&
    "metadata" in price.product &&
    price.product.metadata?.credits
  ) {
    const credits = parseInt(price.product.metadata.credits, 10);
    if (!isNaN(credits)) {
      return credits;
    }
  }

  return null;
}

/**
 * Format price amount
 */
function formatPrice(amount: number, currency: string): string {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  });
  return formatter.format(amount / 100);
}

export async function GET() {
  try {
    // Check cache
    const now = Date.now();
    if (cachedPlans && now - cacheTimestamp < CACHE_TTL) {
      return NextResponse.json(cachedPlans);
    }

    const stripe = getStripe();

    // Fetch active one-time prices
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

      // Extract credits from lookup_key or metadata
      const credits = extractCredits(price);

      if (!credits) {
        // Skip prices without credits metadata
        continue;
      }

      // Only include credit packs (10, 50, 100, etc.)
      if (credits <= 0) {
        continue;
      }

      plans.push({
        credits,
        priceId: price.id,
        unitAmount: price.unit_amount || 0,
        currency: price.currency || "usd",
        formatted: formatPrice(price.unit_amount || 0, price.currency || "usd"),
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

