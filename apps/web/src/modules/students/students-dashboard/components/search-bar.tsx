"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useTenantHref } from "../../hooks/use-tenant-href";

/**
 * The search that leads into the roster. This screen has no dataset of its own to
 * filter, so the box hands the term to `list` rather than pretending to search in
 * place — and the placeholder names only what the roster's query actually matches:
 * a student's name, email, username or roll number. Parent, class and phone are not
 * columns the roster searches, so promising them here would send someone to an
 * empty table.
 */
export function DashboardSearch() {
  const { push } = useRouter();
  const tenantHref = useTenantHref();
  const [term, setTerm] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const q = term.trim();
        if (!q) return;
        push(tenantHref(`list?search=${encodeURIComponent(q)}`));
      }}
      className="relative"
    >
      <Search
        className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500"
        aria-hidden
      />
      <input
        type="search"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search a student by name, email or roll number…"
        aria-label="Search students"
        className="h-12 w-full rounded-xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#0D1526] pl-11 pr-4 text-[14px] text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 shadow-2xs outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-500/20"
      />
    </form>
  );
}
