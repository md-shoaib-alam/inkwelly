'use client';

import Image from 'next/image';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ExamsHeroBannerProps {
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  title?: string;
  description?: string;
}

export function ExamsHeroBanner({
  searchQuery = '',
  onSearchChange,
  title = "Manage Exams Efficiently",
  description = "Create, schedule and track all examinations for the selected academic year.",
}: ExamsHeroBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-sky-100 dark:border-sky-950/40 bg-gradient-to-r from-sky-50/80 via-blue-50/50 to-sky-100/70 dark:from-sky-950/30 dark:via-blue-950/20 dark:to-sky-900/30 px-5 sm:px-6 py-4 shadow-xs">
      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900 dark:text-white leading-tight">
            <span className="sm:hidden">Exam Manage</span>
            <span className="hidden sm:inline">{title}</span>
          </h2>
          <p className="hidden sm:block mt-1 text-xs text-slate-500 dark:text-slate-400 leading-snug">
            {description}
          </p>

          {/* In-hero Search Input */}
          <div className="relative mt-2.5 max-w-sm sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 dark:text-slate-500" />
            <Input
              placeholder="Search exams..."
              className="pl-9 h-9 bg-white/95 dark:bg-zinc-900/95 border-slate-200/90 dark:border-zinc-800 rounded-xl shadow-2xs text-xs placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-blue-500 w-full"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </div>
        </div>

        {/* Right Side Illustration Image from /assets/admin/examtop.avif */}
        <div className="relative h-18 sm:h-22 md:h-24 aspect-[4/3] shrink-0 overflow-hidden">
          <Image
            src="/assets/admin/examtop.avif"
            alt="Manage Exams"
            fill
            priority
            className="object-contain"
            sizes="(max-width: 640px) 90px, (max-width: 768px) 120px, 150px"
          />
        </div>
      </div>
    </div>
  );
}
