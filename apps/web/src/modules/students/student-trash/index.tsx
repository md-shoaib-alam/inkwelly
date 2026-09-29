"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { GraduationCap, RotateCcw, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/graphql/keys";
import { useAppStore } from "@/store/use-app-store";
import { useModulePermissions } from "@/modules/access-control/hooks/use-permissions";

interface TrashedStudent {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  rollNumber: string;
  className: string;
  deletedAt: string | null;
  deletionReason: string | null;
}

const formatDeletedOn = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

function AdminStudentTrashContent() {
  const currentTenantId = useAppStore((s) => s.currentTenantId);
  const { canDelete } = useModulePermissions("students");
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [pendingPurge, setPendingPurge] = useState<TrashedStudent | null>(null);

  const { data, isLoading } = useQuery<{ items: TrashedStudent[] }>({
    queryKey: ["student-trash", currentTenantId],
    queryFn: async () => {
      const res = await apiFetch("/api/students/trash");
      if (!res.ok) throw new Error("Failed to load trash");
      return res.json();
    },
  });

  const items = useMemo(() => {
    const all = data?.items ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        s.username.toLowerCase().includes(q),
    );
  }, [data, search]);

  const invalidateLists = () => {
    queryClient.invalidateQueries({ queryKey: ["student-trash"] });
    queryClient.invalidateQueries({ queryKey: queryKeys.students });
    queryClient.invalidateQueries({ queryKey: ["admin-dashboard", currentTenantId] });
  };

  const handleRestore = async (student: TrashedStudent) => {
    toast.promise(
      (async () => {
        const res = await apiFetch("/api/students/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: student.id }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to restore student");
        }
        invalidateLists();
      })(),
      {
        loading: `Restoring ${student.name}...`,
        success: `${student.name} was restored to All Students`,
        error: (err: any) => err.message,
      },
    );
  };

  const handlePermanentDelete = async (student: TrashedStudent) => {
    toast.promise(
      (async () => {
        const res = await apiFetch(`/api/students/permanent?id=${student.id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to delete student permanently");
        }
        invalidateLists();
      })(),
      {
        loading: `Permanently deleting ${student.name}...`,
        success: `${student.name} was permanently removed`,
        error: (err: any) => err.message,
      },
    );
  };

  const total = data?.items?.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Trash</h1>
        <p className="text-sm text-muted-foreground mt-1">
          <span className="font-semibold text-foreground">{total}</span>{" "}
          {total === 1 ? "deleted student" : "deleted students"} · items can be restored or
          permanently removed
        </p>
      </div>

      <div className="max-w-xl">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, student ID, or admission number..."
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <Card key={i}>
              <CardContent className="p-5 flex items-center gap-4 animate-pulse">
                <div className="size-11 rounded-full bg-muted" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-40 bg-muted rounded" />
                  <div className="h-3 w-64 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Trash2 className="size-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">
              {search ? "No deleted students match your search" : "Trash is empty"}
            </p>
            {!search && (
              <p className="text-sm mt-1">
                Deleted students appear here until you restore them or remove them permanently.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((student) => (
            <Card key={student.id}>
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {student.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className="size-11 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="size-11 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-sm font-semibold shrink-0">
                      {student.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{student.name}</p>
                    <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-mono">{student.rollNumber}</span>
                      <span className="inline-flex items-center gap-1">
                        <GraduationCap className="size-3.5" />
                        Class {student.className}
                      </span>
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        Deleted {formatDeletedOn(student.deletedAt)}
                      </span>
                    </p>
                    {student.deletionReason && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Reason: {student.deletionReason}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(student)}
                  >
                    <RotateCcw className="size-4 mr-1.5" />
                    Restore
                  </Button>
                  {canDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                      onClick={() => setPendingPurge(student)}
                    >
                      <Trash2 className="size-4 mr-1.5" />
                      Delete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={pendingPurge !== null}
        onOpenChange={(open) => {
          if (!open) setPendingPurge(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{pendingPurge?.name}</strong> and all of their attendance, fees,
              grades and certificates will be erased. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (pendingPurge) handlePermanentDelete(pendingPurge);
                setPendingPurge(null);
              }}
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function AdminStudentTrash() {
  return <AdminStudentTrashContent />;
}

export default AdminStudentTrash;
