"use client";

import { useReducer, useEffect, useMemo, useState } from "react";
import { useViewMode } from "@/hooks/use-view-mode";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAppStore } from "@/store/use-app-store";
import {
  useParents,
  useClassesMin,
} from "@/lib/graphql/hooks/academic.hooks";
import { useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/graphql/keys";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Pagination } from "@/components/shared/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Sub-components
import { ParentsHeader } from "./parents/ParentsHeader";
import { ParentsTableView } from "./parents/ParentsTableView";
import { ParentsGridView } from "./parents/ParentsGridView";
import { ParentsEmptyState } from "./parents/ParentsEmptyState";
import { EditParentDialog } from "./parents/ParentDialog";
import { CreateParentDialog } from "./parents/CreateParentDialog";
import { LinkChildDialog } from "./parents/LinkChildDialog";
import { ParentSkeleton } from "./parents/ParentSkeleton";
import { ParentDetailDialog } from "./parents/ParentDetailDialog";
import { ParentCreatedSuccessDialog, type ParentCreatedData } from "./parents/ParentCreatedSuccessDialog";
import { ParentProfileView } from "./parents/ParentProfileView";
import { ParentInfo, StudentInfo } from "./parents/types";

type State = {
  search: string;
  currentPage: number;
  itemsPerPage: number;
  linkOpen: boolean;
  selectedParent: ParentInfo | null;
  selectedClass: string;
  linking: boolean;
  createOpen: boolean;
  createForm: {
    name: string; email: string; phone: string; alternatePhone?: string; occupation: string; password: ""; username?: string; gender?: string; dateOfBirth?: string; relationship?: string; address?: string;
  };
  creating: boolean;
  editOpen: boolean;
  editingParent: ParentInfo | null;
  editForm: {
    name: string; email: string; phone: string; alternatePhone?: string; occupation: string; gender?: string; dateOfBirth?: string; address?: string;
  };
  editing: boolean;
  detailOpen: boolean;
  selectedParentDetail: ParentInfo | null;
};

type Action =
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'SET_ITEMS_PER_PAGE'; payload: number }
  | { type: 'SET_LINK_OPEN'; payload: boolean }
  | { type: 'OPEN_LINK_DIALOG'; payload: ParentInfo }
  | { type: 'SET_SELECTED_CLASS'; payload: string }
  | { type: 'SET_LINKING'; payload: boolean }
  | { type: 'SET_CREATE_OPEN'; payload: boolean }
  | { type: 'SET_CREATE_FORM'; payload: Partial<State['createForm']> }
  | { type: 'RESET_CREATE_FORM' }
  | { type: 'SET_CREATING'; payload: boolean }
  | { type: 'OPEN_EDIT_DIALOG'; payload: ParentInfo }
  | { type: 'SET_EDIT_OPEN'; payload: boolean }
  | { type: 'SET_EDIT_FORM'; payload: Partial<State['editForm']> }
  | { type: 'SET_EDITING'; payload: boolean }
  | { type: 'SET_DETAIL_OPEN'; payload: boolean }
  | { type: 'OPEN_DETAIL_DIALOG'; payload: ParentInfo };

const initialState: State = {
  search: "",
  currentPage: 1,
  itemsPerPage: 15,
  linkOpen: false,
  selectedParent: null,
  selectedClass: "all",
  linking: false,
  createOpen: false,
  createForm: {
    name: "", email: "", phone: "", alternatePhone: "", occupation: "", password: "", username: "", gender: "male", dateOfBirth: "", relationship: "Parent", address: "",
  },
  creating: false,
  editOpen: false,
  editingParent: null,
  editForm: {
    name: "", email: "", phone: "", alternatePhone: "", occupation: "", gender: "male", dateOfBirth: "", address: "",
  },
  editing: false,
  detailOpen: false,
  selectedParentDetail: null,
};

