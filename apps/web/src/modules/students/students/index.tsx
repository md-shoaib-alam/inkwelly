"use client";

import { useCallback, useEffect, useMemo, useReducer, useState, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Eye, ArrowUp, ArrowDown, SlidersHorizontal } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useModulePermissions } from "@/modules/access-control/hooks/use-permissions";
import { useAppStore } from "@/store/use-app-store";
import { useQueryClient } from "@tanstack/react-query";
import { ClassSelect } from "@/components/ui/class-select";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

// Sub-components
import { RosterTable } from "./adminStudents/RosterTable";
import { ColumnsPopover } from "./adminStudents/ColumnsPopover";
import { StudentDialog } from "./adminStudents/StudentDialog";
import { StudentSkeleton } from "./adminStudents/StudentSkeleton";
import { Pagination } from "./adminStudents/Pagination";
import { StudentProfileView } from "./adminStudents/profile/StudentProfileView";
import { DEFAULT_TAB, tabFromParam, tabParamOf, type ProfileTabId } from "./adminStudents/profile/tabs";

// Types
import { DEFAULT_VISIBLE, MOBILE_VISIBLE, ROSTER_COLUMNS, type RosterRow } from "./adminStudents/columns";
import type { StudentInfo, StudentFormData } from "./adminStudents/types";
import {
  profilePathOf,
  rosterPathOf,
  studentRefFromPathname,
  studentRefOf,
} from "./student-ref";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "obc", label: "OBC" },
  { value: "sc", label: "SC" },
  { value: "st", label: "ST" },
];
const SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "firstName", label: "First name" },
  { value: "lastName", label: "Last name" },
  { value: "rollNumber", label: "Roll no." },
  { value: "admissionNo", label: "Admission no." },
  { value: "dateOfBirth", label: "DOB" },
  { value: "admissionDate", label: "Admission date" },
  { value: "className", label: "Class" },
  { value: "createdAt", label: "Newest" },
];

const emptyFormData: StudentFormData = {
  name: "",
  email: "",
  username: "",
  password: "",
  phone: "",
  rollNumber: "",
  classId: "",
  gender: "male",
  dateOfBirth: "",
  bloodGroup: "",
  house: "",
  transportEnabled: false,
  routeId: "",
  pickupPoint: "",
};

type State = {
  search: string;
  classFilter: string;
  statusFilter: string;
  genderFilter: string;
  categoryFilter: string;
  bloodGroupFilter: string;
  rteFilter: string;
  sort: string;
  sortDir: "asc" | "desc";
  currentPage: number;
  itemsPerPage: number;
  dialogOpen: boolean;
  editingStudent: StudentInfo | null;
  formData: StudentFormData;
  submitting: boolean;
};

type Action =
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_CLASS_FILTER'; payload: string }
  | { type: 'SET_STATUS_FILTER'; payload: string }
  | { type: 'SET_GENDER_FILTER'; payload: string }
  | { type: 'SET_CATEGORY_FILTER'; payload: string }
  | { type: 'SET_BLOOD_GROUP_FILTER'; payload: string }
  | { type: 'SET_RTE_FILTER'; payload: string }
  | { type: 'SET_SORT'; payload: string }
  | { type: 'SET_SORT_DIR'; payload: "asc" | "desc" }
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'SET_ITEMS_PER_PAGE'; payload: number }
  | { type: 'OPEN_EDIT'; payload: StudentInfo }
  | { type: 'CLOSE_DIALOG' }
  | { type: 'SET_FORM_DATA'; payload: StudentFormData }
  | { type: 'SET_SUBMITTING'; payload: boolean };

