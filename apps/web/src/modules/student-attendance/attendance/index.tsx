"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTenantHref } from "@/modules/academics/hooks/use-tenant-href";
import { CheckCircle2, UserX } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { AttendanceRecord } from "@/lib/types";
import { useModulePermissions } from "@/modules/access-control/hooks/use-permissions";
import { useAppStore } from "@/store/use-app-store";
import { useDebounce } from "@/hooks/use-debounce";
import { useTenantResolution } from "@/lib/graphql/hooks/platform.hooks";

// Sub-components
import { AttendanceHeader } from "./adminAttendance/AttendanceHeader";
import { AttendanceStats } from "./adminAttendance/AttendanceStats";
import { AttendanceTable } from "./adminAttendance/AttendanceTable";
import { AttendanceEmptyState } from "./adminAttendance/AttendanceEmptyState";

const statusConfig: Record<
  string,
  { bg: string; text: string; dot: string; icon: React.ReactNode }
> = {
  present: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    text: "Present",
    dot: "bg-emerald-500",
    icon: <CheckCircle2 className="size-3.5 text-emerald-500" />,
  },
  absent: {
    bg: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
    text: "Absent",
    dot: "bg-red-500",
    icon: <UserX className="size-3.5 text-red-500" />,
  },
};

export function AdminAttendance() {
  const router = useRouter();
  const tenantHref = useTenantHref();
  const { currentTenantId, currentTenantSlug } = useAppStore();
  const { data: tenantData } = useTenantResolution(currentTenantSlug || undefined);
  const plan = tenantData?.plan?.toLowerCase() || "basic";
  const isPremiumOrEnterprise = plan === "premium" || plan === "enterprise";
  const { canCreate, canEdit, canDelete } = useModulePermissions("attendance");
  
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [search, setSearch] = useState("");
  const [isHistoryMode, setIsHistoryMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const { data: attendanceData, isLoading: recordsLoading } = useQuery({
    queryKey: ['attendance', selectedDate, selectedClass, isHistoryMode, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (!isHistoryMode && selectedDate) params.set('date', selectedDate);
      if (selectedClass && selectedClass !== 'all') params.set('classId', selectedClass);
      params.set('page', currentPage.toString());
      params.set('limit', '50');
      
      const res = await apiFetch(`/api/attendance?${params.toString()}`);
      if (!res.ok) return { records: [], total: 0, totalPages: 0 };
      return res.json();
    },
    enabled: !!selectedClass
  });

  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ['classes', 'min'],
    queryFn: async () => {
      const res = await apiFetch('/api/classes?mode=min');
      if (!res.ok) return [];
      return res.json();
    }
  });

  const loading = recordsLoading || classesLoading;
  const isSelectionMade = selectedClass !== "";
  const rawRecords = (attendanceData?.records || []) as AttendanceRecord[];
  
  const records = rawRecords.filter((r) => 
    !debouncedSearch || r.studentName.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const presentCount = records.filter((r) => r.status === "present").length;
  const absentCount = records.filter((r) => r.status === "absent").length;
  const total = records.length;
  const presentRate = total > 0 ? ((presentCount / total) * 100).toFixed(1) : "0";

  const summaryCards = [
    {
      label: "Present",
      count: presentCount,
      percentage: total > 0 ? ((presentCount / total) * 100).toFixed(1) : "0",
      icon: <CheckCircle2 className="size-5 text-emerald-600" />,
      color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
      borderColor: "border-emerald-200 dark:border-emerald-800",
    },
    {
      label: "Absent",
      count: absentCount,
      percentage: total > 0 ? ((absentCount / total) * 100).toFixed(1) : "0",
      icon: <UserX className="size-5 text-red-600 dark:text-red-400" />,
      color: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
      borderColor: "border-red-200 dark:border-red-800",
    },
    {
      label: "Attendance Rate",
      count: `${presentRate}%`,
      percentage: null,
      icon: <CheckCircle2 className="size-5 text-blue-600 dark:text-blue-400" />,
      color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
      borderColor: "border-blue-200 dark:border-blue-800",
    },
  ];

  const handleViewProfile = (record: AttendanceRecord) => {
    router.push(tenantHref(`students?student=${encodeURIComponent(record.studentId)}`));
  };

  const isDatePickerDisabled = (date: Date) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (date > now) return true;
    let daysAllowed = plan === 'standard' ? 14 : isPremiumOrEnterprise ? 28 : 7;
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - daysAllowed);
    return date < cutoff;
  };

  return (
    <div className="space-y-6">
      <AttendanceHeader 
        selectedClass={selectedClass}
        onClassChange={(val) => { setSelectedClass(val); setCurrentPage(1); }}
        classes={classes}
        selectedDate={selectedDate}
        onDateChange={(d) => {
          setIsHistoryMode(false);
          if (d) {
            setSelectedDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
            setCurrentPage(1);
          }
        }}
        isDatePickerDisabled={isDatePickerDisabled}
        isHistoryMode={isHistoryMode}
        onToggleHistory={() => { if (isPremiumOrEnterprise) { setIsHistoryMode(!isHistoryMode); setCurrentPage(1); } }}
        isPremiumOrEnterprise={isPremiumOrEnterprise}
      />

      {!isSelectionMade ? (
        <AttendanceEmptyState />
      ) : (
        <>
          <AttendanceStats 
            summaryCards={summaryCards}
            loading={loading}
            statusConfig={statusConfig}
          />

          <AttendanceTable 
            selectedClass={selectedClass}
            classes={classes}
            search={search}
            setSearch={setSearch}
            loading={loading}
            records={records}
            isHistoryMode={isHistoryMode}
            statusConfig={statusConfig}
            totalPages={attendanceData?.totalPages || 0}
            totalItems={attendanceData?.total || 0}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onViewProfile={handleViewProfile}
          />
        </>
      )}
    </div>
  );
}
