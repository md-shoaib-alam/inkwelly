'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { 
  Crown, 
  ArrowRight, 
  FileText, 
  Palette, 
  Settings, 
  Users, 
  Printer, 
  BarChart3 
} from 'lucide-react';

export interface AdmitCardUpgradeCardProps {
  onUpgrade?: () => void;
  onViewPlan?: () => void;
  className?: string;
}

export function AdmitCardUpgradeCard({
  onUpgrade,
  onViewPlan,
  className = '',
}: AdmitCardUpgradeCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-[28px] sm:rounded-[36px] border border-amber-200/50 dark:border-zinc-800 bg-gradient-to-b from-amber-50/50 via-white to-white dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-4 sm:p-8 lg:p-12 shadow-xl shadow-amber-950/[0.04] dark:shadow-none max-w-5xl mx-auto ${className}`}
    >
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 right-0 w-72 sm:w-80 h-72 sm:h-80 bg-amber-200/25 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-72 sm:w-80 h-72 sm:h-80 bg-orange-100/40 dark:bg-orange-500/5 rounded-full blur-3xl pointer-events-none -ml-16 -mb-16" />

      {/* Decorative floating dots */}
      <div className="absolute top-1/4 left-1/3 size-2.5 rounded-full bg-cyan-400/80 blur-[0.5px] pointer-events-none hidden sm:block" />
      <div className="absolute bottom-1/3 left-[36%] size-3 rounded-full bg-blue-500/80 blur-[0.5px] pointer-events-none hidden sm:block" />
      <div className="absolute top-1/2 left-8 size-2.5 rounded-full bg-blue-600/70 blur-[0.5px] pointer-events-none hidden sm:block" />
      <div className="absolute top-1/3 right-12 size-3.5 rounded-full bg-blue-600/60 blur-[0.5px] pointer-events-none hidden sm:block" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center gap-6 sm:gap-8 lg:gap-12 w-full">
        {/* Left column: Admit Card Graphic */}
        <div className="w-full lg:w-[45%] flex items-center justify-center pt-2 sm:py-4">
          <div className="relative w-full max-w-[240px] sm:max-w-[300px] lg:max-w-[360px] aspect-[4/5] flex items-center justify-center">
            <Image
              src="/assets/admin/admitcard.avif"
              alt="Admit Card preview"
              fill
              className="object-contain drop-shadow-xl select-none pointer-events-none transition-transform duration-500 hover:scale-[1.02]"
              priority
            />
          </div>
        </div>

        {/* Right column: Content & Actions */}
        <div className="w-full lg:w-[55%] flex flex-col items-center lg:items-start text-center lg:text-left justify-center">
          {/* Top Crown Squircle + Pill Badge */}
          <div className="flex items-center justify-center lg:justify-start gap-2.5">
            <div className="size-10 sm:size-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-xs">
              <Crown className="size-5 sm:size-6 text-amber-500 fill-amber-500/20" />
            </div>
            <span className="px-3.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-semibold tracking-wide border border-amber-500/20">
              Premium Feature
            </span>
          </div>

          {/* Heading */}
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight mt-3 sm:mt-4">
            Upgrade Your School Plan
          </h2>

          {/* Subtitle / Description */}
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-2 sm:mt-2.5 leading-relaxed max-w-lg">
            High-fidelity examination admit card generation and printing is exclusive to{' '}
            <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
              Growth Plan (Standard)
            </strong>{' '}
            and{' '}
            <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
              Institution Plan (Premium)
            </strong>
            .
          </p>

          <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed max-w-md">
            Unlock professional hall ticket templates, multi-student batch card printing, custom certificate generators, and advanced academic tools.
          </p>

          {/* 6 Feature Grid */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full mt-5 sm:mt-6">
            {/* Feature 1 */}
            <div className="flex items-center gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-2xl bg-zinc-50/90 dark:bg-zinc-900/60 border border-zinc-100/90 dark:border-zinc-800/80 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 transition-colors">
              <div className="size-8 sm:size-9 rounded-xl flex items-center justify-center shrink-0 border bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/40">
                <FileText className="size-4" />
              </div>
              <span className="text-[11px] sm:text-xs font-medium text-zinc-700 dark:text-zinc-300 leading-tight text-left">
                Professional hall ticket templates
              </span>
            </div>

            {/* Feature 2 */}
            <div className="flex items-center gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-2xl bg-zinc-50/90 dark:bg-zinc-900/60 border border-zinc-100/90 dark:border-zinc-800/80 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 transition-colors">
              <div className="size-8 sm:size-9 rounded-xl flex items-center justify-center shrink-0 border bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 border-pink-100 dark:border-pink-900/40">
                <Palette className="size-4" />
              </div>
              <span className="text-[11px] sm:text-xs font-medium text-zinc-700 dark:text-zinc-300 leading-tight text-left">
                Fully customizable designs
              </span>
            </div>

            {/* Feature 3 */}
            <div className="flex items-center gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-2xl bg-zinc-50/90 dark:bg-zinc-900/60 border border-zinc-100/90 dark:border-zinc-800/80 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 transition-colors">
              <div className="size-8 sm:size-9 rounded-xl flex items-center justify-center shrink-0 border bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40">
                <Settings className="size-4" />
              </div>
              <span className="text-[11px] sm:text-xs font-medium text-zinc-700 dark:text-zinc-300 leading-tight text-left">
                Bulk generation for all students
              </span>
            </div>

            {/* Feature 4 */}
            <div className="flex items-center gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-2xl bg-zinc-50/90 dark:bg-zinc-900/60 border border-zinc-100/90 dark:border-zinc-800/80 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 transition-colors">
              <div className="size-8 sm:size-9 rounded-xl flex items-center justify-center shrink-0 border bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40">
                <Users className="size-4" />
              </div>
              <span className="text-[11px] sm:text-xs font-medium text-zinc-700 dark:text-zinc-300 leading-tight text-left">
                Multi-exam & multi-class support
              </span>
            </div>

            {/* Feature 5 */}
            <div className="flex items-center gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-2xl bg-zinc-50/90 dark:bg-zinc-900/60 border border-zinc-100/90 dark:border-zinc-800/80 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 transition-colors">
              <div className="size-8 sm:size-9 rounded-xl flex items-center justify-center shrink-0 border bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-900/40">
                <Printer className="size-4" />
              </div>
              <span className="text-[11px] sm:text-xs font-medium text-zinc-700 dark:text-zinc-300 leading-tight text-left">
                High-quality PDF export & print
              </span>
            </div>

            {/* Feature 6 */}
            <div className="flex items-center gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-2xl bg-zinc-50/90 dark:bg-zinc-900/60 border border-zinc-100/90 dark:border-zinc-800/80 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 transition-colors">
              <div className="size-8 sm:size-9 rounded-xl flex items-center justify-center shrink-0 border bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border-cyan-100 dark:border-cyan-900/40">
                <BarChart3 className="size-4" />
              </div>
              <span className="text-[11px] sm:text-xs font-medium text-zinc-700 dark:text-zinc-300 leading-tight text-left">
                Advanced configuration options
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 mt-6 sm:mt-8 w-full">
            <Button
              onClick={onUpgrade}
              className="w-full sm:w-auto flex-1 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-700 hover:via-indigo-700 hover:to-purple-700 active:scale-[0.98] text-white font-semibold h-12 px-6 rounded-2xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Crown className="size-4.5 fill-amber-300 text-amber-300" />
              <span>Upgrade School Plan</span>
              <ArrowRight className="size-4" />
            </Button>

            <Button
              variant="outline"
              onClick={onViewPlan || onUpgrade}
              className="w-full sm:w-auto flex-1 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold h-12 px-6 rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText className="size-4 text-blue-600 dark:text-blue-400" />
              <span>View Plan Details</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