const initialState: State = {
  search: "",
  classFilter: "all",
  statusFilter: "active",
  genderFilter: "all",
  categoryFilter: "all",
  bloodGroupFilter: "all",
  rteFilter: "all",
  sort: "name",
  sortDir: "asc",
  currentPage: 1,
  itemsPerPage: 25,
  dialogOpen: false,
  editingStudent: null,
  formData: emptyFormData,
  submitting: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_SEARCH':
      return { ...state, search: action.payload, currentPage: 1 };
    case 'SET_CLASS_FILTER':
      return { ...state, classFilter: action.payload, currentPage: 1 };
    case 'SET_STATUS_FILTER':
      return { ...state, statusFilter: action.payload, currentPage: 1 };
    case 'SET_GENDER_FILTER':
      return { ...state, genderFilter: action.payload, currentPage: 1 };
    case 'SET_CATEGORY_FILTER':
      return { ...state, categoryFilter: action.payload, currentPage: 1 };
    case 'SET_BLOOD_GROUP_FILTER':
      return { ...state, bloodGroupFilter: action.payload, currentPage: 1 };
    case 'SET_RTE_FILTER':
      return { ...state, rteFilter: action.payload, currentPage: 1 };
    case 'SET_SORT':
      return { ...state, sort: action.payload, currentPage: 1 };
    case 'SET_SORT_DIR':
      return { ...state, sortDir: action.payload, currentPage: 1 };
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };
    case 'SET_ITEMS_PER_PAGE':
      return { ...state, itemsPerPage: action.payload, currentPage: 1 };
    case 'OPEN_EDIT':
      return {
        ...state,
        editingStudent: action.payload,
        formData: {
          name: action.payload.name,
          email: action.payload.email,
          phone: action.payload.phone || "",
          rollNumber: action.payload.rollNumber,
          classId: action.payload.classId || "",
          gender: action.payload.gender || "male",
          dateOfBirth: action.payload.dateOfBirth || "",
          bloodGroup: action.payload.bloodGroup || "",
          house: action.payload.house || "",
          transportEnabled: !!action.payload.transport,
          routeId: action.payload.transport?.routeId || "",
          pickupPoint: action.payload.transport?.pickupPoint || "",
        },
        dialogOpen: true,
      };
    case 'CLOSE_DIALOG':
      return { ...state, dialogOpen: false };
    case 'SET_FORM_DATA':
      return { ...state, formData: action.payload };
    case 'SET_SUBMITTING':
      return { ...state, submitting: action.payload };
    default:
      return state;
  }
}

