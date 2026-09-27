"use client";

import Image from "next/image";
import { ShieldCheck } from "lucide-react";

export function RoleHeroBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50/90 via-sky-50/50 to-indigo-50/40 dark:from-slate-900 dark:via-blue-950/30 dark:to-slate-900 border border-blue-100/90 dark:border-slate-800 px-4.5 sm:px-6 py-3 sm:py-3.5 shadow-2xs">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-1/4 w-80 h-48 bg-blue-400/15 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-6 right-10 w-48 h-36 bg-sky-300/15 dark:bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Content: Compact Left Headline & Right 3D Graphic */}
      <div className="relative z-10 flex items-center justify-between gap-3 sm:gap-4">
        {/* Left Copy */}
        <div className="max-w-md min-w-0">
          <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 rounded-full bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase tracking-wider border border-blue-200/60 dark:border-blue-800/40 shadow-2xs">
            <ShieldCheck className="size-3 text-blue-600 dark:text-blue-400" />
            <span>Secure Access</span>
          </div>

          <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground tracking-tight leading-tight mt-1 sm:mt-1.5">
            Right People. Right Access.
          </h3>

          <p className="hidden sm:block text-xs text-muted-foreground mt-0.5 leading-snug font-normal">
            Granular access control and permission management.
          </p>
        </div>

        {/* Right 3D Illustration */}
        <div className="relative flex items-center justify-end shrink-0 pr-0.5 sm:pr-2">
          <div className="relative h-14 sm:h-20 md:h-22 aspect-[16/9] overflow-hidden select-none">
            <Image
              src="/assets/super-admin/roletop.avif"
              alt="Roles & Permissions"
              fill
              priority
              className="object-contain scale-125 drop-shadow-md"
              sizes="(max-width: 640px) 110px, (max-width: 768px) 160px, 200px"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
