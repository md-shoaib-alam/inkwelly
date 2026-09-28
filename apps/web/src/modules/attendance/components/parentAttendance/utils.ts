import { AttendanceRecord } from "@/lib/types";

export function getAttendanceStats(records: AttendanceRecord[]) {
  const total = records.length;
  const present = records.filter((r) => r.status === "present").length;
  const absent = records.filter((r) => r.status === "absent").length;
  const percentage =
    total > 0 ? Math.round((present / total) * 100) : 0;
  return { total, present, absent, percentage };
}

export function getMonthlyData(records: AttendanceRecord[]) {
  const now = new Date();
  const months: {
    month: string;
    present: number;
    absent: number;
  }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthLabel = d.toLocaleString("en-US", { month: "short" });
    const targetYear = d.getFullYear();
    const targetMonth = d.getMonth();

    const monthRecords = records.filter((r) => {
      // Split YYYY-MM-DD to avoid timezone shifts
      const [ry, rm] = r.date.split("-").map(Number);
      return ry === targetYear && rm === targetMonth + 1;
    });

    months.push({
      month: monthLabel,
      present: monthRecords.filter((r) => r.status === "present").length,
      absent: monthRecords.filter((r) => r.status === "absent").length,
    });
  }
  return months;
}

export function getCalendarData(records: AttendanceRecord[], baseDate = new Date()) {
  const days: { date: number | null; day: string | null; status: string | null }[] = [];
  const statusMap = new Map<string, string>();
  records.forEach((r) => statusMap.set(r.date, r.status));

  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const numDays = lastDay.getDate();
  const startDay = firstDay.getDay();

  for (let i = 0; i < startDay; i++) {
    days.push({ date: null, day: null, status: null });
  }

  for (let i = 1; i <= numDays; i++) {
    const d = new Date(year, month, i);
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    const dayOfWeek = d.getDay();
    days.push({
      date: i,
      day: d.toLocaleString("en-US", { weekday: "narrow" }),
      status:
        dayOfWeek === 0 || dayOfWeek === 6
          ? null
          : statusMap.get(dateStr) || null,
    });
  }
  return days;
}

export function getCalendarCellColor(status: string | null) {
  if (!status)
    return "bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300";
  switch (status) {
    case "present":
      return "bg-emerald-500 text-white";
    case "absent":
      return "bg-red-500 text-white";
    default:
      return "bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300";
  }
}

export function getTodayAttendance(records: AttendanceRecord[]) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const todayStr = `${year}-${month}-${day}`;

  const record = records.find((r) => r.date === todayStr || r.date.startsWith(todayStr));

  if (record) {
    return {
      status: record.status,
      date: record.date,
    };
  }

  return {
    status: "not_marked",
    date: todayStr,
  };
}

