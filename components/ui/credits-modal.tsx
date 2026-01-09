"use client";

import { useState, useEffect } from "react";
import { CreditCard, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface CreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type CreditPlan = {
  credits: number;
  amount: number; // in AED cents
  priceId: string;
  formatted: string;
  currency: string;
};

export function CreditsModal({ open, onOpenChange }: CreditsModalProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [plans, setPlans] = useState<CreditPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load plans from API when modal opens
  useEffect(() => {
    if (open) {
      loadPlans();
    }
  }, [open]);

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/pricing");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load pricing plans");
      }

      // Handle response structure
      const plansData = Array.isArray(data) ? data : data.plans || [];

      // Filter to show only 5 and 20 credit plans, or use first 2 if available
      const filteredPlans = plansData
        .filter((p: any) => p.credits === 5 || p.credits === 20)
        .slice(0, 2);

      // If no matching plans, use first 2 available
      const displayPlans =
        filteredPlans.length > 0 ? filteredPlans : plansData.slice(0, 2);

      setPlans(displayPlans);
    } catch (err: any) {
      console.error("Error loading plans:", err);
      // Fallback to hardcoded plans if API fails
      setPlans([
        {
          credits: 5,
          amount: 5000,
          priceId: "",
          formatted: "50 AED",
          currency: "aed",
        },
        {
          credits: 20,
          amount: 15000,
          priceId: "",
          formatted: "150 AED",
          currency: "aed",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (plan: CreditPlan) => {
    // If no priceId, redirect to credits page
    if (!plan.priceId || !plan.priceId.startsWith("price_")) {
      onOpenChange(false);
      window.location.href = "/dashboard/credits";
      return;
    }

    setLoadingPlan(plan.priceId);

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
      toast.error(err.message || "Failed to create checkout session");
      setLoadingPlan(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-white/10 bg-deep-black text-off-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gold">
            Purchase Credits
          </DialogTitle>
          <DialogDescription className="text-off-white/70">
            Choose a credit pack to continue generating interior designs. Credits
            never expire.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-gold" />
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-off-white/70 mb-4">
                No pricing plans available. Please try again later.
              </p>
              <Button
                onClick={loadPlans}
                variant="outline"
                className="border-white/10 text-off-white hover:bg-white/5"
              >
                <RefreshCw className="w-4 h-4 me-2" />
                Retry
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {plans.map((plan) => {
                const isLoading = loadingPlan === plan.priceId;
                const pricePerCredit =
                  plan.amount && plan.credits
                    ? plan.amount / plan.credits / 100
                    : 0;

            return (
              <div
                key={plan.credits}
                className="relative rounded-lg border border-white/10 bg-white/5 p-6 transition-all hover:border-gold/50 hover:bg-white/10"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/20 ring-1 ring-gold/40">
                    <Sparkles className="h-6 w-6 text-gold" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-off-white">
                      {plan.credits} Credits
                    </h3>
                    <p className="text-xs text-off-white/60">
                      {pricePerCredit.toFixed(0)} AED per credit
                    </p>
                  </div>
                </div>

                <div className="mb-6 space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gold">
                      {plan.formatted || `${plan.amount / 100} AED`}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => handlePurchase(plan)}
                  disabled={isLoading}
                  className={cn(
                    "w-full bg-gradient-to-r from-gold to-gold/80",
                    "text-deep-black font-semibold",
                    "hover:from-gold/90 hover:to-gold/70",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 me-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 me-2" />
                      Purchase
                    </>
                  )}
                </Button>
              </div>
            );
          })}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-lg bg-white/5 border border-white/10 p-4">
          <p className="text-sm text-off-white/80">
            💳 Secure payment via Stripe. All transactions are encrypted and
            secure.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

