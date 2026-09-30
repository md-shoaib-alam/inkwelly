import { useState } from "react";
import { Check, ChevronDown, Loader2, RefreshCw, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAppStore } from "@/store/use-app-store";
import { cn } from "@/lib/utils";
import { studentRefOf } from "../../student-ref";

interface SwitcherHit {
  id: string;
  name: string;
  username: string | null;
  rollNumber: string;
  className: string | null;
}

/**
 * A school of five thousand cannot be switched from a list of the current page, so the
 * picker searches the same roster endpoint the roster itself uses. Whatever the user
 * types is sent; nothing is filtered client-side against a page they never looked at.
 */
export function ProfileSwitcher({
  currentRef,
  onPick,
  onAllStudents,
}: {
  currentRef: string;
  onPick: (ref: string) => void;
  onAllStudents: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const { currentTenantId } = useAppStore();

  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: ["student-switcher", currentTenantId, term],
    enabled: open,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "20", sort: "name", dir: "asc" });
      if (term.trim()) params.set("search", term.trim());
      const res = await apiFetch(`/api/student-roster?${params.toString()}`);
      // A failed search must not read as "nobody matches" — that is a claim about the
      // school's data drawn from the absence of an answer.
      if (!res.ok) throw new Error(`student-roster ${res.status}`);
      const body = await res.json();
      return {
        items: (body.items ?? []) as SwitcherHit[],
        totalItems: (body.totalItems ?? 0) as number,
      };
    },
  });

  const hits = data?.items ?? [];
  const total = data?.totalItems ?? 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-9 gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 text-xs font-semibold text-slate-700 dark:text-zinc-200 shadow-xs hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
        >
          <span>Switch profile</span>
          <ChevronDown className="size-3.5 text-slate-500 dark:text-zinc-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[360px] rounded-xl p-0">
        <div className="border-b border-slate-100 px-4 py-3 dark:border-zinc-800">
          <p className="text-sm font-semibold text-slate-900 dark:text-zinc-50">Switch profile</p>
          <p className="text-[12.5px] text-slate-500 dark:text-zinc-400">
            {isError
              ? "Can't be counted right now"
              : data
                ? `${total.toLocaleString()} student${total === 1 ? "" : "s"} in this school`
                : "Counting…"}
          </p>
        </div>

        <div className="relative px-3 pt-3">
          <Search className="pointer-events-none absolute left-5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search by name, ID or roll no."
            className="h-9 pl-8 text-[12.5px]"
            autoFocus
          />
        </div>

        <div className="h-[280px] overflow-y-auto p-2">
          {isError && !hits.length ? (
            <div className="flex flex-col items-center gap-2 py-10 text-[12.5px] text-slate-500 dark:text-zinc-400">
              <p>The roster didn't answer, so this says nothing about who exists.</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-[12.5px]"
                onClick={() => refetch()}
              >
                <RefreshCw className="size-3.5" />
                Try the search again
              </Button>
            </div>
          ) : isFetching && !hits.length ? (
            <div className="flex items-center justify-center gap-2 py-10 text-[12.5px] text-slate-400">
              <Loader2 className="size-4 animate-spin" />
              Searching
            </div>
          ) : hits.length ? (
            hits.map((s) => {
              const ref = studentRefOf(s);
              const isCurrent = ref === currentRef;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onPick(ref);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors cursor-pointer",
                    isCurrent
                      ? "bg-emerald-50/80 dark:bg-emerald-950/40"
                      : "hover:bg-slate-50 dark:hover:bg-zinc-800/60",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-slate-800 dark:text-zinc-100">
                      {s.name}
                    </span>
                    <span className="block truncate font-mono text-[11.5px] text-slate-400 dark:text-zinc-500">
                      {ref}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11.5px] font-medium text-slate-500 dark:text-zinc-400">
                    {s.className ?? "Unassigned"}
                  </span>
                  {isCurrent && <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />}
                </button>
              );
            })
          ) : (
            <p className="px-2 py-10 text-center text-[12.5px] text-slate-400 dark:text-zinc-500">
              No student matches “{term.trim() || "anything"}”.
            </p>
          )}

          {hits.length === 20 && (
            <p className="px-2.5 py-2 text-[11.5px] text-slate-400 dark:text-zinc-500">
              Showing the first 20 of {total.toLocaleString()}. Keep typing to narrow it.
            </p>
          )}
        </div>

        <div className="border-t border-slate-100 p-2 dark:border-zinc-800">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setOpen(false);
              onAllStudents();
            }}
            className="w-full justify-start text-[13px] font-semibold text-emerald-700 dark:text-emerald-400"
          >
            All students
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