const actionHandlers: {
  [K in Action['type']]: (state: State, payload: any) => State;
} = {
  SET_SEARCH: (state, payload) => ({ ...state, search: payload, currentPage: 1 }),
  SET_CURRENT_PAGE: (state, payload) => ({ ...state, currentPage: payload }),
  SET_ITEMS_PER_PAGE: (state, payload) => ({ ...state, itemsPerPage: payload, currentPage: 1 }),
  SET_LINK_OPEN: (state, payload) => ({ ...state, linkOpen: payload }),
  OPEN_LINK_DIALOG: (state, payload) => ({ ...state, selectedParent: payload, linkOpen: true, selectedClass: "all" }),
  SET_SELECTED_CLASS: (state, payload) => ({ ...state, selectedClass: payload }),
  SET_LINKING: (state, payload) => ({ ...state, linking: payload }),
  SET_CREATE_OPEN: (state, payload) => ({ ...state, createOpen: payload }),
  SET_CREATE_FORM: (state, payload) => ({ ...state, createForm: { ...state.createForm, ...payload } }),
  RESET_CREATE_FORM: (state) => ({ ...state, createForm: initialState.createForm, createOpen: false }),
  SET_CREATING: (state, payload) => ({ ...state, creating: payload }),
  OPEN_EDIT_DIALOG: (state, payload) => ({
    ...state,
    editingParent: payload,
    editForm: {
      name: payload.name || "",
      email: payload.email || "",
      phone: payload.phone || "",
      alternatePhone: (payload as any).alternatePhone || "",
      occupation: payload.occupation || "",
      gender: (payload as any).gender || "male",
      dateOfBirth: (payload as any).dateOfBirth || "",
      address: (payload as any).address || "",
    },
    editOpen: true
  }),
  SET_EDIT_OPEN: (state, payload) => ({ ...state, editOpen: payload }),
  SET_EDIT_FORM: (state, payload) => ({ ...state, editForm: { ...state.editForm, ...payload } }),
  SET_EDITING: (state, payload) => ({ ...state, editing: payload }),
  SET_DETAIL_OPEN: (state, payload) => ({ ...state, detailOpen: payload }),
  OPEN_DETAIL_DIALOG: (state, payload) => ({ ...state, selectedParentDetail: payload, detailOpen: true }),
};

function reducer(state: State, action: Action): State {
  const handler = actionHandlers[action.type];
  return handler ? handler(state, (action as any).payload) : state;
}

function validateEditForm(
  editingParent: ParentInfo | null,
  editForm: { name: string; email: string; phone: string; occupation: string }
): boolean {
  if (!editingParent) {
    return false;
  }
  if (!editForm.name) {
    toast.error("Name and phone number are required");
    return false;
  }
  if (!editForm.phone) {
    toast.error("Name and phone number are required");
    return false;
  }
  if (editForm.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editForm.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
  }
  return true;
}

