"use client";

import { apiFetch } from "@/lib/api";
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone, Eye } from "lucide-react";
import type { NoticeInfo } from "@/lib/types";
import { toast } from "sonner";
import { useModulePermissions } from "@/modules/access-control/hooks/use-permissions";
import { useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/use-app-store";
import { useNotices } from "@/lib/graphql/hooks";

// Sub-components
import { NoticesHeader } from "./adminNotices/NoticesHeader";
import { NoticeCard } from "./adminNotices/NoticeCard";
import { NoticeDialogs } from "./adminNotices/NoticeDialogs";

const formatNoticeDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (e) {
    return dateStr;
  }
};

interface NoticeFormData {
  title: string;
  content: string;
  priority: string;
  targetRole: string;
}

const emptyForm: NoticeFormData = {
  title: "",
  content: "",
  priority: "normal",
  targetRole: "all",
};

export function AdminNotices() {
  const { canCreate, canEdit, canDelete } = useModulePermissions("notices");
  const queryClient = useQueryClient();
  const { currentTenantId } = useAppStore();
  const { data: noticesData, isLoading: noticesLoading } = useNotices(currentTenantId || undefined);
  const notices = noticesData?.notices || [];
  const loading = noticesLoading && notices.length === 0;

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const refetchNotices = () => queryClient.invalidateQueries({ queryKey: ["notices"] });

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<NoticeFormData>({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<NoticeInfo | null>(null);
  const [editForm, setEditForm] = useState<NoticeFormData>({ ...emptyForm });
  const [editing, setEditing] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    return notices.filter((n) => {
      const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase());
      const matchPriority = priorityFilter === "all" || n.priority === priorityFilter;
      return matchSearch && matchPriority;
    });
  }, [notices, search, priorityFilter]);

  const handleCreate = async () => {
    if (!form.title || !form.content) { toast.error("Title and content are required"); return; }
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/notices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { toast.success("Notice created successfully!"); setCreateOpen(false); setForm({ ...emptyForm }); refetchNotices(); }
      else toast.error("Failed to create notice");
    } catch { toast.error("Error creating notice"); }
    finally { setSubmitting(false); }
  };

  const handleEdit = (notice: NoticeInfo) => {
    setEditingNotice(notice);
    setEditForm({ title: notice.title, content: notice.content, priority: notice.priority, targetRole: notice.targetRole });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingNotice || !editForm.title || !editForm.content) { toast.error("Title and content are required"); return; }
    setEditing(true);
    try {
      const res = await apiFetch("/api/notices", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editingNotice.id, ...editForm }) });
      if (res.ok) { toast.success("Notice updated successfully!"); setEditOpen(false); refetchNotices(); }
      else toast.error("Failed to update notice");
    } catch { toast.error("Error updating notice"); }
    finally { setEditing(false); }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/notices?id=${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Notice deleted successfully!"); refetchNotices(); }
      else toast.error("Failed to delete notice");
    } catch { toast.error("Error deleting notice"); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-6">
      {/* Read-only banner */}
      {!canCreate && !canEdit && !canDelete && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 px-3 py-2">
          <Eye className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
            Read-only mode, you have view permission only for this module.
          </span>
        </div>
      )}

      <NoticesHeader 
        search={search}
        onSearchChange={setSearch}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        canCreate={canCreate}
        onAddClick={() => { setForm({ ...emptyForm }); setCreateOpen(true); }}
      />

      {/* Notice Cards */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Card key={`notice-skel-${i}`}><CardContent className="p-6"><Skeleton className="h-5 w-48 mb-3" /><Skeleton className="h-4 w-full mb-2" /><Skeleton className="h-4 w-3/4" /></CardContent></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Megaphone className="size-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No notices found</p>
            <p className="text-sm">Create your first notice to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((notice) => (
            <NoticeCard 
              key={notice.id}
              notice={notice}
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={handleEdit}
              onDelete={handleDelete}
              formatNoticeDate={formatNoticeDate}
              deleting={deleting}
            />
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {filtered.length} of {notices.length} notices
        </p>
      )}

      <NoticeDialogs 
        createOpen={createOpen}
        setCreateOpen={setCreateOpen}
        form={form}
        setForm={setForm}
        onCreate={handleCreate}
        creating={submitting}
        editOpen={editOpen}
        setEditOpen={setEditOpen}
        editForm={editForm}
        setEditForm={setEditForm}
        onEdit={handleEditSave}
        updating={editing}
      />
    </div>
  );
}
