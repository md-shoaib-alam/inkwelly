'use client';

import React from 'react';
import Image from 'next/image';

import { QrCode } from 'lucide-react';

interface TeacherWelcomeBannerProps {
  userName: string;
  onOpenQRScan?: () => void;
}

export function TeacherWelcomeBanner({ userName, onOpenQRScan }: TeacherWelcomeBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-sky-100/80 dark:border-zinc-800 bg-gradient-to-r from-sky-50/90 via-emerald-50/30 to-amber-50/60 dark:from-zinc-900 dark:via-zinc-900/90 dark:to-zinc-900 py-3.5 sm:py-4 px-4 sm:px-6 shadow-xs">
      {/* Ambient background glows matching illustration colors (blue, emerald, amber) */}
      <div className="absolute -top-12 -left-8 w-56 h-56 bg-sky-200/35 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-48 h-48 bg-emerald-100/30 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 right-16 w-44 h-44 bg-sky-200/30 dark:bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -top-8 -right-6 w-52 h-52 bg-amber-200/40 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between gap-3 sm:gap-6">
        {/* Left Section: Greeting & Info */}
        <div className="flex flex-col justify-center min-w-0 flex-1">
          <span className="text-[11px] sm:text-xs font-medium text-sky-800/70 dark:text-sky-400">
            Welcome back,
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight mt-0.5">
            {userName}
          </h1>
          <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1 sm:line-clamp-none">
            Here&apos;s what&apos;s happening with your classes today.
          </p>

          {onOpenQRScan && (
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenQRScan}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <QrCode className="size-3.5" />
                <span>Scan Attendance QR</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Section: teachertop.avif Image */}
        <div className="relative w-28 sm:w-36 md:w-44 h-20 sm:h-24 md:h-28 shrink-0 flex items-center justify-end">
          <Image
            src="/assets/teacher/teachertop.avif"
            alt="Teacher illustration"
            fill
            sizes="(max-width: 640px) 112px, (max-width: 768px) 144px, 176px"
            className="object-contain select-none pointer-events-none drop-shadow-xs"
            priority
          />
        </div>
      </div>
    </div>
  );
}
