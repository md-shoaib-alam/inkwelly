"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, CheckCircle2, ArrowRight } from "lucide-react";
import { Plan } from "./types";

interface PlanCardProps {
  plan: Plan;
  isActive: boolean;
  cycle: "monthly" | "quarterly" | "yearly";
  onPurchase: (plan: Plan) => void;
}

export function PlanCard({ plan, isActive, cycle, onPurchase }: PlanCardProps) {
  const isPopular = plan.popular;
  const currentPricing = plan.pricing[cycle];
  const price = currentPricing.price;
  const originalPrice = currentPricing.originalPrice;

  const cycleLabels = {
    monthly: "per month",
    quarterly: "per quarter",
    yearly: "per year"
  };

  return (
    <Card
      className={`relative rounded-2xl transition-all duration-500 ${
        isPopular
          ? "border-amber-500 shadow-xl bg-white dark:bg-zinc-900"
          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-lg"
      } ${
        isActive
          ? "ring-2 ring-emerald-500/50"
          : ""
      }`}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white ${plan.badgeColor}`}
          >
            {plan.badge}
          </span>
        </div>
      )}

      <CardHeader className={`pt-6 sm:pt-8 ${isPopular ? "pb-2" : ""}`}>
        <div className="flex items-center justify-between">
          <div
            className={`size-10 sm:size-12 rounded-xl flex items-center justify-center ${
              isPopular
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                : isActive
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
            }`}
          >
            {plan.icon}
          </div>
          {isActive && (
            <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] sm:text-xs border-emerald-200 dark:border-emerald-800 shadow-none">
              <CheckCircle2 className="size-3 mr-1" /> Active
            </Badge>
          )}
        </div>
        <div className="mt-3 sm:mt-4">
          <CardTitle className="text-lg sm:text-xl">{plan.name}</CardTitle>
          <CardDescription className="mt-1 text-xs sm:text-sm line-clamp-1 sm:line-clamp-none">
            {plan.description}
          </CardDescription>
        </div>
        <div className="mt-3 sm:mt-4 flex items-baseline gap-1">
          {price === 0 ? (
            <span className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Free
            </span>
          ) : (
            <>
              <span className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                ₹{price}
              </span>
              {originalPrice && (
                <span className="text-xs sm:text-sm text-zinc-400 dark:text-zinc-500 line-through ml-1 sm:ml-2">
                  ₹{originalPrice}
                </span>
              )}
            </>
          )}
          {price !== 0 && (
            <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 ml-1">
              / {cycleLabels[cycle]}
            </span>
          )}
        </div>
        {originalPrice && price > 0 && (
          <Badge className="mt-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 text-[10px] sm:text-xs shadow-none">
            Save{" "}
            {Math.round(
              ((originalPrice - price) / originalPrice) *
                100,
            )}
            %
          </Badge>
        )}
      </CardHeader>

      <CardContent className="pt-0 pb-6 sm:pb-8">
        <Button
          className={`w-full h-10 sm:h-11 text-xs sm:text-sm font-semibold rounded-xl mt-2 ${
            isActive
              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
              : isPopular
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md"
                : plan.id === "premium"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md"
                  : "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
          }`}
          onClick={() => (isActive ? null : onPurchase({ ...plan, price } as any))}
          disabled={isActive}
        >
          {isActive ? (
            <>
              <CheckCircle2 className="size-3 sm:size-4 mr-2" /> Current Plan
            </>
          ) : price === 0 ? (
            "Switch to Free"
          ) : (
            <>
              Get {plan.name} <ArrowRight className="size-3 sm:size-4 ml-2" />
            </>
          )}
        </Button>

        <Separator className="my-4 sm:my-5" />

        <div className="space-y-2 sm:space-y-3">
          <p className="text-[10px] sm:text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            What&apos;s included
          </p>
          {plan.features.map((feature, idx) => {
            const isObject = typeof feature !== "string";
            const text = isObject ? (feature as any).text : feature;
            const included = isObject ? (feature as any).included : true;

            return (
              <div key={text} className="flex items-start gap-2 sm:gap-2.5">
                {included ? (
                  <div className="size-4 sm:size-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="size-2.5 sm:size-3" />
                  </div>
                ) : (
                  <div className="size-4 sm:size-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px]">✕</span>
                  </div>
                )}
                <span
                  className={`text-[11px] sm:text-sm ${included ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400 dark:text-zinc-500"}`}
                >
                  {text}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
