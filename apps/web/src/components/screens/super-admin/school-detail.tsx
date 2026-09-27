"use client";

import { useState, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { 
  useTenantMetadata, useStudents, useTeachers, useParents, 
  useClasses, useFees, useAttendance, useNotices 
} from "@/lib/graphql/hooks";
import { useDebounce } from "@/hooks/use-debounce";

// Sub-components
import { DetailHeader } from "./school-detail/DetailHeader";
import { DetailTabs } from "./school-detail/DetailTabs";

// Types
import { TabType } from "./school-detail/types";

interface SchoolDetailProps {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  tenantPlan: string;
  onBack: () => void;
}

const ITEMS_PER_PAGE = 20;



interface TabResult<T> {
  paginatedData: T[];
  totalItems: number;
  totalPages: number;
  isTabLoading: boolean;
}

function getStudentsData(data: any, isFetching: boolean): TabResult<any> {
  return {
    paginatedData: data?.students || [],
    totalItems: data?.total || 0,
    totalPages: data?.totalPages || 1,
    isTabLoading: isFetching,
  };
}

function getTeachersData(data: any, isFetching: boolean): TabResult<any> {
  return {
    paginatedData: data?.teachers || [],
    totalItems: data?.total || 0,
    totalPages: data?.totalPages || 1,
    isTabLoading: isFetching,
  };
}

function getParentsData(data: any, isFetching: boolean): TabResult<any> {
  return {
    paginatedData: data?.parents || [],
    totalItems: data?.total || 0,
    totalPages: data?.totalPages || 1,
    isTabLoading: isFetching,
  };
}

function getClassesData(data: any, isFetching: boolean, search: string): TabResult<any> {
  const rawClasses = data?.classes || [];
  const query = search.trim().toLowerCase();
  const filtered = !query ? rawClasses : rawClasses.filter((c: any) => 
    c.name.toLowerCase().includes(query) || 
    c.section.toLowerCase().includes(query)
  );
  return {
    paginatedData: filtered,
    totalItems: filtered.length,
    totalPages: data?.totalPages || 1,
    isTabLoading: isFetching,
  };
}

function getFeesData(data: any, isFetching: boolean, search: string): TabResult<any> {
  const rawFees = data?.fees || [];
  const query = search.trim().toLowerCase();
  const filtered = !query ? rawFees : rawFees.filter((f: any) => 
    f.studentName.toLowerCase().includes(query) ||
    f.type.toLowerCase().includes(query)
  );
  return {
    paginatedData: filtered,
    totalItems: filtered.length,
    totalPages: data?.totalPages || 1,
    isTabLoading: isFetching,
  };
}

function getAttendanceData(data: any, isFetching: boolean, search: string): TabResult<any> {
  const rawAtt = data?.records || [];
  const query = search.trim().toLowerCase();
  const filtered = !query ? rawAtt : rawAtt.filter((a: any) => 
    a.studentName.toLowerCase().includes(query) ||
    a.className.toLowerCase().includes(query)
  );
  return {
    paginatedData: filtered,
    totalItems: filtered.length,
    totalPages: data?.totalPages || 1,
    isTabLoading: isFetching,
  };
}

function getNoticesData(data: any, isFetching: boolean, search: string): TabResult<any> {
  const rawNotices = data?.notices || [];
  const query = search.trim().toLowerCase();
  const filtered = !query ? rawNotices : rawNotices.filter((n: any) => 
    n.title.toLowerCase().includes(query) || 
    n.content.toLowerCase().includes(query)
  );
  return {
    paginatedData: filtered,
    totalItems: filtered.length,
    totalPages: data?.totalPages || 1,
    isTabLoading: isFetching,
  };
}

function useSchoolTabsData(
  tenantId: string,
  activeTab: TabType,
  debouncedSearch: string,
  search: string,
  currentPage: number
) {
  // Progressive tab query hooks (only enabled if the tab is active and tenantId is present)
  const studentsRes = useStudents(
    activeTab === "students" ? tenantId : undefined,
    undefined,
    activeTab === "students" && debouncedSearch ? debouncedSearch : undefined,
    undefined,
    undefined,
    activeTab === "students" ? currentPage : 1,
    ITEMS_PER_PAGE
  );

  const teachersRes = useTeachers(
    activeTab === "teachers" ? tenantId : undefined,
    activeTab === "teachers" && debouncedSearch ? debouncedSearch : undefined,
    activeTab === "teachers" ? currentPage : 1,
    ITEMS_PER_PAGE
  );

  const parentsRes = useParents(
    activeTab === "parents" ? tenantId : undefined,
    activeTab === "parents" && debouncedSearch ? debouncedSearch : undefined,
    activeTab === "parents" ? currentPage : 1,
    ITEMS_PER_PAGE
  );

  const classesRes = useClasses(
    activeTab === "classes" ? tenantId : undefined,
    activeTab === "classes" ? currentPage : 1,
    ITEMS_PER_PAGE
  );

  const feesRes = useFees(
    activeTab === "fees" ? tenantId : undefined,
    activeTab === "fees" ? currentPage : 1,
    ITEMS_PER_PAGE
  );

  const attendanceRes = useAttendance(
    activeTab === "attendance" ? tenantId : undefined,
    activeTab === "attendance" ? currentPage : 1,
    ITEMS_PER_PAGE
  );

  const noticesRes = useNotices(
    activeTab === "notices" ? tenantId : undefined,
    activeTab === "notices" ? currentPage : 1,
    ITEMS_PER_PAGE
  );

  // ── Tab data accessors ──
  return useMemo(() => {
    switch (activeTab) {
      case "students":
        return getStudentsData(studentsRes.data, studentsRes.isFetching);
      case "teachers":
        return getTeachersData(teachersRes.data, teachersRes.isFetching);
      case "parents":
        return getParentsData(parentsRes.data, parentsRes.isFetching);
      case "classes":
        return getClassesData(classesRes.data, classesRes.isFetching, search);
      case "fees":
        return getFeesData(feesRes.data, feesRes.isFetching, search);
      case "attendance":
        return getAttendanceData(attendanceRes.data, attendanceRes.isFetching, search);
      case "notices":
        return getNoticesData(noticesRes.data, noticesRes.isFetching, search);
      default:
        return { paginatedData: [], totalItems: 0, totalPages: 1, isTabLoading: false };
    }
  }, [
    activeTab, search,
    studentsRes.data, studentsRes.isFetching,
    teachersRes.data, teachersRes.isFetching,
    parentsRes.data, parentsRes.isFetching,
    classesRes.data, classesRes.isFetching,
    feesRes.data, feesRes.isFetching,
    attendanceRes.data, attendanceRes.isFetching,
    noticesRes.data, noticesRes.isFetching,
  ]);
}

export function SchoolDetail({
  tenantId,
  tenantName,
  tenantSlug,
  tenantPlan,
  onBack,
}: SchoolDetailProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("students");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  // ── Data Fetching ──
  const { data, isLoading: loading } = useTenantMetadata(tenantId);
  const debouncedSearch = useDebounce(search, 300);

  const { paginatedData, totalItems, totalPages, isTabLoading } = useSchoolTabsData(
    tenantId,
    activeTab,
    debouncedSearch,
    search,
    currentPage
  );

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearch("");
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  // ── Export ──
  async function handleExport(dataType: string) {
    setExporting(true);
    try {
      const res = await apiFetch("/api/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, dataType }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tenantSlug}_${dataType}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${dataType} exported to Excel successfully`);
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  }

  // ── Import ──
  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tenantId", tenantId);
      formData.append("dataType", activeTab);

      const res = await apiFetch("/api/import", { method: "POST", body: formData });
      const result = await res.json();
      if (result.success) {
        toast.success(`Imported ${result.imported} ${activeTab}`);
        // Invalidate both metadata and specific list query cache
        queryClient.invalidateQueries({ queryKey: ["tenant", "metadata", tenantId] });
        queryClient.invalidateQueries({ queryKey: [activeTab] });
      } else {
        toast.error(result.error || "Import failed");
      }
    } catch {
      toast.error("Import failed");
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="size-10 animate-spin text-rose-600" />
        <p className="text-sm font-medium text-muted-foreground">Fetching school records…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DetailHeader 
        tenant={data?.tenant}
        tenantName={tenantName}
        tenantSlug={tenantSlug}
        tenantPlan={tenantPlan}
        onBack={onBack}
      />

      <DetailTabs 
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        search={search}
        setSearch={handleSearchChange}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        exporting={exporting}
        importing={importing}
        onExport={handleExport}
        onImportClick={() => importInputRef.current?.click()}
        paginatedData={paginatedData}
        totalPages={totalPages}
        totalItems={totalItems}
        isLoading={isTabLoading}
      />

      <input
        ref={importInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleImport}
      />
    </div>
  );
}
