import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  Power,
  Users
} from "lucide-react";
import { PlatformUser, ROLE_CONFIG } from "./types";
import { copyToClipboard } from "@/lib/utils";
import { toast } from "sonner";

interface UserTableProps {
  loading: boolean;
  users: PlatformUser[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  onPageChange: (page: number) => void;
  onUserClick: (user: PlatformUser) => void;
  onToggleStatus?: (userId: string, currentActive: boolean) => void;
  formatDate: (val: string) => string;
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
];

export function UserTable({
  loading,
  users,
  totalCount,
  currentPage,
  totalPages,
  pageSize = 10,
  onPageSizeChange,
  onPageChange,
  onUserClick,
  onToggleStatus,
  formatDate,
}: UserTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(users.map((u) => u.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const isAllSelected = users.length > 0 && users.every((u) => selectedIds.has(u.id));

  const commonClasses = "text-xs font-semibold text-slate-500 dark:text-slate-400 py-3.5";
  const cellClasses = "py-3 text-xs font-medium text-slate-700 dark:text-slate-300";

  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800">
                <TableHead className="w-10 py-3.5 pl-4">
                  <Skeleton className="size-3.5 rounded-sm" />
                </TableHead>
                <TableHead className="w-12 text-xs font-semibold text-slate-500 py-3.5">#</TableHead>
                <TableHead className={commonClasses}>Name</TableHead>
                <TableHead className={commonClasses}>Email</TableHead>
                <TableHead className={commonClasses}>Role</TableHead>
                <TableHead className={commonClasses}>School</TableHead>
                <TableHead className={commonClasses}>Status</TableHead>
                <TableHead className={commonClasses}>Joined</TableHead>
                <TableHead className={`${commonClasses} text-right pr-4`}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(8)].map((_, i) => (
                <TableRow key={i} className="border-b border-slate-100 dark:border-slate-800/80 last:border-none">
                  <TableCell className="w-10 py-3.5 pl-4">
                    <Skeleton className="size-3.5 rounded-sm" />
                  </TableCell>
                  <TableCell className="w-12 py-3.5">
                    <Skeleton className="h-4 w-4 rounded-sm" />
                  </TableCell>
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="size-7 rounded-full shrink-0" />
                      <Skeleton className="h-4 w-32 rounded-md" />
                    </div>
                  </TableCell>
                  <TableCell className="py-3.5">
                    <Skeleton className="h-4 w-40 rounded-md" />
                  </TableCell>
                  <TableCell className="py-3.5">
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </TableCell>
                  <TableCell className="py-3.5">
                    <Skeleton className="h-4 w-28 rounded-md" />
                  </TableCell>
                  <TableCell className="py-3.5">
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell className="py-3.5">
                    <Skeleton className="h-4 w-20 rounded-md" />
                  </TableCell>
                  <TableCell className="pr-4 py-3.5 text-right">
                    <Skeleton className="size-7 rounded-lg ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/70 dark:bg-slate-800/40 hover:bg-transparent border-b border-slate-200/80 dark:border-slate-800">
              <TableHead className="w-10 py-3.5 pl-4">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  aria-label="Select all"
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 size-3.5"
                />
              </TableHead>
              <TableHead className="w-12 text-xs font-semibold text-slate-500 dark:text-slate-400 py-3.5">#</TableHead>
              <TableHead className={commonClasses}>Name</TableHead>
              <TableHead className={commonClasses}>Email</TableHead>
              <TableHead className={commonClasses}>Role</TableHead>
              <TableHead className={commonClasses}>School</TableHead>
              <TableHead className={commonClasses}>Status</TableHead>
              <TableHead className={commonClasses}>Joined</TableHead>
              <TableHead className={`${commonClasses} text-right pr-4`}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-20 text-slate-400">
                  <Users className="size-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No users found</p>
                  <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search terms</p>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user, idx) => {
                const roleConf = ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG] ?? ROLE_CONFIG.student;
                const initials = (user.name || "U")
                  .split(" ")
                  .map((n) => n[0] || "")
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                const isSelected = selectedIds.has(user.id);
                const avatarBg = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                const rowNum = (currentPage - 1) * pageSize + idx + 1;

                return (
                  <TableRow
                    key={user.id}
                    className={`border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${
                      isSelected ? "bg-blue-50/30 dark:bg-blue-950/20" : ""
                    }`}
                    onClick={() => onUserClick(user)}
                  >
                    {/* Checkbox */}
                    <TableCell className="w-10 py-3 pl-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleRow(user.id)}
                        aria-label={`Select ${user.name}`}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 size-3.5"
                      />
                    </TableCell>

                    {/* Row # */}
                    <TableCell className="w-12 py-3 text-xs font-semibold text-slate-400">
                      {rowNum}
                    </TableCell>

                    {/* Name + Avatar */}
                    <TableCell className={cellClasses}>
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`size-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${avatarBg}`}
                        >
                          {initials}
                        </div>
                        <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate max-w-[160px]">
                          {user.name}
                        </span>
                      </div>
                    </TableCell>

                    {/* Email */}
                    <TableCell className="py-3 text-xs text-slate-500 dark:text-slate-400 font-normal">
                      {user.email}
                    </TableCell>

                    {/* Role */}
                    <TableCell className="py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${roleConf.bg} ${roleConf.color}`}
                      >
                        {roleConf.icon}
                        {roleConf.label}
                      </span>
                    </TableCell>

                    {/* School */}
                    <TableCell className="py-3">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 text-xs font-medium">
                        <Building2 className="size-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[160px]">
                          {user.tenant?.name || "–"}
                        </span>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-3">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50">
                          <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50">
                          <span className="size-1.5 rounded-full bg-rose-500 shrink-0" />
                          Inactive
                        </span>
                      )}
                    </TableCell>

                    {/* Joined */}
                    <TableCell className="py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(user.createdAt)}
                    </TableCell>

                    {/* Actions Menu */}
                    <TableCell className="py-3 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                          >
                            •••
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-lg border-slate-200 dark:border-slate-800 text-xs">
                          <DropdownMenuItem
                            onClick={() => onUserClick(user)}
                            className="text-xs font-medium gap-2 cursor-pointer"
                          >
                            <Eye className="size-3.5" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              copyToClipboard(user.email);
                              toast.success("Email copied to clipboard");
                            }}
                            className="text-xs font-medium gap-2 cursor-pointer"
                          >
                            <Copy className="size-3.5" />
                            Copy Email
                          </DropdownMenuItem>
                          {onToggleStatus && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onToggleStatus(user.id, user.isActive)}
                                className={`text-xs font-medium gap-2 cursor-pointer ${
                                  user.isActive ? "text-amber-600" : "text-emerald-600"
                                }`}
                              >
                                <Power className="size-3.5" />
                                {user.isActive ? "Deactivate User" : "Activate User"}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer matching styling */}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-6 py-2.5 sm:py-3.5 border-t border-slate-100 dark:border-slate-800 bg-card">
        {/* Rows Per Page */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0">
          <span className="hidden sm:inline">Rows per page</span>
          <span className="sm:hidden text-[11px]">Rows:</span>
          {onPageSizeChange ? (
            <Select
              value={String(pageSize)}
              onValueChange={(v) => onPageSizeChange(Number(v))}
            >
              <SelectTrigger className="h-7 w-14 sm:w-16 rounded-lg border-slate-200 dark:border-slate-800 text-xs font-semibold bg-background px-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 text-xs">
                <SelectItem value="10" className="text-xs">10</SelectItem>
                <SelectItem value="25" className="text-xs">25</SelectItem>
                <SelectItem value="50" className="text-xs">50</SelectItem>
                <SelectItem value="100" className="text-xs">100</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <span className="font-semibold text-slate-800 dark:text-slate-200">{pageSize}</span>
          )}
        </div>

        {/* Page Number Buttons */}
        {totalPages > 1 && (
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 overflow-x-auto">
            <Button
              variant="ghost"
              size="icon"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="size-7 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
            >
              <ChevronLeft className="size-3.5" />
            </Button>

            {renderPageNumbers().map((p, idx) => {
              if (p === "...") {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="size-6 sm:size-7 flex items-center justify-center text-xs text-slate-400"
                  >
                    …
                  </span>
                );
              }
              const pageNum = Number(p);
              const isActive = pageNum === currentPage;
              const isSibling = Math.abs(pageNum - currentPage) === 1 && pageNum !== 1 && pageNum !== totalPages;

              return (
                <button
                  key={`page-${pageNum}`}
                  type="button"
                  onClick={() => onPageChange(pageNum)}
                  className={`size-6.5 sm:size-7 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? "bg-blue-600 text-white shadow-2xs"
                      : isSibling
                      ? "hidden sm:inline-flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <Button
              variant="ghost"
              size="icon"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="size-7 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
