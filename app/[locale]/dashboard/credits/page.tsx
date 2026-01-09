"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PricingPlan = {
  priceId: string;
  credits: number;
  amount: number;
  currency: string;
  productName: string;
  formatted: string;
  isPopular?: boolean;
};

const CreditsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check for success/canceled params
  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");

    if (success === "1") {
      toast.success("Оплата успешно завершена! Кредиты начислены.");
      // Clean URL
      router.replace("/dashboard/credits");
    } else if (canceled === "1") {
      toast.info("Оплата отменена. Вы можете попробовать снова.");
      // Clean URL
      router.replace("/dashboard/credits");
    }
  }, [searchParams, router]);

  // Load pricing plans
  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/pricing");
      const data = await response.json();

      if (!response.ok) {
        // Server returned error (500, etc.)
        const errorMessage =
          data.error || data.message || "Failed to load pricing plans";
        const hint = data.hint ? ` (${data.hint})` : "";
        throw new Error(`${errorMessage}${hint}`);
      }

      // Handle new response structure: { plans, warnings }
      if (Array.isArray(data)) {
        // Legacy format (backward compatibility)
        setPlans(data);
      } else if (data.plans) {
        // New format
        setPlans(data.plans);

        // Log warnings if any
        if (data.warnings && data.warnings.length > 0) {
          console.warn("[Pricing] Warnings:", data.warnings);
        }
      } else {
        throw new Error("Invalid response format from pricing API");
      }
    } catch (err: any) {
      console.error("Error loading plans:", err);
      setError(err.message || "Unable to load plans");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (plan: PricingPlan) => {
    setLoadingTier(plan.priceId);

    try {
      const response = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: plan.priceId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err: any) {
      console.error("Error:", err);
      toast.error(err.message || "Произошла ошибка при создании сессии оплаты");
      setLoadingTier(null);
    }
  };

  const calculatePricePerCredit = (plan: PricingPlan): number => {
    return plan.amount / plan.credits;
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-emerald-400 mx-auto mb-4" />
            <p className="text-zinc-400">Загрузка тарифов...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-semibold text-white">Пополнить баланс</h1>
          <p className="text-zinc-400">
            Выберите тарифный план и пополните свой баланс кредитов
          </p>
        </div>

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4 max-w-md">
            <p className="text-red-400 font-medium">{error}</p>
            <p className="text-sm text-zinc-500">
              Проверьте конфигурацию Stripe или попробуйте позже
            </p>
            <Button
              onClick={loadPlans}
              variant="outline"
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Попробовать снова
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="container mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-semibold text-white">Пополнить баланс</h1>
          <p className="text-zinc-400">
            Выберите тарифный план и пополните свой баланс кредитов
          </p>
        </div>

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <p className="text-zinc-400">No pricing plans available</p>
            <p className="text-sm text-zinc-500">
              No active credit packs found in Stripe. Please configure prices in Stripe Dashboard.
            </p>
            <Button
              onClick={loadPlans}
              variant="outline"
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Обновить
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-6 py-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold text-white">Пополнить баланс</h1>
        <p className="text-zinc-400">
          Выберите тарифный план и пополните свой баланс кредитов
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const isLoading = loadingTier === plan.priceId;
          const pricePerCredit = calculatePricePerCredit(plan);

          return (
            <Card
              key={plan.priceId}
              className={`relative overflow-hidden border-white/10 bg-white/5 ${
                plan.isPopular
                  ? "ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-500/20"
                  : ""
              }`}
            >
              {plan.isPopular && (
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
                      {plan.credits} кредитов
                    </CardTitle>
                    <p className="text-sm text-zinc-400">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: plan.currency.toUpperCase(),
                      }).format(pricePerCredit)} за кредит
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-semibold text-white">
                      {plan.formatted}
                    </span>
                    <span className="text-sm text-zinc-400">
                      {plan.currency.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: plan.currency.toUpperCase(),
                    }).format(pricePerCredit)} за кредит
                  </p>
                </div>

                <Button
                  onClick={() => handlePurchase(plan)}
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
