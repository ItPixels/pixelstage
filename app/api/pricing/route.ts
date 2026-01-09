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

interface PricingResponse {
  plans: PricingPlan[];
  warnings: Array<{ priceId: string; reason: string }>;
}

/**
 * Extract credits from price using multiple fallbacks
 */
function extractCredits(price: any): number | null {
  // Preferred: metadata.credits
  if (price.metadata?.credits) {
    const credits = Number(price.metadata.credits);
    if (!isNaN(credits) && credits > 0) {
      return credits;
    }
  }

  // Fallback 1: lookup_key (e.g., "credits_10" => 10)
  if (price.lookup_key) {
    const match = price.lookup_key.match(/credits[_-]?(\d+)/i);
    if (match) {
      const credits = Number(match[1]);
      if (!isNaN(credits) && credits > 0) {
        return credits;
      }
    }
  }

  // Fallback 2: product name (e.g., "10 Credits" => 10)
  if (price.product) {
    let productName = "";
    if (typeof price.product === "string") {
      // Would need to fetch, skip for now
    } else if (typeof price.product === "object" && !price.product.deleted) {
      productName = price.product.name || "";
    }

    if (productName) {
      const match = productName.match(/(\d+)\s*credits?/i);
      if (match) {
        const credits = Number(match[1]);
        if (!isNaN(credits) && credits > 0) {
          return credits;
        }
      }
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
  return formatter.format(amount);
}

export async function GET() {
  try {
    // Strict env validation
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error("[Pricing API] STRIPE_SECRET_KEY is missing");
      return NextResponse.json(
        {
          error: "STRIPE_SECRET_KEY missing",
          hint: "Set it in Vercel env vars for Production + Preview",
        },
        { status: 500 },
      );
    }

    // Log Stripe mode
    const stripeMode = stripeSecretKey.startsWith("sk_live_") ? "live" : "test";
    console.log(`[Pricing API] Using Stripe ${stripeMode} mode`);

    // Check cache
    const now = Date.now();
    if (cachedPlans && now - cacheTimestamp < CACHE_TTL) {
      console.log(`[Pricing API] Returning cached plans (${cachedPlans.plans?.length || 0} plans)`);
      return NextResponse.json(cachedPlans);
    }

    const stripe = getStripe();

    // Fetch active one-time prices with product expansion
    console.log("[Pricing API] Fetching prices from Stripe...");
    const prices = await stripe.prices.list({
      active: true,
      type: "one_time",
      limit: 100,
      expand: ["data.product"],
    });

    console.log(`[Pricing API] Received ${prices.data.length} prices from Stripe`);

    const plans: PricingPlan[] = [];
    const warnings: Array<{ priceId: string; reason: string }> = [];

    for (const price of prices.data) {
      // Skip if not a valid price ID
      if (!price.id.startsWith("price_")) {
        warnings.push({
          priceId: price.id,
          reason: "Invalid price ID format (not starting with price_)",
        });
        continue;
      }

      // Require unit_amount to be present
      if (!price.unit_amount || price.unit_amount <= 0) {
        warnings.push({
          priceId: price.id,
          reason: "Missing or invalid unit_amount",
        });
        continue;
      }

      // Check product is active (if expanded)
      let productActive = true;
      let productName = "Credits";

      if (price.product) {
        if (typeof price.product === "string") {
          // Product ID only, need to fetch
          try {
            const product = await stripe.products.retrieve(price.product);
            productActive = product.active && !product.deleted;
            productName = product.name || "Credits";
          } catch (err) {
            console.error(`[Pricing API] Failed to fetch product ${price.product}:`, err);
            warnings.push({
              priceId: price.id,
              reason: `Failed to fetch product: ${err}`,
            });
            continue;
          }
        } else if (typeof price.product === "object") {
          // Product object expanded
          if (price.product.deleted || !price.product.active) {
            warnings.push({
              priceId: price.id,
              reason: "Product is not active or deleted",
            });
            continue;
          }
          productName = price.product.name || "Credits";
        }
      }

      if (!productActive) {
        continue;
      }

      // Extract credits (with fallbacks)
      const credits = extractCredits(price);

      if (!credits || credits <= 0) {
        warnings.push({
          priceId: price.id,
          reason: "Could not determine credits (missing metadata.credits, lookup_key, or product name pattern)",
        });
        continue;
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

    console.log(`[Pricing API] Filtered to ${plans.length} valid plans`);
    if (warnings.length > 0) {
      console.log(`[Pricing API] ${warnings.length} prices filtered out with warnings`);
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

    const response: PricingResponse = {
      plans,
      warnings,
    };

    // Update cache
    cachedPlans = response;
    cacheTimestamp = now;

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("[Pricing API] Error fetching prices:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch pricing plans",
        message: error.message || "Unknown error",
        hint: "Check Stripe API connectivity and STRIPE_SECRET_KEY configuration",
      },
      { status: 500 },
    );
  }
}
