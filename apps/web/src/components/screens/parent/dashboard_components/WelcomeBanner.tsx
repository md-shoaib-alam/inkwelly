"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, School } from "lucide-react";
import { useAppStore } from "@/store/use-app-store";

interface WelcomeBannerProps {
  userName?: string;
}

export function WelcomeBanner({ userName }: WelcomeBannerProps) {
  const { currentTenantName, currentTenantLogo } = useAppStore();

  const dates = useMemo(() => {
    try {
      const now = new Date();
      const day = now.getDate();
      const month = now.toLocaleDateString("en-US", { month: "long" });
      const year = now.getFullYear();
      const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
      
      const datePart = `${day} ${month}, ${year}`;
      return {
        full: `${weekday}, ${datePart}`,
        short: datePart
      };
    } catch (e) {
      return { full: "", short: "" };
    }
  }, []);

  return (
    <Card className="rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-xs overflow-hidden bg-white dark:bg-zinc-950">
      <CardContent className="p-5 sm:p-6 relative z-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-14 sm:size-16 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center overflow-hidden shrink-0 border border-zinc-100 dark:border-zinc-800 transition-transform hover:scale-105 duration-300">
              <img src={currentTenantLogo || "/test.webp"} alt={currentTenantName || ""} className="size-full object-cover" loading="eager" />
            </div>
            <div className="text-left space-y-1">
              <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-zinc-900 dark:text-zinc-50">
                {userName || "Parent"}
              </h2>
              <p className="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-wider">
                Welcome back
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl px-3 py-1.5 sm:px-4 sm:py-2.5 text-zinc-600 dark:text-zinc-300 shrink-0 w-fit shadow-xs">
            <Calendar className="size-3.5 sm:size-4 text-amber-500" />
            <span className="text-[10px] sm:text-xs font-medium" suppressHydrationWarning>
              <span className="hidden sm:inline">{dates.full}</span>
              <span className="sm:hidden">{dates.short}</span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
