"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Bell } from "lucide-react";
import type { NoticeInfo } from "@/lib/types";

// Sub-components
import { NoticeFilters } from "./notices/NoticeFilters";
import { NoticeList } from "./notices/NoticeList";
import { NoticeSkeleton } from "./notices/NoticeSkeleton";

export function ParentNotices() {
  const [notices, setNotices] = useState<NoticeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");

  useEffect(() => {
    async function fetchNotices() {
      try {
        const res = await apiFetch("/api/notices");
        if (!res.ok) throw new Error("Failed to fetch notices");
        const data = await res.json();
        const filtered = data.filter(
          (n: NoticeInfo) => n.targetRole === "parent" || n.targetRole === "all",
        );
        setNotices(filtered);
      } catch {
        console.error("Error fetching notices");
      } finally {
        setLoading(false);
      }
    }
    fetchNotices();
  }, []);

  const filteredNotices = notices.filter((n) => {
    const matchSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase());
    const matchPriority = priorityFilter === "all" || n.priority === priorityFilter;
    return matchSearch && matchPriority;
  });

  if (loading) return <NoticeSkeleton />;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-2">
        <Bell className="size-5 text-amber-600" />
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
          School Notices
        </h2>
      </div>

      <NoticeFilters 
        search={search}
        setSearch={setSearch}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
      />

      <NoticeList 
        notices={filteredNotices}
        isSearching={!!search || priorityFilter !== "all"}
      />

      {filteredNotices.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {filteredNotices.length} of {notices.length} notices
        </p>
      )}
    </div>
  );
}
