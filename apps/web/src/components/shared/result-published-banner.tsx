"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, FileText, X, Sparkles } from "lucide-react";

interface PublishedExam {
  id: string;
  name: string;
  examType: string;
  className: string;
  classSection: string;
  academicYear: string;
  updatedAt: string; // ISO string — when exam was marked completed/published
}

interface ResultPublishedBannerProps {
  /** studentId — only required when viewing a specific student's results (parent portal) */
  studentId?: string;
  /** Optional className override */
  className?: string;
}

const CACHE_KEY = "published_exams_cache";
const CACHE_TTL_MS = 50 * 60 * 1000; // 50 minutes
const DISMISSED_KEY = "dismissed_result_banners";
const SHOW_WITHIN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getCache(): { data: PublishedExam[]; ts: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function setCache(data: PublishedExam[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // storage quota exceeded — ignore
  }
}

function getDismissed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]");
  } catch {
    return [];
  }
}

function addDismissed(id: string) {
  const current = getDismissed();
  if (!current.includes(id)) {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...current, id]));
  }
}

export function ResultPublishedBanner({ studentId, className: classNameProp }: ResultPublishedBannerProps) {
  const { push } = useRouter();
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";

  const [publishedExams, setPublishedExams] = useState<PublishedExam[]>(() => getCache()?.data ?? []);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [loading, setLoading] = useState(() => getCache() === null); // skip loading if cache hit

  useEffect(() => {
    setDismissed(getDismissed());
  }, []);

  useEffect(() => {
    // Serve from cache if still fresh — zero network cost
    const cached = getCache();
    if (cached) {
      setPublishedExams(cached.data);
      setLoading(false);
      return;
    }

    // Cache miss or expired → fetch from API and cache the result
    async function fetchPublishedExams() {
      try {
        setLoading(true);
        const res = await apiFetch("/api/exams?status=completed&limit=10");
        if (!res.ok) return;
        const json = await res.json();
        const data: any[] = Array.isArray(json) ? json : (json.data || []);
        const mapped: PublishedExam[] = data.map((e: any) => ({
          id: e.id,
          name: e.name,
          examType: e.examType,
          className: e.className,
          classSection: e.classSection,
          academicYear: e.academicYear,
          updatedAt: e.updatedAt ?? e.createdAt ?? new Date().toISOString(),
        }));
        setCache(mapped);
        setPublishedExams(mapped);
      } catch {
        // fail silently — banner just won't show
      } finally {
        setLoading(false);
      }
    }
    fetchPublishedExams();
  }, []); // no dependency on studentId — published exams are tenant-wide

  // Only show results published within the last 7 days AND not dismissed
  const cutoff = Date.now() - SHOW_WITHIN_MS;
  const visibleExams = publishedExams.filter(
    (e) => !dismissed.includes(e.id) && new Date(e.updatedAt).getTime() >= cutoff
  );

  if (loading || visibleExams.length === 0) return null;

  const handleDismiss = (id: string) => {
    addDismissed(id);
    setDismissed((prev) => [...prev, id]);
  };

  const handleViewMarksheet = () => {
    if (slug) {
      const path = studentId
        ? `/${slug}/view-marksheet?studentId=${studentId}`
        : `/${slug}/view-marksheet`;
      push(path);
    }
  };

  // Deduplicate by examType cycle name (e.g. "Mid Term 2024-2025")
  const uniqueCycles = Array.from(
    new Map(visibleExams.map((e) => [`${e.examType}::${e.academicYear}`, e])).values()
  );

  return (
    <div className={`space-y-3 ${classNameProp ?? ""}`}>
      {uniqueCycles.map((exam) => (
        <div
          key={exam.id}
          className="relative overflow-hidden rounded-2xl border border-emerald-200/80 dark:border-emerald-800/50 bg-gradient-to-r from-emerald-50 via-teal-50/60 to-cyan-50/40 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-cyan-950/10 shadow-sm"
        >
          {/* Animated shimmer overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent -skew-x-12 translate-x-[-200%] animate-[shimmer_3s_ease-in-out_infinite]" />

          <div className="relative flex items-center justify-between gap-3 px-3 py-3 sm:px-4 sm:py-3.5">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Icon */}
              <div className="shrink-0 size-8 sm:size-9 rounded-xl bg-emerald-500 dark:bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
                <Trophy className="size-4 sm:size-4.5" />
              </div>

              {/* Text */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-xs sm:text-sm font-semibold text-emerald-900 dark:text-emerald-100 leading-tight">
                    Results Out!
                  </p>
                  <Badge className="text-[8px] sm:text-[9px] font-semibold tracking-tight px-1 py-0 border-none bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-none uppercase">
                    New
                  </Badge>
                </div>
                <p className="text-[10px] sm:text-xs text-emerald-700 dark:text-emerald-400 mt-0.5 font-medium truncate">
                  {exam.name
                    ? exam.name.replace(/ - .+$/, "")
                    : `${exam.examType} · ${exam.academicYear}`}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="sm"
                onClick={handleViewMarksheet}
                className="h-7 sm:h-8 gap-1 text-[10px] sm:text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white shadow-sm border-none rounded-lg px-2 sm:px-3 transition-all"
              >
                <FileText className="size-3 sm:size-3.5" />
                <span className="hidden sm:inline">View Marksheet</span>
                <span className="sm:hidden">View</span>
              </Button>
              <button
                onClick={() => handleDismiss(exam.id)}
                className="size-5 sm:size-6 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="size-3 sm:size-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