function AdminStudentsContent() {
  const { currentTenantId } = useAppStore();
  const { canEdit, canDelete } = useModulePermissions("students");

  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    search,
    classFilter,
    statusFilter,
    genderFilter,
    categoryFilter,
    bloodGroupFilter,
    rteFilter,
    sort,
    sortDir,
    currentPage,
    itemsPerPage,
    dialogOpen,
    editingStudent,
    formData,
    submitting,
  } = state;

  const queryClient = useQueryClient();

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // The ref lives in the path, so `/students/list/STU2026120` is one student and
  // `/students/list` is the roster: the same screen answering two URLs. Nothing is
  // mirrored into state, which is why a refresh lands on the student it says.
  const profileRef = studentRefFromPathname(pathname);
  const rosterPath = rosterPathOf(pathname, Boolean(profileRef));
  const activeTab = tabFromParam(searchParams.get("tab"));

  const [rows, setRows] = useState<RosterRow[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reloadTick, setReloadTick] = useState(0);
  const reload = useCallback(() => setReloadTick((t) => t + 1), []);

  useEffect(() => {
    if (!currentTenantId) return;
    // While a profile is open the roster is not on screen, so its page of 25 rows is
    // not fetched. This is the request the user asked to stop paying for.
    if (profileRef) return;
    const controller = new AbortController();
    setLoading(true);

    const params = new URLSearchParams({
      page: String(currentPage),
      limit: String(itemsPerPage),
      sort,
      dir: sortDir,
    });
    if (search) params.set("search", search);
    if (classFilter !== "all") params.set("classId", classFilter);
    if (genderFilter !== "all") params.set("gender", genderFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (bloodGroupFilter !== "all") params.set("bloodGroup", bloodGroupFilter);
    if (rteFilter !== "all") params.set("rte", rteFilter);

    apiFetch(`/api/student-roster?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Request failed (${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        setRows(data.items ?? []);
        setTotalItems(data.totalItems ?? 0);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setLoading(false);
        toast.error(err.message || "Failed to load students");
      });

    return () => controller.abort();
  }, [
    currentTenantId, profileRef,
    search, classFilter, genderFilter, statusFilter,
    categoryFilter, bloodGroupFilter, rteFilter, sort, sortDir,
    currentPage, itemsPerPage, reloadTick,
  ]);

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Sync initial URL search params into state (run once on mount)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const classIdParam = sp.get("classId");
    const searchParam = sp.get("search");
    const sortParam = sp.get("sort");
    const dirParam = sp.get("dir");
    const limitParam = sp.get("limit");
    const pageParam = sp.get("page");

    if (classIdParam) {
      dispatch({ type: 'SET_CLASS_FILTER', payload: classIdParam });
    }
    // Before the page, because `SET_SEARCH` resets to page 1 and a deep link that
    // carries both should land where it said.
    if (searchParam) {
      dispatch({ type: 'SET_SEARCH', payload: searchParam });
    }
    if (sortParam && SORT_OPTIONS.some((o) => o.value === sortParam)) {
      dispatch({ type: 'SET_SORT', payload: sortParam });
    }
    if (dirParam === "asc" || dirParam === "desc") {
      dispatch({ type: 'SET_SORT_DIR', payload: dirParam });
    }
    const parsedLimit = limitParam ? Number(limitParam) : NaN;
    if (Number.isInteger(parsedLimit) && parsedLimit > 0) {
      dispatch({ type: 'SET_ITEMS_PER_PAGE', payload: parsedLimit });
    }
    const parsedPage = pageParam ? Number(pageParam) : NaN;
    if (Number.isInteger(parsedPage) && parsedPage > 0) {
      dispatch({ type: 'SET_CURRENT_PAGE', payload: parsedPage });
    }
  }, []); // Only on mount — URL seeds the initial state

  // Keep the browser URL in sync with the active filters, sort and pagination
  const syncUrl = useCallback((next: Partial<State>) => {
    const merged = { ...state, ...next };
    const params = new URLSearchParams(searchParams.toString());
    const setOrDelete = (key: string, value: string, keep: boolean) => {
      if (keep) params.set(key, value); else params.delete(key);
    };
    setOrDelete("page", String(merged.currentPage), merged.currentPage > 1);
    setOrDelete("limit", String(merged.itemsPerPage), merged.itemsPerPage !== 25);
    setOrDelete("search", merged.search, Boolean(merged.search));
    setOrDelete("classId", merged.classFilter, merged.classFilter !== "all");
    setOrDelete("gender", merged.genderFilter, merged.genderFilter !== "all");
    setOrDelete("status", merged.statusFilter, merged.statusFilter !== "active");
    setOrDelete("category", merged.categoryFilter, merged.categoryFilter !== "all");
    setOrDelete("bloodGroup", merged.bloodGroupFilter, merged.bloodGroupFilter !== "all");
    setOrDelete("rte", merged.rteFilter, merged.rteFilter !== "all");
    setOrDelete("sort", merged.sort, merged.sort !== "name");
    setOrDelete("dir", merged.sortDir, merged.sortDir !== "asc");

    const newQuery = params.toString();
    router.replace(newQuery ? `${pathname}?${newQuery}` : pathname, { scroll: false });
  }, [pathname, router, searchParams, state]);

  const handleOpenEdit = (student: StudentInfo) => dispatch({ type: 'OPEN_EDIT', payload: student });

  // The roster's own filters travel with a profile link, so Back lands where the user
  // left the list. `tab` is the profile's key and never belongs to the roster.
  const rosterQuery = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("tab");
    return params;
  }, [searchParams]);

  const profileUrl = useCallback(
    (ref: string, tab: ProfileTabId) => {
      const params = rosterQuery();
      const tabParam = tabParamOf(tab);
      if (tabParam) params.set("tab", tabParam);
      const query = params.toString();
      return `${profilePathOf(rosterPath, ref)}${query ? `?${query}` : ""}`;
    },
    [rosterQuery, rosterPath],
  );

  const openProfile = useCallback(
    (ref: string, tab: ProfileTabId) => router.push(profileUrl(ref, tab), { scroll: false }),
    [profileUrl, router],
  );

  const handleOpenView = (student: StudentInfo) => openProfile(studentRefOf(student), DEFAULT_TAB);

  const handleCloseView = useCallback(() => {
    const query = rosterQuery().toString();
    router.replace(query ? `${rosterPath}?${query}` : rosterPath, { scroll: false });
  }, [rosterPath, rosterQuery, router]);

  // Writing the tab into the address bar is the whole of tab state: a refresh, a Back,
  // and a pasted link all open the same tab, and the previous tab's request is not sent.
  const handleTabChange = (next: ProfileTabId) => {
    if (!profileRef) return;
    router.replace(profileUrl(profileRef, next), { scroll: false });
  };

  // The edit form reads roster-row fields the profile payload doesn't carry (classId,
  // house, transport), so it is fetched from the roster on the click that needs it.
  const handleEditFromProfile = async () => {
    if (!profileRef) return;
    const fromCache = rows.find((r) => studentRefOf(r) === profileRef || r.id === profileRef);
    if (fromCache) {
      handleOpenEdit(fromCache as unknown as StudentInfo);
      return;
    }
    try {
      const res = await apiFetch(
        `/api/student-roster?limit=1&search=${encodeURIComponent(profileRef)}`,
      );
      const data = await res.json().catch(() => ({}));
      const items: RosterRow[] = data.items ?? [];
      const match = items.find((r) => studentRefOf(r) === profileRef || r.id === profileRef);
      if (!match) {
        toast.error("This student isn't in the roster, so there's nothing to edit.");
        return;
      }
      handleOpenEdit(match as unknown as StudentInfo);
    } catch {
      toast.error("Couldn't open the edit form.");
    }
  };

  const handleSubmit = async () => {
    if (!editingStudent) return;

    // Required fields validation
    if (!formData.name || !formData.rollNumber || !formData.classId) {
      toast.error("Name, Roll Number, and Class are required");
      return;
    }

    // Email format validation (only if provided)
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        toast.error("Please enter a valid email address");
        return;
      }
    }

    toast.promise(
      (async () => {
        dispatch({ type: 'SET_SUBMITTING', payload: true });
        try {
          // Clean payload: omit empty strings for optional fields to avoid backend schema validation errors
          const payload: Record<string, any> = {
            id: editingStudent.id,
            name: formData.name.trim(),
            rollNumber: formData.rollNumber.trim(),
            classId: formData.classId,
            gender: formData.gender || "male",
            transportEnabled: Boolean(formData.transportEnabled),
          };

          if (formData.email?.trim()) {
            payload.email = formData.email.trim();
          }
          if (formData.phone?.trim()) {
            payload.phone = formData.phone.trim();
          }
          if (formData.dateOfBirth?.trim()) {
            payload.dateOfBirth = formData.dateOfBirth.trim();
          }
          if (formData.bloodGroup?.trim()) {
            payload.bloodGroup = formData.bloodGroup.trim();
          }
          if (formData.transportEnabled && formData.routeId?.trim()) {
            payload.routeId = formData.routeId.trim();
            if (formData.pickupPoint?.trim()) {
              payload.pickupPoint = formData.pickupPoint.trim();
            }
          }

          const res = await apiFetch("/api/students", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || "Failed to update student");
          }

          dispatch({ type: 'CLOSE_DIALOG' });
          // Refresh the roster from the server to ensure total accuracy
          reload();
          queryClient.invalidateQueries({
            queryKey: ["admin-dashboard", currentTenantId],
          });
          // The profile caches a header and one tab per student, so a write clears them.
          queryClient.invalidateQueries({ queryKey: ["student-profile"] });
          return "Student details updated";
        } finally {
          dispatch({ type: 'SET_SUBMITTING', payload: false });
        }
      })(),
      {
        loading: "Updating student details...",
        success: (msg) => msg,
        error: (err: any) => err.message,
      },
    );
  };

  const [visibleCols, setVisibleCols] = useState<Set<string>>(() =>
    // A phone gets the three identity columns; the rest stay one tap away.
    typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches
      ? DEFAULT_VISIBLE
      : MOBILE_VISIBLE,
  );
  const activeColumns = useMemo(
    () => ROSTER_COLUMNS.filter((c) => visibleCols.has(c.key)),
    [visibleCols],
  );

  // --- Profile view (full page replace, like teachers) ---
  // Checked before the roster's loading gate: opening a profile must not wait on a
  // page of rows nobody is looking at.
  if (profileRef) {
    return (
      <div className="space-y-6">
        <StudentProfileView
          studentRef={profileRef}
          tab={activeTab}
          onTabChange={handleTabChange}
          onBack={handleCloseView}
          onSwitch={(ref) => openProfile(ref, activeTab)}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={handleEditFromProfile}
        />

        <StudentDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            if (!open) dispatch({ type: 'CLOSE_DIALOG' });
          }}
          formData={formData}
          setFormData={(fd) => dispatch({ type: 'SET_FORM_DATA', payload: fd })}
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      </div>
    );
  }

  if (loading) return <StudentSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-medium tracking-tight font-[family-name:var(--font-lexend)] text-[#0F172A] dark:text-zinc-50">
          All students
        </h1>
        <p className="mt-1 text-[13px] text-[#64748B] dark:text-zinc-400">
          {totalItems} enrolled
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          id="search_students"
          value={search}
          onChange={(val) => {
            dispatch({ type: 'SET_SEARCH', payload: val });
            syncUrl({ search: val });
          }}
          placeholder="Search students..."
          delay={400}
          className="w-full sm:w-60 md:w-64"
          inputClassName="h-9 rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[12.5px] placeholder:text-slate-400 dark:placeholder:text-zinc-500 shadow-2xs"
        />

        <Select
          value={genderFilter}
          onValueChange={(v) => {
            dispatch({ type: 'SET_GENDER_FILTER', payload: v });
            syncUrl({ genderFilter: v });
          }}
        >
          <SelectTrigger className="w-auto h-9 px-3 rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 text-[12.5px] font-normal shadow-2xs gap-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800">
            <SelectValue placeholder="All genders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All genders</SelectItem>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => {
            dispatch({ type: 'SET_STATUS_FILTER', payload: v });
            syncUrl({ statusFilter: v });
          }}
        >
          <SelectTrigger className="w-auto h-9 px-3 rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 text-[12.5px] font-normal shadow-2xs gap-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800">
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={categoryFilter}
          onValueChange={(v) => {
            dispatch({ type: 'SET_CATEGORY_FILTER', payload: v });
            syncUrl({ categoryFilter: v });
          }}
        >
          <SelectTrigger className="w-auto h-9 px-3 rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 text-[12.5px] font-normal shadow-2xs gap-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-9 px-3 rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 text-[12.5px] font-normal shadow-2xs hover:bg-slate-50 dark:hover:bg-zinc-800 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <SlidersHorizontal className="size-3.5 text-slate-500 dark:text-zinc-400" />
              <span>More</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[280px] rounded-lg p-3 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Class</label>
              <ClassSelect
                value={classFilter}
                onValueChange={(v) => {
                  dispatch({ type: 'SET_CLASS_FILTER', payload: v });
                  syncUrl({ classFilter: v });
                }}
                showAllOption
                className="w-full h-9 rounded-md text-[12.5px]"
                placeholder="All classes"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Blood group</label>
              <Select
                value={bloodGroupFilter}
                onValueChange={(v) => {
                  dispatch({ type: 'SET_BLOOD_GROUP_FILTER', payload: v });
                  syncUrl({ bloodGroupFilter: v });
                }}
              >
                <SelectTrigger className="w-full h-9 rounded-md text-[12.5px]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {BLOOD_GROUPS.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">RTE</label>
              <Select
                value={rteFilter}
                onValueChange={(v) => {
                  dispatch({ type: 'SET_RTE_FILTER', payload: v });
                  syncUrl({ rteFilter: v });
                }}
              >
                <SelectTrigger className="w-full h-9 rounded-md text-[12.5px]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">RTE only</SelectItem>
                  <SelectItem value="no">Non-RTE only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </PopoverContent>
        </Popover>

        {/* Unified Sort & Columns on the right */}
        <div className="flex items-center gap-2 sm:ml-auto">
          <div className="inline-flex items-center rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xs divide-x divide-slate-200 dark:divide-zinc-700 h-9">
            <Select
              value={sort}
              onValueChange={(v) => {
                dispatch({ type: 'SET_SORT', payload: v });
                syncUrl({ sort: v });
              }}
            >
              <SelectTrigger className="h-9 border-0 rounded-none rounded-l-md px-3 text-slate-700 dark:text-zinc-200 text-[12.5px] font-normal shadow-none bg-transparent hover:bg-slate-50 dark:hover:bg-zinc-800 gap-1.5">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              type="button"
              className="h-9 px-2.5 inline-flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors rounded-r-md cursor-pointer"
              onClick={() => {
                const dir = sortDir === "asc" ? "desc" : "asc";
                dispatch({ type: 'SET_SORT_DIR', payload: dir });
                syncUrl({ sortDir: dir });
              }}
              title={sortDir === "asc" ? "Sorted Ascending (click for Descending)" : "Sorted Descending (click for Ascending)"}
            >
              {sortDir === "asc" ? (
                <ArrowUp className="size-3.5 stroke-[2]" />
              ) : (
                <ArrowDown className="size-3.5 stroke-[2]" />
              )}
            </button>
          </div>
          <ColumnsPopover visible={visibleCols} onChange={setVisibleCols} />
        </div>
      </div>

      {/* Read-only banner */}
      {!canEdit && !canDelete && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-3 py-2">
          <Eye className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
            Read-only mode: you have view permission only for this module.
          </span>
        </div>
      )}

      {/* Table Content */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <RosterTable rows={rows} columns={activeColumns} onView={handleOpenView} />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={(p) => {
              dispatch({ type: 'SET_CURRENT_PAGE', payload: p });
              syncUrl({ currentPage: p });
            }}
            onLimitChange={(limit) => {
              dispatch({ type: 'SET_ITEMS_PER_PAGE', payload: limit });
              syncUrl({ itemsPerPage: limit });
            }}
          />
        </CardContent>
      </Card>

      <StudentDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) dispatch({ type: 'CLOSE_DIALOG' });
        }}
        formData={formData}
        setFormData={(fd) => dispatch({ type: 'SET_FORM_DATA', payload: fd })}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export function AdminStudents() {
  return (
    <Suspense fallback={<StudentSkeleton />}>
      <AdminStudentsContent />
    </Suspense>
  );
}
