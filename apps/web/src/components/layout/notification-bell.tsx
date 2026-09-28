"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Check, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { apiFetch } from "@/lib/api";
import { useAppStore } from "@/store/use-app-store";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  content: string;
  createdAt: string | Date;
  type: string;
  isRead: boolean;
}

// The FCM foreground handler fires this so the badge updates instantly;
// the poll below is only the fallback for pushes the tab missed.
export const NOTIFICATIONS_REFRESH_EVENT = "app:notifications-refresh";

const FAST_POLL_MS = 60_000;
const SLOW_POLL_MS = 5 * 60_000;

function timeAgo(value: string | Date): string {
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";
  const minutes = Math.floor((Date.now() - then) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString();
}

export function NotificationBell() {
  const currentUser = useAppStore((s) => s.currentUser);
  const currentUserId = currentUser?.id;

  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  const unreadRef = useRef(0);
  useEffect(() => {
    unreadRef.current = unread;
  }, [unread]);

  const refreshCount = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const res = await apiFetch("/api/notifications/count");
      if (res.ok) {
        const data = await res.json();
        setUnread(Number(data?.unread) || 0);
      }
    } catch {
      // Badge refresh is best-effort; the next poll retries.
    }
  }, [currentUserId]);

  const loadList = useCallback(async () => {
    if (!currentUserId) return;
    setLoadingList(true);
    try {
      const res = await apiFetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      }
    } catch {
      // Keep whatever list is already shown.
    } finally {
      setLoadingList(false);
    }
  }, [currentUserId]);

  // Badge: fetch on login, on tab re-focus, on push, then adaptive poll while
  // the tab is visible only — 60s with unreads, 5min when at zero, zero
  // requests for backgrounded tabs.
  useEffect(() => {
    if (!currentUserId) {
      setUnread(0);
      setItems([]);
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const scheduleNext = () => {
      timer = setTimeout(async () => {
        if (cancelled) return;
        if (document.visibilityState === "visible") await refreshCount();
        if (!cancelled) scheduleNext();
      }, unreadRef.current === 0 ? SLOW_POLL_MS : FAST_POLL_MS);
    };

    void refreshCount().then(() => {
      if (!cancelled) scheduleNext();
    });

    const onVisibility = () => {
      if (document.visibilityState === "visible") void refreshCount();
    };
    const onRefreshEvent = () => void refreshCount();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener(NOTIFICATIONS_REFRESH_EVENT, onRefreshEvent);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(NOTIFICATIONS_REFRESH_EVENT, onRefreshEvent);
    };
  }, [currentUserId, refreshCount]);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) void loadList();
  };

  const dismiss = async (item: NotificationItem) => {
    setHiddenIds((prev) => new Set(prev).add(item.id));
    try {
      if (item.id.startsWith("transient_")) {
        await apiFetch(`/api/notifications/transient/${item.id}`, { method: "DELETE" });
      } else if (!item.isRead) {
        await apiFetch(`/api/notifications/${item.id}/read`, { method: "PATCH" });
        setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
      }
      void refreshCount();
    } catch {
      // UI already hid it; server state converges on next open.
    }
  };

  const markAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setHiddenIds(new Set());
    try {
      await apiFetch("/api/notifications/read-all", { method: "PATCH" });
      setUnread(0);
      unreadRef.current = 0;
      void refreshCount();
    } catch {
      void refreshCount();
    }
  };

  const clearAll = async () => {
    setItems([]);
    setUnread(0);
    unreadRef.current = 0;
    try {
      await apiFetch("/api/notifications", { method: "DELETE" });
    } catch {
      void refreshCount();
    }
  };

  const visibleItems = items.filter((n) => !hiddenIds.has(n.id));

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
          className="size-8.5 sm:size-9 shrink-0 rounded-xl border border-slate-200/70 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100/80 dark:hover:bg-zinc-800 shadow-none transition-all cursor-pointer relative"
        >
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-semibold leading-none ring-2 ring-white dark:ring-zinc-900">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 gap-0 rounded-xl">
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200/70 dark:border-zinc-800">
          <span className="text-sm font-semibold">Notifications</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={markAllRead}
              disabled={items.length === 0}
              title="Mark all as read"
            >
              <Check className="size-3.5" /> Read all
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={clearAll}
              disabled={items.length === 0}
              title="Clear all notifications"
            >
              <Trash2 className="size-3.5" /> Clear
            </Button>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loadingList && visibleItems.length === 0 && (
            <div className="px-3 py-6 text-center text-xs text-slate-500 dark:text-zinc-400">Loading…</div>
          )}
          {!loadingList && visibleItems.length === 0 && (
            <div className="px-3 py-6 text-center text-xs text-slate-500 dark:text-zinc-400">
              You're all caught up.
            </div>
          )}
          {visibleItems.map((item) => (
            <div
              key={item.id}
              className="group flex items-start gap-2 px-3 py-2.5 border-b border-slate-100 dark:border-zinc-800/60 last:border-b-0 hover:bg-slate-50/80 dark:hover:bg-zinc-800/50"
            >
              <span
                className={cn(
                  "mt-1.5 size-2 rounded-full shrink-0",
                  item.isRead ? "bg-transparent" : "bg-blue-600"
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium leading-tight truncate">{item.title}</div>
                <div className="text-xs text-slate-600 dark:text-zinc-400 leading-snug line-clamp-2">
                  {item.content}
                </div>
                <div className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
                  {timeAgo(item.createdAt)}
                </div>
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismiss(item)}
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
