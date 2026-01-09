import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function GET() {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      return NextResponse.json(
        {
          error: "STRIPE_SECRET_KEY missing",
          stripeMode: null,
          rawPricesCount: 0,
          prices: [],
        },
        { status: 500 },
      );
    }

    const stripeMode = stripeSecretKey.startsWith("sk_live_") ? "live" : "test";

    const stripe = getStripe();

    // Fetch prices
    const prices = await stripe.prices.list({
      active: true,
      type: "one_time",
      limit: 100,
      expand: ["data.product"],
    });

    // Format first 5 prices for debug
    const debugPrices = prices.data.slice(0, 5).map((price) => {
      const productInfo: any = {
        id: null,
        name: null,
        active: null,
      };

      if (price.product) {
        if (typeof price.product === "string") {
          productInfo.id = price.product;
        } else if (typeof price.product === "object" && !price.product.deleted) {
          productInfo.id = price.product.id;
          productInfo.name = "name" in price.product ? price.product.name : null;
          productInfo.active = "active" in price.product ? price.product.active : null;
        }
      }

      return {
        id: price.id,
        active: price.active,
        type: price.type,
        unit_amount: price.unit_amount,
        currency: price.currency,
        lookup_key: price.lookup_key || null,
        metadata: price.metadata || {},
        product: productInfo,
      };
    });

    return NextResponse.json({
      stripeMode,
      rawPricesCount: prices.data.length,
      prices: debugPrices,
      totalPrices: prices.data.length,
    });
  } catch (error: any) {
    console.error("[Pricing Debug] Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Unknown error",
        stripeMode: process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_") ? "live" : "test",
        rawPricesCount: 0,
        prices: [],
      },
      { status: 500 },
    );
  }
}

