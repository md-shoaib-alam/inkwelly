"use client";

/**
 * The reference's last line. The server sends the instant a record changed and this is
 * the only place it becomes a string — the moment the page was opened would read as
 * "this cohort is fresh" even when nothing was touched today.
 */
export function UpdatedFooter({ at }: { at?: string | null }) {
  if (!at) return null;
  const when = new Date(at);
  if (Number.isNaN(when.getTime())) return null;

  // en-GB gives "29 Sept 2026" and "11:38 pm" — day first, lowercase meridiem, no
  // leading zero on the hour, which is what the shipped screen prints.
  const day = when.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const time = when.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true });

  return (
    <footer className="border-t border-slate-200/70 dark:border-zinc-800 pt-3">
      <p className="text-center text-[13px] text-slate-500 dark:text-zinc-500">
        Updated {day} · {time}
      </p>
    </footer>
  );
}