export function AdminParents() {
  const { currentTenantId } = useAppStore();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useViewMode("parents", "grid");

  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    search, currentPage, itemsPerPage, linkOpen, selectedParent: stateSelectedParent, selectedClass,
    linking, createOpen, createForm, creating, editOpen,
    editingParent, editForm, editing, detailOpen, selectedParentDetail: stateSelectedParentDetail
  } = state;


  const [unlinkConfirmOpen, setUnlinkConfirmOpen] = useState(false);
  const [unlinkData, setUnlinkData] = useState<{ parentId: string; studentId: string } | null>(null);
  const [createdSuccessData, setCreatedSuccessData] = useState<ParentCreatedData | null>(null);
  const [createdSuccessOpen, setCreatedSuccessOpen] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");
  const parentUrlParam = searchParams.get("parent") || searchParams.get("parentId");

  // Sync initial URL search params into state (run once on mount)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const parsedLimit = limitParam ? Number(limitParam) : NaN;
    if (Number.isInteger(parsedLimit) && parsedLimit > 0) {
      dispatch({ type: "SET_ITEMS_PER_PAGE", payload: parsedLimit });
    }
    const parsedPage = pageParam ? Number(pageParam) : NaN;
    if (Number.isInteger(parsedPage) && parsedPage > 0) {
      dispatch({ type: "SET_CURRENT_PAGE", payload: parsedPage });
    }
  }, []);

  const updateUrlParams = (page: number, limit: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) params.set("page", String(page)); else params.delete("page");
    if (limit !== 15) params.set("limit", String(limit)); else params.delete("limit");
    const newQuery = params.toString();
    router.replace(newQuery ? `${pathname}?${newQuery}` : pathname, { scroll: false });
  };

  // Queries
  const { 
    data: parentsData, 
    isLoading: loadingParents 
  } = useParents(currentTenantId || undefined, search || undefined, currentPage, itemsPerPage);

  const { data: classesData } = useClassesMin(currentTenantId || undefined);

  // Students for linking (filtered by class if selected) - Using optimized min-data REST API
  const [studentSearch, setStudentSearch] = useState("");
  const debouncedStudentSearch = useDebounce(studentSearch, 500);
  const [unlinkedOnly, setUnlinkedOnly] = useState(true);

  const { 
    data: studentData, 
    isLoading: loadingStudents,
    isFetchingNextPage: fetchingNextPage,
    hasNextPage,
    fetchNextPage
  } = useInfiniteQuery({
    queryKey: ['students-min-infinite', selectedClass, debouncedStudentSearch, unlinkedOnly],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const params: any = { mode: 'min', limit: 50, page: pageParam, unlinkedOnly: unlinkedOnly ? 'true' : 'false' };
        if (selectedClass && selectedClass !== 'all') params.classId = selectedClass;
        if (debouncedStudentSearch) params.search = debouncedStudentSearch;
        const res = await api.get('/students', { params });
        const data = res as any;
        return (data?.items ? data : { items: [], hasMore: false, page: 1 }) as { items: StudentInfo[]; hasMore: boolean; page: number };
      } catch (err) {
        console.error("Failed to fetch students for linking:", err);
        return { items: [], hasMore: false, page: 1 } as { items: StudentInfo[]; hasMore: boolean; page: number };
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || !lastPage.hasMore) return undefined;
      const nextPage = lastPage.page ? lastPage.page + 1 : (allPages?.length ? allPages.length + 1 : 2);
      return isNaN(nextPage) ? undefined : nextPage;
    },
    enabled: linkOpen && !!currentTenantId,
    staleTime: 5000,
    refetchOnWindowFocus: false,
    refetchOnMount: true
  });


  const { parents: rawParents = [], total: totalItems = 0, totalPages = 1 } = parentsData || {};

  const parents = useMemo(() => {
    return [...rawParents].sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [rawParents]);

  // Derive selected parent dynamically from the latest parents list to keep modal synchronised reactively
  const selectedParent = useMemo(() => {
    if (!stateSelectedParent) return null;
    return parents.find((p) => p.id === stateSelectedParent.id) || stateSelectedParent;
  }, [parents, stateSelectedParent]);

  const selectedParentDetail = useMemo(() => {
    if (!stateSelectedParentDetail) return null;
    return parents.find((p) => p.id === stateSelectedParentDetail.id) || stateSelectedParentDetail;
  }, [parents, stateSelectedParentDetail]);

  const students = useMemo(() => {
    const rawList = studentData?.pages.flatMap((page) => page?.items || []) || [];
    const seen = new Set<string>();
    return rawList.filter((s) => {
      if (!s?.id || seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [studentData]);
  const classes = classesData?.classes || [];

  const filteredStudents = useMemo(() => {
    return students.filter(
      (s) => !selectedParent?.children?.some((c) => c.id === s.id)
    );
  }, [students, selectedParent]);

  const handleCreate = async () => {
    if (!createForm.name || !createForm.phone) { toast.error("Name and phone number are required"); return; }
    if (createForm.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(createForm.email)) { toast.error("Please enter a valid email address"); return; }
    }

    const formSnapshot = { ...createForm };

    toast.promise(
      (async () => {
        dispatch({ type: 'SET_CREATING', payload: true });
        try {
          const res = await api.post("/parents", { action: "create", ...createForm });
          const resData = res.data || {};
          dispatch({ type: 'RESET_CREATE_FORM' });
          queryClient.invalidateQueries({ queryKey: queryKeys.parents });

          setCreatedSuccessData({
            id: resData.id,
            name: formSnapshot.name,
            relationship: formSnapshot.relationship || "Parent",
            phone: formSnapshot.phone,
            email: formSnapshot.email,
            username: resData.username || formSnapshot.username || "PRN2026001",
            password: formSnapshot.password || "changeme123",
          });
          setCreatedSuccessOpen(true);

          if (resData.username) {
            return `Parent account created! Parent ID: ${resData.username}`;
          }
          return "Parent account created";
        } finally { dispatch({ type: 'SET_CREATING', payload: false }); }
      })(),
      { loading: "Creating parent account...", success: (msg) => msg, error: (err: any) => err.message, },
    );
  };

  const handleLinkChild = async (studentId: string) => {
    if (!selectedParent) return;
    const targetParentId = selectedParent.id;
    const targetStudent = students.find((s) => s.id === studentId);
    const newChild = targetStudent
      ? {
          id: targetStudent.id,
          name: targetStudent.name,
          email: targetStudent.email,
          rollNumber: targetStudent.rollNumber,
          className: targetStudent.className,
          gender: targetStudent.gender,
          classId: targetStudent.classId,
        }
      : {
          id: studentId,
          name: "Student",
        };

    // Optimistically update viewingParentSnapshot so the profile view updates instantly
    setViewingParentSnapshot((prev) => {
      if (!prev || prev.id !== targetParentId) return prev;
      const existing = prev.children || [];
      if (existing.some((c) => c.id === studentId)) return prev;
      return {
        ...prev,
        children: [...existing, newChild],
      };
    });

    // Optimistically update React Query cache in memory
    queryClient.setQueriesData({ queryKey: queryKeys.parents }, (oldData: any) => {
      if (!oldData) return oldData;
      const updateParent = (p: any) => {
        if (p.id === targetParentId) {
          const existing = p.children || [];
          if (existing.some((c: any) => c.id === studentId)) return p;
          return { ...p, children: [...existing, newChild] };
        }
        return p;
      };
      if (Array.isArray(oldData)) return oldData.map(updateParent);
      if (oldData.parents && Array.isArray(oldData.parents)) return { ...oldData, parents: oldData.parents.map(updateParent) };
      if (oldData.items && Array.isArray(oldData.items)) return { ...oldData, items: oldData.items.map(updateParent) };
      return oldData;
    });

    // Optimistically update students query so badge turns to Linked in LinkChildDialog
    queryClient.setQueriesData({ queryKey: ['students-min-infinite'] }, (old: any) => {
      if (!old || !old.pages) return old;
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          items: (page.items || []).map((s: any) =>
            s.id === studentId ? { ...s, parentId: targetParentId } : s
          ),
        })),
      };
    });

    toast.promise(
      (async () => {
        dispatch({ type: 'SET_LINKING', payload: true });
        try {
          await api.post("/parents", { action: "link", parentId: targetParentId, studentId });
          await queryClient.invalidateQueries({ queryKey: queryKeys.parents, refetchType: 'all' });
          await queryClient.invalidateQueries({ queryKey: ['students-min-infinite'], refetchType: 'all' });
          return "Student linked successfully";
        } catch (err) {
          await queryClient.invalidateQueries({ queryKey: queryKeys.parents, refetchType: 'all' });
          throw err;
        } finally { dispatch({ type: 'SET_LINKING', payload: false }); }
      })(),
      { loading: "Linking child to parent...", success: (msg: any) => msg, error: (err: any) => err.message }
    );
  };

  const handleUnlinkChild = (parentId: string, studentId: string) => {
    setUnlinkData({ parentId, studentId });
    setUnlinkConfirmOpen(true);
  };

  const executeUnlinkChild = async () => {
    if (!unlinkData) return;
    const { parentId, studentId } = unlinkData;
    setUnlinkConfirmOpen(false);
    setUnlinkData(null);

    // Optimistically update viewingParentSnapshot so profile view removes child immediately
    setViewingParentSnapshot((prev) => {
      if (!prev || prev.id !== parentId) return prev;
      return {
        ...prev,
        children: (prev.children || []).filter((c) => c.id !== studentId),
      };
    });

    // Optimistically update React Query cache in memory immediately
    queryClient.setQueriesData({ queryKey: queryKeys.parents }, (oldData: any) => {
      if (!oldData) return oldData;
      const updateParent = (p: any) => {
        if (p.id === parentId) {
          return { ...p, children: (p.children || []).filter((c: any) => c.id !== studentId) };
        }
        return p;
      };
      if (Array.isArray(oldData)) return oldData.map(updateParent);
      if (oldData.parents && Array.isArray(oldData.parents)) return { ...oldData, parents: oldData.parents.map(updateParent) };
      if (oldData.items && Array.isArray(oldData.items)) return { ...oldData, items: oldData.items.map(updateParent) };
      return oldData;
    });

    // Optimistically update students query so student is marked unlinked
    queryClient.setQueriesData({ queryKey: ['students-min-infinite'] }, (old: any) => {
      if (!old || !old.pages) return old;
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          items: (page.items || []).map((s: any) =>
            s.id === studentId ? { ...s, parentId: null } : s
          ),
        })),
      };
    });

    toast.promise(
      (async () => {
        try {
          await api.post("/parents", { action: "unlink", parentId, studentId });
          await queryClient.invalidateQueries({ queryKey: queryKeys.parents, refetchType: 'all' });
          await queryClient.invalidateQueries({ queryKey: ['students-min-infinite'], refetchType: 'all' });
          return "Child record unlinked";
        } catch (err) {
          await queryClient.invalidateQueries({ queryKey: queryKeys.parents, refetchType: 'all' });
          throw err;
        }
      })(),
      { loading: "Unlinking child...", success: (msg) => msg, error: (err: any) => err.message }
    );
  };

  const handleEditSave = async () => {
    if (!validateEditForm(editingParent, editForm)) {
      return;
    }
    const parent = editingParent!;
    const updatedParent = { ...parent, ...editForm };
    queryClient.setQueriesData({ queryKey: queryKeys.parents }, (old: any) => {
      if (!old || !old.parents) return old;
      return { ...old, parents: old.parents.map((p: any) => p.id === parent.id ? updatedParent : p) };
    });
    toast.promise(
      (async () => {
        dispatch({ type: 'SET_EDITING', payload: true });
        try {
          await api.put("/parents", { id: parent.id, ...editForm });
          dispatch({ type: 'SET_EDIT_OPEN', payload: false });
          queryClient.invalidateQueries({ queryKey: queryKeys.parents });
          return "Parent details updated";
        } finally { dispatch({ type: 'SET_EDITING', payload: false }); }
      })(),
      { loading: "Saving changes...", success: (msg) => msg, error: (err: any) => err.message, },
    );
  };

  const handleDelete = async (id: string) => {
    toast.promise(
      (async () => {
        await api.delete(`/parents?id=${id}`);
        queryClient.invalidateQueries({ queryKey: queryKeys.parents });
        return "Parent record removed";
      })(),
      { loading: "Removing parent record...", success: (msg) => msg, error: (err: any) => err.message, },
    );
  };
  
  // Show skeleton during initial load OR when fetching new page data
  const [viewingParentSnapshot, setViewingParentSnapshot] = useState<ParentInfo | null>(null);

  // Synchronize URL ?parent= query parameter into viewingParent on initial load, refresh, or URL change
  useEffect(() => {
    if (!parentUrlParam) {
      if (viewingParentSnapshot) {
        setViewingParentSnapshot(null);
      }
      return;
    }

    // 1. Check if parent is already in the current parents list
    const found = parents.find(
      (p) => p.id === parentUrlParam || p.username === parentUrlParam
    );
    if (found) {
      if (viewingParentSnapshot?.id !== found.id) {
        setViewingParentSnapshot(found);
      }
      return;
    }

    // 2. If not in current page list, fetch this specific parent by ID or username
    let isMounted = true;
    (async () => {
      try {
        const res = await api.get("/parents", {
          params: { search: parentUrlParam, limit: 10 },
        });
        const items = res?.data?.items || (res as any)?.items || [];
        const match = items.find(
          (p: any) => p.id === parentUrlParam || p.username === parentUrlParam
        );
        if (match && isMounted) {
          setViewingParentSnapshot(match);
        }
      } catch (err) {
        console.error("Failed to load parent from URL:", err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [parentUrlParam, parents]);

  // Derive viewing parent dynamically from the latest parents list to keep profile view synchronized reactively
  const viewingParent = useMemo(() => {
    if (!viewingParentSnapshot) return null;
    return parents.find((p) => p.id === viewingParentSnapshot.id) || viewingParentSnapshot;
  }, [parents, viewingParentSnapshot]);

  const handleOpenParentProfile = (p: ParentInfo) => {
    setViewingParentSnapshot(p);
    const params = new URLSearchParams(searchParams.toString());
    params.set("parent", p.username || p.id);
    const newQuery = params.toString();
    router.push(newQuery ? `${pathname}?${newQuery}` : pathname, { scroll: false });
  };

  const handleCloseParentProfile = () => {
    setViewingParentSnapshot(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("parent");
    params.delete("parentId");
    const newQuery = params.toString();
    router.replace(newQuery ? `${pathname}?${newQuery}` : pathname, { scroll: false });
  };

  if (loadingParents || (parentUrlParam && !viewingParent)) return <ParentSkeleton />;

  return (
    <>
      {/* Full-page profile view OR list view */}
      {viewingParent ? (
        <ParentProfileView
          parent={viewingParent}
          onBack={handleCloseParentProfile}
          canEdit={true}
          onEdit={(p) => {
            handleCloseParentProfile();
            dispatch({ type: 'OPEN_EDIT_DIALOG', payload: p });
          }}
          onLinkChild={(p) => {
            dispatch({ type: 'OPEN_LINK_DIALOG', payload: p });
          }}
          onUnlinkChild={handleUnlinkChild}
        />
      ) : (
        <div className="space-y-6">
          <ParentsHeader
            search={search}
            onSearchChange={(v) => dispatch({ type: 'SET_SEARCH', payload: v })}
            totalParents={parents.length}
            totalChildren={parents.reduce((s, p) => s + (p.children?.length || 0), 0)}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onAddClick={() => dispatch({ type: 'SET_CREATE_OPEN', payload: true })}
          />

          {parents.length === 0 ? (
            <ParentsEmptyState />
          ) : viewMode === "table" ? (
            <ParentsTableView
              parents={parents}
              onEdit={(p) => dispatch({ type: 'OPEN_EDIT_DIALOG', payload: p })}
              onDelete={handleDelete}
              onLinkOpen={(p) => dispatch({ type: 'OPEN_LINK_DIALOG', payload: p })}
              onView={handleOpenParentProfile}
            />
          ) : (
            <ParentsGridView
              parents={parents}
              linking={linking}
              onEdit={(p) => dispatch({ type: 'OPEN_EDIT_DIALOG', payload: p })}
              onDelete={handleDelete}
              onLinkOpen={(p) => dispatch({ type: 'OPEN_LINK_DIALOG', payload: p })}
              onUnlinkChild={handleUnlinkChild}
              onView={handleOpenParentProfile}
            />
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => {
              dispatch({ type: 'SET_CURRENT_PAGE', payload: page });
              updateUrlParams(page, itemsPerPage);
            }}
            onLimitChange={(limit) => {
              dispatch({ type: 'SET_ITEMS_PER_PAGE', payload: limit });
              updateUrlParams(1, limit);
            }}
          />
        </div>
      )}

      {/* ── Dialogs — always rendered so they work from both views ── */}
      <CreateParentDialog
        open={createOpen}
        onOpenChange={(v) => dispatch({ type: 'SET_CREATE_OPEN', payload: v })}
        createForm={createForm}
        setCreateForm={(v) => dispatch({ type: 'SET_CREATE_FORM', payload: v })}
        onCreate={handleCreate}
        creating={creating}
      />

      <EditParentDialog
        open={editOpen}
        onOpenChange={(v) => dispatch({ type: 'SET_EDIT_OPEN', payload: v })}
        editingParent={editingParent}
        editForm={editForm}
        setEditForm={(v) => dispatch({ type: 'SET_EDIT_FORM', payload: v })}
        onSave={handleEditSave}
        editing={editing}
      />

      <LinkChildDialog
        open={linkOpen}
        onOpenChange={(v) => {
          dispatch({ type: 'SET_LINK_OPEN', payload: v });
          if (!v) {
            setStudentSearch("");
            setUnlinkedOnly(true);
          }
        }}
        selectedParent={selectedParent}
        selectedClass={selectedClass}
        setSelectedClass={(v) => dispatch({ type: 'SET_SELECTED_CLASS', payload: v })}
        classes={classes}
        filteredStudents={filteredStudents}
        linking={linking}
        loading={loadingStudents}
        onLinkChild={handleLinkChild}
        onUnlinkChild={handleUnlinkChild}
        searchQuery={studentSearch}
        onSearchQueryChange={setStudentSearch}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        isFetchingNextPage={fetchingNextPage}
        unlinkedOnly={unlinkedOnly}
        onUnlinkedOnlyChange={setUnlinkedOnly}
      />

      <ParentCreatedSuccessDialog
        open={createdSuccessOpen}
        onOpenChange={setCreatedSuccessOpen}
        data={createdSuccessData}
        onAddAnother={() => {
          setCreatedSuccessOpen(false);
          dispatch({ type: 'SET_CREATE_OPEN', payload: true });
        }}
        onViewProfile={(parentId) => {
          setCreatedSuccessOpen(false);
          const found = parents.find((p) => p.id === parentId);
          if (found) handleOpenParentProfile(found);
        }}
      />

      <AlertDialog open={unlinkConfirmOpen} onOpenChange={setUnlinkConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink this student from their parent?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setUnlinkConfirmOpen(false); setUnlinkData(null); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeUnlinkChild} className="bg-red-600 hover:bg-red-700 text-white">
              Unlink
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
