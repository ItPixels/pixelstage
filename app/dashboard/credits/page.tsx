"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createStripeSession } from "../../actions/stripe";

type PricingTier = {
  credits: number;
  price: number;
  pricePerCredit: number;
  popular?: boolean;
};

const pricingTiers: PricingTier[] = [
  {
    credits: 10,
    price: 9.99,
    pricePerCredit: 0.99,
  },
  {
    credits: 50,
    price: 39.99,
    pricePerCredit: 0.80,
    popular: true,
  },
  {
    credits: 100,
    price: 69.99,
    pricePerCredit: 0.70,
  },
];

const CreditsPage = () => {
  const router = useRouter();
  const [loadingTier, setLoadingTier] = useState<number | null>(null);

  const handlePurchase = async (tier: PricingTier) => {
    setLoadingTier(tier.credits);

    try {
      const result = await createStripeSession(tier.credits, tier.price);

      if (result.success) {
        router.push(result.url!);
      } else {
        toast.error(result.error || "Ошибка при создании сессии оплаты");
        setLoadingTier(null);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Произошла ошибка при создании сессии оплаты");
      setLoadingTier(null);
    }
  };

  return (
    <div className="container mx-auto max-w-6xl px-6 py-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold text-white">Пополнить баланс</h1>
        <p className="text-zinc-400">
          Выберите тарифный план и пополните свой баланс кредитов
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {pricingTiers.map((tier) => {
          const isLoading = loadingTier === tier.credits;

          return (
            <Card
              key={tier.credits}
              className={`relative overflow-hidden border-white/10 bg-white/5 ${
                tier.popular
                  ? "ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-500/20"
                  : ""
              }`}
            >
              {tier.popular && (
                <div className="absolute right-0 top-0 bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                  Популярный
                </div>
              )}

              <CardHeader className="space-y-4 pb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 ring-1 ring-emerald-400/40">
                    <Sparkles className="h-6 w-6 text-emerald-300" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-white">
                      {tier.credits} кредитов
                    </CardTitle>
                    <p className="text-sm text-zinc-400">
                      ${tier.pricePerCredit.toFixed(2)} за кредит
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-semibold text-white">
                      ${tier.price}
                    </span>
                    <span className="text-sm text-zinc-400">USD</span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    ${tier.pricePerCredit.toFixed(2)} за кредит
                  </p>
                </div>

                <Button
                  onClick={() => handlePurchase(tier)}
                  disabled={isLoading}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  {isLoading ? (
                    <>
                      <CreditCard className="mr-2 h-4 w-4 animate-pulse" />
                      Обработка...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Купить
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default CreditsPage;

