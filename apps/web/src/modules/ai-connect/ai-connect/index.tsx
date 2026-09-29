"use client";

import React, { useState } from "react";
import AIChatShowcase, { ClaudeMark, GrokMark, ChatGPTMark } from "./AIChatShowcase";
import {
  Radio,
  MessageSquare,
  ShieldCheck,
  Zap,
  Activity,
  Search,
  KeyRound,
  Lock,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Bot,
} from "lucide-react";

export function AdminAiConnect() {
  const [timeRange, setTimeRange] = useState<"7" | "30" | "90">("30");

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto pb-12 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-[family-name:var(--font-lexend)]">
            AI Connect
          </h1>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800">
            MCP
          </span>
        </div>

        {/* Time filter pill selector */}
        <div
          role="group"
          aria-label="Time range"
          className="inline-flex gap-[3px] rounded-[11px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-[4px] shadow-xs self-start sm:self-auto"
        >
          {(["7", "30", "90"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`rounded-lg transition-colors text-[12.5px] font-semibold px-[12px] py-[6px] ${
                timeRange === range
                  ? "bg-[#0D9488] text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              style={
                timeRange === range
                  ? { background: "var(--action-primary, #0D9488)", color: "var(--action-on-primary, #FFFFFF)" }
                  : undefined
              }
            >
              {range} days
            </button>
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[20px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-[24px_26px] mb-4 shadow-xs">
        <div className="relative grid gap-8 items-center grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.18fr)]">
          {/* Left Hero Content */}
          <div className="space-y-4 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#0D9488] dark:text-teal-400 uppercase">
              <span className="size-2 rounded-full bg-[#0D9488] animate-pulse" />
              AI CONNECT · LIVE
            </div>

            <div>
              <h2 className="font-[family-name:var(--font-lexend)] font-semibold tracking-tight text-[32px] leading-[36px] text-[#0F172A] dark:text-white">
                Your office can just{" "}
                <span className="text-[#0D9488] dark:text-teal-400">ask.</span>
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-3">
                Connect Claude or ChatGPT and get instant answers from your own school data —{" "}
                <strong className="font-semibold text-slate-800 dark:text-slate-100">
                  read-only
                </strong>
                , scoped to each person, and every question logged.
              </p>
            </div>

            {/* Feature Tags */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50/60 dark:bg-teal-950/40 text-slate-700 dark:text-slate-300 border border-teal-200/70 dark:border-teal-800/70 text-xs font-medium">
                <ShieldCheck className="size-3.5 text-[#0D9488]" />
                Scoped access
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50/60 dark:bg-teal-950/40 text-slate-700 dark:text-slate-300 border border-teal-200/70 dark:border-teal-800/70 text-xs font-medium">
                <span className="font-bold text-xs text-[#0D9488]">₹</span>
                ₹ can be masked
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50/60 dark:bg-teal-950/40 text-slate-700 dark:text-slate-300 border border-teal-200/70 dark:border-teal-800/70 text-xs font-medium">
                <RotateCcw className="size-3.5 text-[#0D9488]" />
                Revoke anytime
              </div>
            </div>

            {/* Status Line */}
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              2 assistants connected · 4 answered ·{" "}
              <span className="text-[#0D9488] dark:text-teal-400 font-bold">
                0 ever changed
              </span>
            </p>

            {/* Brand Logos Row matching screenshot 4 */}
            <div className="flex items-center gap-2.5 pt-1">
              {/* OpenAI / ChatGPT logo card */}
              <div className="size-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs flex items-center justify-center text-slate-900 dark:text-white">
                <ChatGPTMark size={18} fill="currentColor" />
              </div>

              {/* Claude Asterisk card */}
              <div className="size-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs flex items-center justify-center">
                <ClaudeMark size={20} />
              </div>

              {/* Google Gemini 4-point star card */}
              <div className="size-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs flex items-center justify-center">
                <svg className="size-5" viewBox="0 0 24 24">
                  <defs>
                    <linearGradient id="gemini-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#4285F4" />
                      <stop offset="35%" stopColor="#9B72CB" />
                      <stop offset="70%" stopColor="#D96570" />
                      <stop offset="100%" stopColor="#F4B400" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M12 2a10 10 0 0 0 2.5 7.5A10 10 0 0 0 22 12a10 10 0 0 0-7.5 2.5A10 10 0 0 0 12 22a10 10 0 0 0-2.5-7.5A10 10 0 0 0 2 12a10 10 0 0 0 7.5-2.5A10 10 0 0 0 12 2z"
                    fill="url(#gemini-grad)"
                  />
                </svg>
              </div>

              {/* Grok / X slash circle card */}
              <div className="size-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs flex items-center justify-center text-slate-900 dark:text-white">
                <GrokMark size={18} color="currentColor" />
              </div>

              {/* Geometric flower / MCP card */}
              <div className="size-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs flex items-center justify-center text-slate-900 dark:text-white">
                <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="5" y="5" width="6" height="6" rx="1.5" />
                  <rect x="13" y="5" width="6" height="6" rx="1.5" />
                  <rect x="5" y="13" width="6" height="6" rx="1.5" />
                  <rect x="13" y="13" width="6" height="6" rx="1.5" />
                  <path d="M8 8l8 8M16 8l-8 8" />
                </svg>
              </div>
            </div>
          </div>

          {/* Right Hero Showcase Component with increased comfortable width */}
          <div className="w-full flex justify-end">
            <AIChatShowcase height={346} />
          </div>
        </div>
      </div>

      {/* 4 KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Metric 1: Connected AIs */}
        <div className="rounded-[16px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-[18px] shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
            <span className="flex size-6 items-center justify-center rounded-md bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400">
              <Radio className="size-3.5" />
            </span>
            Connected AIs
          </div>
          <div>
            <div className="text-[28px] font-bold text-slate-900 dark:text-white font-[family-name:var(--font-lexend)]">
              2
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">Claude</div>
          </div>
        </div>

        {/* Metric 2: Questions - [timeRange] days */}
        <div className="rounded-[16px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-[18px] shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
            <span className="flex size-6 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <MessageSquare className="size-3.5" />
            </span>
            Questions · {timeRange} days
          </div>
          <div>
            <div className="text-[28px] font-bold text-slate-900 dark:text-white font-[family-name:var(--font-lexend)]">
              4
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">vs previous window</div>
          </div>
        </div>

        {/* Metric 3: Answered cleanly */}
        <div className="rounded-[16px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-[18px] shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
            <span className="flex size-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <ShieldCheck className="size-3.5" />
            </span>
            Answered cleanly
          </div>
          <div>
            <div className="text-[28px] font-bold text-slate-900 dark:text-white font-[family-name:var(--font-lexend)]">
              100%
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">4 of 4 · 0 blocked</div>
          </div>
        </div>

        {/* Metric 4: Avg response */}
        <div className="rounded-[16px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-[18px] shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
            <span className="flex size-6 items-center justify-center rounded-md bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
              <Zap className="size-3.5" />
            </span>
            Avg response
          </div>
          <div>
            <div className="text-[28px] font-bold text-slate-900 dark:text-white font-[family-name:var(--font-lexend)]">
              0.00s
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">Fast & reliable</div>
          </div>
        </div>
      </div>

      {/* Middle Section: Activity (Left) + Connected AIs & Guardrails (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Left Column (2 cols): Activity Chart */}
        <div className="lg:col-span-2 space-y-4">
          {/* Activity Over Time Card */}
          <div className="rounded-[16px] overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400">
                  <Activity className="size-4.5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white font-[family-name:var(--font-lexend)]">
                    Activity over time
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Questions per day · last {timeRange} days
                  </p>
                </div>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-teal-600" />
                  Answered
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-amber-500" />
                  Blocked
                </span>
              </div>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="mt-8 pt-4">
              <div className="h-44 w-full flex items-end justify-between gap-3 px-2 sm:px-6 border-b border-slate-200/80 dark:border-slate-800">
                {/* Day 1 */}
                <div className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="w-full max-w-[48px] h-0.5 rounded-t-sm bg-teal-500/20 dark:bg-slate-800" />
                </div>
                {/* Day 2 */}
                <div className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="w-full max-w-[48px] h-0.5 rounded-t-sm bg-teal-500/20 dark:bg-slate-800" />
                </div>
                {/* Day 3 */}
                <div className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="w-full max-w-[48px] h-0.5 rounded-t-sm bg-teal-500/20 dark:bg-slate-800" />
                </div>
                {/* Day 4 */}
                <div className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="w-full max-w-[48px] h-0.5 rounded-t-sm bg-teal-500/20 dark:bg-slate-800" />
                </div>
                {/* Day 5 */}
                <div className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="w-full max-w-[48px] h-0.5 rounded-t-sm bg-teal-500/20 dark:bg-slate-800" />
                </div>
                {/* Day 6 (Today - Active Bar) */}
                <div className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div
                    className="w-full max-w-[64px] rounded-t-md bg-gradient-to-t from-teal-700 via-teal-500 to-teal-400 shadow-xs transition-all duration-300 hover:brightness-110"
                    style={{ height: "88%" }}
                    title="4 questions answered cleanly"
                  />
                </div>
                {/* Day 7 */}
                <div className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="w-full max-w-[48px] h-0.5 rounded-t-sm bg-teal-500/20 dark:bg-slate-800" />
                </div>
              </div>

              {/* X Axis Labels */}
              <div className="flex justify-between items-center text-[11px] font-medium text-slate-400 dark:text-slate-500 pt-3 px-2 sm:px-6">
                <span>7d ago</span>
                <span>5d</span>
                <span>2d</span>
                <span>Today</span>
              </div>
            </div>
          </div>

          {/* What your AI asks about */}
          <div className="rounded-[16px] overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
                <Search className="size-4.5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-[family-name:var(--font-lexend)]">
                  What your AI asks about
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Most-used tools & module mix
                </p>
              </div>
            </div>

            <div className="mt-4 py-4 text-left">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No questions asked yet in this window.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Connected AIs + Guardrails held */}
        <div className="space-y-4">
          {/* Connected AIs Card */}
          <div className="rounded-[16px] overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                  <KeyRound className="size-4.5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white font-[family-name:var(--font-lexend)]">
                    Connected AIs
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Most active this window
                  </p>
                </div>
              </div>

              <button className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 hover:underline">
                Manage keys
              </button>
            </div>

            {/* AI Connected List */}
            <div className="mt-5 space-y-3">
              {/* Item 1 */}
              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-orange-50 dark:bg-orange-950/40 border border-orange-200/70 dark:border-orange-800 flex items-center justify-center">
                    <ClaudeMark size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                      Claude · Anthropic
                    </h4>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      test · Chanchal Verma
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">2</span>
                  <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    Revoked
                  </div>
                </div>
              </div>

              {/* Item 2 */}
              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-orange-50 dark:bg-orange-950/40 border border-orange-200/70 dark:border-orange-800 flex items-center justify-center">
                    <ClaudeMark size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                      Claude · Anthropic
                    </h4>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      test · Chanchal Verma
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">1</span>
                  <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    Revoked
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Guardrails Held Card */}
          <div className="rounded-[16px] overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400">
                  <ShieldCheck className="size-4.5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white font-[family-name:var(--font-lexend)]">
                    Guardrails held
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Blocked before any data left
                  </p>
                </div>
              </div>

              <div className="text-2xl font-extrabold text-amber-500 font-[family-name:var(--font-lexend)]">
                0
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
              No blocked requests — everything asked was within allowed access.
            </p>
          </div>
        </div>
      </div>

      {/* Live Call Feed Section */}
      <div className="rounded-[16px] overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 mb-4 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900">
              <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
              LIVE
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-[family-name:var(--font-lexend)]">
              See exactly what each AI reads
            </h3>
          </div>

          <button className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 flex items-center gap-1 hover:underline">
            View all
            <ChevronRight className="size-3.5" />
          </button>
        </div>

        {/* Live Call Rows */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {/* Row 1 */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-orange-50 dark:bg-orange-950/40 border border-orange-200/70 dark:border-orange-800 flex items-center justify-center shrink-0">
                <ClaudeMark size={16} />
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Claude · test · Chanchal Verma —{" "}
                <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                  tools/list
                </span>
              </span>
            </div>

            <div className="flex items-center gap-4 sm:gap-6 text-xs shrink-0 self-end sm:self-auto">
              <span className="text-slate-400 font-mono text-[11px]">11 rows</span>
              <span className="text-slate-400 font-mono text-[11px]">0.0s</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800">
                Success
              </span>
              <span className="text-slate-400 text-[11px]">14 hr ago</span>
            </div>
          </div>

          {/* Row 2 */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-orange-50 dark:bg-orange-950/40 border border-orange-200/70 dark:border-orange-800 flex items-center justify-center shrink-0">
                <ClaudeMark size={16} />
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Claude · test · Chanchal Verma —{" "}
                <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                  connect
                </span>
              </span>
            </div>

            <div className="flex items-center gap-4 sm:gap-6 text-xs shrink-0 self-end sm:self-auto">
              <span className="text-slate-400 font-mono text-[11px]">0.0s</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800">
                Success
              </span>
              <span className="text-slate-400 text-[11px]">14 hr ago</span>
            </div>
          </div>

          {/* Row 3 */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-orange-50 dark:bg-orange-950/40 border border-orange-200/70 dark:border-orange-800 flex items-center justify-center shrink-0">
                <ClaudeMark size={16} />
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Claude · test · Chanchal Verma —{" "}
                <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                  tools/list
                </span>
              </span>
            </div>

            <div className="flex items-center gap-4 sm:gap-6 text-xs shrink-0 self-end sm:self-auto">
              <span className="text-slate-400 font-mono text-[11px]">11 rows</span>
              <span className="text-slate-400 font-mono text-[11px]">0.0s</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800">
                Success
              </span>
              <span className="text-slate-400 text-[11px]">14 hr ago</span>
            </div>
          </div>

          {/* Row 4 */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300 shrink-0">
                A
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                AI assistant · test · Chanchal Verma —{" "}
                <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                  connect
                </span>
              </span>
            </div>

            <div className="flex items-center gap-4 sm:gap-6 text-xs shrink-0 self-end sm:self-auto">
              <span className="text-slate-400 font-mono text-[11px]">0.0s</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800">
                Success
              </span>
              <span className="text-slate-400 text-[11px]">14 hr ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer "TRY ASKING YOUR AI" Section */}
      <div className="space-y-3 pt-1">
        <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase font-[family-name:var(--font-lexend)]">
          Try asking your AI
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Prompt 1 */}
          <div className="rounded-[16px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex items-center gap-3.5 hover:border-teal-400/80 hover:shadow-xs transition-all cursor-pointer group">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400 group-hover:scale-105 transition-transform">
              <Sparkles className="size-4.5" />
            </span>
            <p className="text-xs sm:text-[13px] font-medium text-slate-800 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
              Which students have pending fees over ₹10,000?
            </p>
          </div>

          {/* Prompt 2 */}
          <div className="rounded-[16px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex items-center gap-3.5 hover:border-teal-400/80 hover:shadow-xs transition-all cursor-pointer group">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400 group-hover:scale-105 transition-transform">
              <Sparkles className="size-4.5" />
            </span>
            <p className="text-xs sm:text-[13px] font-medium text-slate-800 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
              Show me this month&apos;s fee collection summary.
            </p>
          </div>

          {/* Prompt 3 */}
          <div className="rounded-[16px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex items-center gap-3.5 hover:border-teal-400/80 hover:shadow-xs transition-all cursor-pointer group">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400 group-hover:scale-105 transition-transform">
              <Sparkles className="size-4.5" />
            </span>
            <p className="text-xs sm:text-[13px] font-medium text-slate-800 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
              List students with birthdays this week.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Metadata Disclaimer */}
      <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-2">
        Last activity 28/09/2026, 07:06 pm · Every call is read-only and permanently logged in Call History.
      </p>
    </div>
  );
}
