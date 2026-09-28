import Image from "next/image";
import { Button } from "@/components/ui/button";
import { RefreshCw, IndianRupee, CreditCard } from "lucide-react";

interface BillingHeaderProps {
  onRefresh: () => void;
  loading?: boolean;
}

export function BillingHeader({
  onRefresh,
  loading = false,
}: BillingHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Hero Banner with billingtop.png */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50/90 via-sky-50/50 to-blue-50/30 dark:from-slate-900 dark:via-blue-950/30 dark:to-slate-900 border border-blue-100/90 dark:border-blue-900/40 px-4 sm:px-6 py-3 sm:py-3.5 shadow-2xs">
        {/* Background ambient glow */}
        <div className="absolute top-0 right-1/4 w-80 h-48 bg-blue-400/15 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-6 right-10 w-48 h-36 bg-sky-300/15 dark:bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 flex items-center justify-between gap-3 sm:gap-4">
          {/* Left Copy */}
          <div className="max-w-md min-w-0">
            <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 rounded-full bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase tracking-wider border border-blue-200/60 dark:border-blue-800/40 shadow-2xs">
              <CreditCard className="size-3 text-blue-600 dark:text-blue-400" />
              <span>Revenue & Billing</span>
            </div>

            <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground tracking-tight leading-tight mt-1 sm:mt-1.5">
              School Billing. Active Revenue.
            </h3>

            <p className="hidden sm:block text-xs text-muted-foreground mt-0.5 leading-snug font-normal">
              Track subscriptions, licenses, and revenue trends across all schools.
            </p>
          </div>

          {/* Right 3D Illustration */}
          <div className="relative flex items-center justify-end shrink-0 pr-0.5 sm:pr-2">
            <div className="relative h-14 sm:h-20 md:h-22 aspect-[16/9] overflow-hidden select-none">
              <Image
                src="/assets/super-admin/billingtop.avif"
                alt="Billing & Revenue"
                fill
                priority
                className="object-contain scale-125 drop-shadow-md"
                sizes="(max-width: 640px) 110px, (max-width: 768px) 160px, 200px"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Title & Refresh Action Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-8 sm:size-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100/80 dark:border-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <IndianRupee className="size-4 sm:size-4.5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-lg font-semibold text-foreground tracking-tight truncate">
              Billing & Revenue
            </h2>
            <p className="hidden sm:block text-xs text-muted-foreground mt-0.5">
              School billing, transactions, and revenue trends.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={onRefresh}
          className="h-8 sm:h-9 px-2.5 sm:px-4 rounded-xl text-xs font-semibold gap-1.5 border-border bg-card hover:bg-muted/50 text-foreground shadow-2xs shrink-0 cursor-pointer"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Data</span>
        </Button>
      </div>
    </div>
  );
}
