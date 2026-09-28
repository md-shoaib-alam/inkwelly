"use client";

import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/use-app-store";
import { Wrench, RefreshCw, LogOut, Building2 } from "lucide-react";


export function MaintenanceScreen({ message }: { message?: string }) {
  const { logout, currentTenantName } = useAppStore();

  const refreshPage = () => {
    window.location.reload();
  };

  const goLogin = () => {
    logout();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
      <div className="text-center max-w-lg">
        {/* Animated wrench icon */}
        <div className="relative mb-8 flex justify-center">
          {/* Outer pulsing ring */}
          <div className="absolute inset-0 flex items-center justify-center animate-[ping_2.5s_ease-in-out_infinite]">
            <div className="size-48 rounded-full bg-amber-100 dark:bg-amber-950/30 opacity-20" />
          </div>

          {/* Middle ring */}
          <div className="absolute inset-0 flex items-center justify-center animate-pulse">
            <div className="size-36 rounded-full bg-amber-100 dark:bg-amber-950/20 opacity-30" />
          </div>

          {/* Main icon container */}
          <div className="relative inline-flex items-center justify-center size-28 animate-[scale-in_0.6s_cubic-bezier(0.34,1.56,0.64,1)_forwards] opacity-0">
            <div className="absolute size-28 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 shadow-2xl shadow-amber-300/50 dark:shadow-amber-900/50" />
            <div className="relative z-10 text-white">
              <Wrench className="size-14" />
            </div>
          </div>

          {/* Floating gear */}
          <div className="absolute -top-2 -right-4 size-8 rounded-lg bg-orange-400 dark:bg-orange-500 flex items-center justify-center shadow-lg animate-[float-bounce_3s_ease-in-out_infinite]">
            <span className="text-white text-sm">⚙</span>
          </div>
          <div className="absolute -bottom-1 -left-4 size-8 rounded-lg bg-amber-500 dark:bg-amber-600 flex items-center justify-center shadow-lg animate-[float-bounce_3s_ease-in-out_1s_infinite]">
            <span className="text-white text-lg">🔧</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight animate-[fade-up_0.7s_cubic-bezier(0.34,1.56,0.64,1)_0.3s_forwards] opacity-0">
          <span className="text-amber-600 dark:text-amber-500">
            Under Maintenance
          </span>
        </h1>

        {/* School name badge */}
        {currentTenantName && (
          <div className="mt-4 animate-[fade-up_0.6s_ease-out_0.45s_forwards] opacity-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm text-sm font-medium text-zinc-600 dark:text-zinc-300">
              <Building2 className="size-3.5" />
              {currentTenantName}
            </span>
          </div>
        )}

        {/* Description */}
        <p className="text-zinc-500 dark:text-zinc-400 mt-4 text-base leading-relaxed animate-[fade-up_0.6s_ease-out_0.55s_forwards] opacity-0 max-w-md mx-auto whitespace-pre-line">
          {message || (
            <>
              Our platform is currently undergoing scheduled maintenance to bring
              you improvements.
              <br />
              We&apos;ll be back shortly. Thank you for your patience!
            </>
          )}
        </p>

        {/* Estimated time */}
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 animate-[fade-up_0.6s_ease-out_0.65s_forwards] opacity-0">
          <div className="size-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
            Maintenance in progress: please check back in a few minutes
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-3 mt-8 animate-[fade-up_0.6s_ease-out_0.8s_forwards] opacity-0">
          <Button
            onClick={refreshPage}
            className="gap-2 bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white"
          >
            <RefreshCw className="size-4" />
            Check Again
          </Button>
          <Button
            variant="outline"
            onClick={goLogin}
            className="gap-2 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            <LogOut className="size-4" />
            Logout
          </Button>
        </div>

        {/* Bottom text */}
        <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-10 animate-[fade-in_0.5s_ease_1s_forwards] opacity-0">
          SchoolSaaS: If this persists, please contact your school
          administrator.
        </p>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes scale-in {
          from { opacity: 0; transform: translateY(20px) scale(0.8); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes float-bounce {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(5deg); }
        }
      `}</style>
    </div>
  );
}
