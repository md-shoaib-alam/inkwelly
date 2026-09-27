"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubscriptionAlertProps {
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysRemaining: number | null;
  onRenew: () => void;
}

export function SubscriptionAlert({ 
  isExpired, 
  isExpiringSoon, 
  daysRemaining, 
  onRenew 
}: SubscriptionAlertProps) {
  if (!isExpired && !isExpiringSoon) return null;

  return (
    <div className={`p-4 rounded-2xl flex items-center justify-between gap-4 border animate-in slide-in-from-top duration-500 ${
      isExpired 
        ? "bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50" 
        : "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50"
    }`}>
      <div className="flex items-center gap-3">
        <div className={`size-10 rounded-xl flex items-center justify-center ${
          isExpired ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
        }`}>
          <AlertTriangle className="size-5" />
        </div>
        <div>
          <p className={`text-sm font-bold ${isExpired ? "text-rose-900 dark:text-rose-200" : "text-amber-900 dark:text-amber-200"}`}>
            {isExpired ? "Subscription Expired" : "Subscription Expiring Soon"}
          </p>
          <p className={`text-xs ${isExpired ? "text-rose-700 dark:text-rose-300" : "text-amber-700 dark:text-amber-300"}`}>
            {isExpired 
              ? "Your school's license has expired. Please renew immediately to avoid service interruption." 
              : `Your license will expire in ${daysRemaining} days. Renew now to keep your institution running smoothly.`}
          </p>
        </div>
      </div>
      <Button 
        size="sm" 
        className={isExpired ? "bg-rose-600 hover:bg-rose-700" : "bg-amber-600 hover:bg-amber-700"}
        onClick={onRenew}
      >
        Renew Now
      </Button>
    </div>
  );
}
