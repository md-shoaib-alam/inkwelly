"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { SubscriptionRecord } from "./types";

interface CurrentPlanBannerProps {
  subscription: SubscriptionRecord;
  onCancel: (id: string) => void;
}

const formatSubscriptionDate = (dateStr?: string | null) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export function CurrentPlanBanner({ subscription, onCancel }: CurrentPlanBannerProps) {
  const activeAddons: string[] = JSON.parse(subscription.addons || "[]");

  return (
    <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 shadow-none">
      <CardContent className="p-2 sm:p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 w-full">
          <div className="size-6 sm:size-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-3.5 sm:size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-emerald-800 dark:text-emerald-300 leading-none text-xs sm:text-base">
              Active: {subscription.planName.toLowerCase().includes("plan") ? subscription.planName : `${subscription.planName} Plan`}
            </p>
            <p className="text-[9px] sm:text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 truncate" suppressHydrationWarning>
              {subscription.endDate
                ? `Renews on ${formatSubscriptionDate(subscription.endDate)}`
                : `Started ${formatSubscriptionDate(subscription.startDate)}`}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-auto text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 h-7 sm:h-8 text-[10px] sm:text-sm px-3"
          onClick={() => onCancel(subscription.id)}
        >
          Cancel Plan
        </Button>
      </CardContent>
    </Card>
  );
}
       
