import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { useAppStore } from '@/store/use-app-store';
import { AttendanceStatus, StaffAttendanceItem, AttendanceStatsData } from './types';

export function useStaffAttendance(initialTab?: string) {
  const queryClient = useQueryClient();
  const { currentTenantId } = useAppStore();

  const [activeTab, setActiveTab] = useState(initialTab || 'teacher');
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingChanges, setPendingChanges] = useState<Record<string, AttendanceStatus>>({});

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, activeTab]);

  useEffect(() => {
    setPendingChanges({});
  }, [selectedDate, activeTab]);

  // Scalable data fetching with Axios
  const {
    data: attendanceData,
    isLoading: queryLoading,
    error,
  } = useQuery({
    queryKey: ['staff-attendance', activeTab, selectedDate],
    queryFn: async (): Promise<StaffAttendanceItem[]> => {
      const [staffList, attendanceList] = await Promise.all([
        api.get<any[]>(`/staff?role=${activeTab}&mode=min`),
        api.get<any[]>(`/staff-attendance?date=${selectedDate}`),
      ]);

      const staff = Array.isArray(staffList) ? staffList : (staffList as any).data || [];
      const attendance = Array.isArray(attendanceList) ? attendanceList : (attendanceList as any).data || [];

      const attendanceMap = new Map(attendance.map((a: any) => [a.userId, a]));

      return staff.map((u: any) => ({
        id: u.id,
        staffName: u.name,
        role: u.customRole?.name || u.role,
        status: ((attendanceMap.get(u.id) as any)?.status || 'absent') as AttendanceStatus,
      }));
    },
    enabled: !!currentTenantId,
    refetchOnWindowFocus: true,
  });

  const { mutate: bulkMark, isPending: isSaving } = useMutation({
    mutationFn: (data: any) => api.post('/staff-attendance', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-attendance'] });
      setPendingChanges({});
      toast.success('Attendance synced successfully!');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('schoolsaas_attendance_updated'));
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to save attendance');
    },
  });

  useEffect(() => {
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['staff-attendance'] });
    };
    window.addEventListener('schoolsaas_attendance_updated', handleUpdate);
    return () => {
      window.removeEventListener('schoolsaas_attendance_updated', handleUpdate);
    };
  }, [queryClient]);

  const records = attendanceData || [];

  const handleStatusChange = (userId: string, status: AttendanceStatus) => {
    setPendingChanges((prev) => ({ ...prev, [userId]: status }));
  };

  const markAll = (status: AttendanceStatus) => {
    const newChanges = { ...pendingChanges };
    records.forEach((r) => {
      newChanges[r.id] = status;
    });
    setPendingChanges(newChanges);
    toast.success(
      `Marked all ${activeTab === 'teacher' ? 'Teachers' : 'Staff'} as ${status} locally.`
    );
  };

  const handleSave = () => {
    // Current Indian Standard Time (IST - Asia/Kolkata)
    const nowTimeStr = new Date().toLocaleTimeString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const existingRecordMap = new Map(records.map((r: any) => [r.id, r]));

    const changes = Object.entries(pendingChanges).map(([userId, status]) => {
      const existing = existingRecordMap.get(userId) as any;
      const existingCheckIn = existing?.checkIn;

      return {
        userId,
        status,
        checkIn: status === 'present' ? (existingCheckIn || nowTimeStr) : undefined,
      };
    });

    if (changes.length) {
      bulkMark({ date: selectedDate, records: changes });
    }
  };

  const stats: AttendanceStatsData = useMemo(() => {
    let p = 0;
    let a = 0;
    records.forEach((r) => {
      const s = pendingChanges[r.id] || r.status;
      if (s === 'present') p++;
      else if (s === 'absent') a++;
    });
    return { present: p, absent: a, total: records.length };
  }, [records, pendingChanges]);

  const filtered = useMemo(() => {
    return records.filter((r) =>
      r.staffName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [records, searchQuery]);

  const hasChanges = Object.keys(pendingChanges).length > 0;

  return {
    activeTab,
    setActiveTab,
    selectedDate,
    setSelectedDate,
    searchQuery,
    setSearchQuery,
    pendingChanges,
    records,
    filtered,
    stats,
    hasChanges,
    queryLoading,
    isSaving,
    error,
    handleStatusChange,
    markAll,
    handleSave,
  };
}
