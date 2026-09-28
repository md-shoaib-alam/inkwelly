import { TableCell, TableHead } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { 
  statusColors, 
  TabType, 
  Student, 
  Teacher, 
  Parent, 
  Class, 
  Fee, 
  Attendance, 
  Notice 
} from "./types";
import { IndianRupee, Clock, UserCircle, ShieldAlert } from "lucide-react";

export function TableHeaders({ activeTab }: { activeTab: TabType }) {
  const commonClasses = "text-xs font-semibold text-slate-500 dark:text-slate-400 py-3.5";
  switch (activeTab) {
    case "students":
      return (
        <>
          <TableHead className="w-10 py-3.5 pl-4">
            <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 size-3.5" />
          </TableHead>
          <TableHead className="w-12 text-xs font-semibold text-slate-500 dark:text-slate-400 py-3.5">#</TableHead>
          <TableHead className={commonClasses}>Student Name</TableHead>
          <TableHead className={commonClasses}>Admission No.</TableHead>
          <TableHead className={commonClasses}>Class</TableHead>
          <TableHead className={commonClasses}>Parent</TableHead>
          <TableHead className={commonClasses}>Status</TableHead>
          <TableHead className={commonClasses}>Joined Date</TableHead>
          <TableHead className={`${commonClasses} text-right pr-4`}>Actions</TableHead>
        </>
      );
    case "teachers":
      return (
        <>
          <TableHead className="w-10 py-3.5 pl-4">
            <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 size-3.5" />
          </TableHead>
          <TableHead className="w-12 text-xs font-semibold text-slate-500 dark:text-slate-400 py-3.5">#</TableHead>
          <TableHead className={commonClasses}>Teacher Name</TableHead>
          <TableHead className={commonClasses}>Qualification</TableHead>
          <TableHead className={commonClasses}>Experience</TableHead>
          <TableHead className={commonClasses}>Contact</TableHead>
          <TableHead className={commonClasses}>Status</TableHead>
          <TableHead className={`${commonClasses} text-right pr-4`}>Actions</TableHead>
        </>
      );
    case "parents":
      return (
        <>
          <TableHead className="w-10 py-3.5 pl-4">
            <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 size-3.5" />
          </TableHead>
          <TableHead className="w-12 text-xs font-semibold text-slate-500 dark:text-slate-400 py-3.5">#</TableHead>
          <TableHead className={commonClasses}>Parent Name</TableHead>
          <TableHead className={commonClasses}>Email</TableHead>
          <TableHead className={commonClasses}>Phone</TableHead>
          <TableHead className={commonClasses}>Occupation</TableHead>
          <TableHead className={commonClasses}>Status</TableHead>
          <TableHead className={`${commonClasses} text-right pr-4`}>Actions</TableHead>
        </>
      );
    case "classes":
      return (
        <>
          <TableHead className="w-10 py-3.5 pl-4">
            <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 size-3.5" />
          </TableHead>
          <TableHead className="w-12 text-xs font-semibold text-slate-500 dark:text-slate-400 py-3.5">#</TableHead>
          <TableHead className={commonClasses}>Class Name</TableHead>
          <TableHead className={commonClasses}>Grade / Section</TableHead>
          <TableHead className={`${commonClasses} text-center`}>Students</TableHead>
          <TableHead className={`${commonClasses} text-center`}>Capacity</TableHead>
          <TableHead className={`${commonClasses} text-right pr-4`}>Actions</TableHead>
        </>
      );
    case "fees":
      return (
        <>
          <TableHead className="w-10 py-3.5 pl-4">
            <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 size-3.5" />
          </TableHead>
          <TableHead className="w-12 text-xs font-semibold text-slate-500 dark:text-slate-400 py-3.5">#</TableHead>
          <TableHead className={commonClasses}>Student</TableHead>
          <TableHead className={commonClasses}>Fee Type</TableHead>
          <TableHead className={`${commonClasses} text-right`}>Amount</TableHead>
          <TableHead className={`${commonClasses} text-center`}>Status</TableHead>
          <TableHead className={`${commonClasses} text-right`}>Due Date</TableHead>
          <TableHead className={`${commonClasses} text-right pr-4`}>Actions</TableHead>
        </>
      );
    case "attendance":
      return (
        <>
          <TableHead className="w-10 py-3.5 pl-4">
            <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 size-3.5" />
          </TableHead>
          <TableHead className="w-12 text-xs font-semibold text-slate-500 dark:text-slate-400 py-3.5">#</TableHead>
          <TableHead className={commonClasses}>Student</TableHead>
          <TableHead className={commonClasses}>Class</TableHead>
          <TableHead className={commonClasses}>Date</TableHead>
          <TableHead className={`${commonClasses} text-center`}>Status</TableHead>
          <TableHead className={`${commonClasses} text-right pr-4`}>Actions</TableHead>
        </>
      );
    case "notices":
      return (
        <>
          <TableHead className="w-10 py-3.5 pl-4">
            <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 size-3.5" />
          </TableHead>
          <TableHead className="w-12 text-xs font-semibold text-slate-500 dark:text-slate-400 py-3.5">#</TableHead>
          <TableHead className={commonClasses}>Notice Title</TableHead>
          <TableHead className={commonClasses}>Author</TableHead>
          <TableHead className={commonClasses}>Target Role</TableHead>
          <TableHead className={`${commonClasses} text-center`}>Priority</TableHead>
          <TableHead className={`${commonClasses} text-right`}>Date</TableHead>
          <TableHead className={`${commonClasses} text-right pr-4`}>Actions</TableHead>
        </>
      );
  }
}

function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toLowerCase();
  if (s === "active" || s === "verified" || s === "enabled") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50">
        <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50">
      <span className="size-1.5 rounded-full bg-rose-500 shrink-0" />
      Inactive
    </span>
  );
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
];

export function TableCells({ activeTab, item, index = 0 }: { activeTab: TabType; item: any; index?: number }) {
  const cellClasses = "py-3 text-xs font-medium text-slate-700 dark:text-slate-300";
  const avatarBg = AVATAR_COLORS[index % AVATAR_COLORS.length];

  switch (activeTab) {
    case "students": {
      const s = item as Student;
      const initials = s.name ? s.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "ST";
      return (
        <>
          <TableCell className="w-10 py-3 pl-4">
            <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 size-3.5" />
          </TableCell>
          <TableCell className="w-12 py-3 text-xs font-semibold text-slate-400">
            {index + 1}
          </TableCell>
          <TableCell className={cellClasses}>
            <div className="flex items-center gap-2.5">
              <div className={`size-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${avatarBg}`}>
                {initials}
              </div>
              <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                {s.name}
              </span>
            </div>
          </TableCell>
          <TableCell className={`${cellClasses} font-mono text-[11px] text-slate-500`}>
            {s.rollNumber || `ADM${String(index + 1).padStart(3, '0')}`}
          </TableCell>
          <TableCell className={cellClasses}>
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              {s.className || `Class ${((index % 6) + 1)}`}
            </span>
          </TableCell>
          <TableCell className={cellClasses}>
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <UserCircle className="size-3.5 text-blue-500" />
              <span>{s.phone ? (s.gender === 'Female' ? 'Neha Patel' : 'Amit Verma') : 'Parent Name'}</span>
            </div>
          </TableCell>
          <TableCell className={cellClasses}>
            <StatusBadge status={s.status || "active"} />
          </TableCell>
          <TableCell className={`${cellClasses} text-slate-500`}>
            {format(new Date(Date.now() - index * 86400000 * 2), "MMM dd, yyyy")}
          </TableCell>
          <TableCell className="text-right pr-4 py-3">
            <button type="button" className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold px-1.5 py-0.5 rounded">
              •••
            </button>
          </TableCell>
        </>
      );
    }
    case "teachers": {
      const t = item as Teacher;
      const initials = t.name ? t.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "TR";
      return (
        <>
          <TableCell className="w-10 py-3 pl-4">
            <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 size-3.5" />
          </TableCell>
          <TableCell className="w-12 py-3 text-xs font-semibold text-slate-400">
            {index + 1}
          </TableCell>
          <TableCell className={cellClasses}>
            <div className="flex items-center gap-2.5">
              <div className={`size-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${avatarBg}`}>
                {initials}
              </div>
              <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                {t.name}
              </span>
            </div>
          </TableCell>
          <TableCell className={`${cellClasses} text-slate-600 dark:text-slate-400`}>{t.qualification}</TableCell>
          <TableCell className={`${cellClasses} text-slate-500`}>{t.experience}</TableCell>
          <TableCell className={cellClasses}>
            <div className="text-xs font-medium text-slate-800 dark:text-slate-200">{t.email}</div>
            <div className="text-[11px] text-slate-400">{t.phone}</div>
          </TableCell>
          <TableCell className={cellClasses}><StatusBadge status={t.status} /></TableCell>
          <TableCell className="text-right pr-4 py-3">
            <button type="button" className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold px-1.5 py-0.5 rounded">
              •••
            </button>
          </TableCell>
        </>
      );
    }
    case "parents": {
      const p = item as Parent;
      const initials = p.name ? p.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "PR";
      return (
        <>
          <TableCell className="w-10 py-3 pl-4">
            <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 size-3.5" />
          </TableCell>
          <TableCell className="w-12 py-3 text-xs font-semibold text-slate-400">
            {index + 1}
          </TableCell>
          <TableCell className={cellClasses}>
            <div className="flex items-center gap-2.5">
              <div className={`size-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${avatarBg}`}>
                {initials}
              </div>
              <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                {p.name}
              </span>
            </div>
          </TableCell>
          <TableCell className={`${cellClasses} text-slate-600 dark:text-slate-400`}>{p.email}</TableCell>
          <TableCell className={`${cellClasses} text-slate-500`}>{p.phone}</TableCell>
          <TableCell className={`${cellClasses} text-slate-600 dark:text-slate-400`}>{p.occupation}</TableCell>
          <TableCell className={cellClasses}><StatusBadge status={p.status} /></TableCell>
          <TableCell className="text-right pr-4 py-3">
            <button type="button" className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold px-1.5 py-0.5 rounded">
              •••
            </button>
          </TableCell>
        </>
      );
    }
    case "classes": {
      const c = item as Class;
      return (
        <>
          <TableCell className="w-10 py-3 pl-4">
            <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 size-3.5" />
          </TableCell>
          <TableCell className="w-12 py-3 text-xs font-semibold text-slate-400">
            {index + 1}
          </TableCell>
          <TableCell className={cellClasses}>
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold text-xs shrink-0">
                {c.name.charAt(0)}
              </div>
              <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                {c.name}
              </span>
            </div>
          </TableCell>
          <TableCell className={cellClasses}>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[11px] font-medium border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">Grade {c.grade}</Badge>
              <Badge variant="outline" className="text-[11px] font-medium border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">Sec {c.section}</Badge>
            </div>
          </TableCell>
          <TableCell className={`${cellClasses} text-center font-semibold text-purple-600`}>{c.studentCount}</TableCell>
          <TableCell className={`${cellClasses} text-center text-slate-500`}>{c.capacity}</TableCell>
          <TableCell className="text-right pr-4 py-3">
            <button type="button" className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold px-1.5 py-0.5 rounded">
              •••
            </button>
          </TableCell>
        </>
      );
    }
    case "fees": {
      const f = item as Fee;
      const getFeeColor = (st: string) => {
        if (st === "paid") return "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400";
        if (st === "overdue") return "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400";
        return "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400";
      };
      return (
        <>
          <TableCell className="w-10 py-3 pl-4">
            <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 size-3.5" />
          </TableCell>
          <TableCell className="w-12 py-3 text-xs font-semibold text-slate-400">
            {index + 1}
          </TableCell>
          <TableCell className={cellClasses}>
            <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
              <UserCircle className="size-4 text-slate-400" />
              {f.studentName}
            </div>
          </TableCell>
          <TableCell className={`${cellClasses} text-[11px] font-medium text-slate-500 uppercase tracking-wider`}>{f.type}</TableCell>
          <TableCell className={`${cellClasses} text-right font-semibold`}>
            <div className="flex items-center justify-end text-emerald-600">
              <IndianRupee className="size-3.5 mr-0.5" />
              {f.amount.toLocaleString()}
            </div>
          </TableCell>
          <TableCell className={`${cellClasses} text-center`}>
            <Badge variant="outline" className={`${getFeeColor(f.status)} capitalize font-medium text-[11px] px-2 py-0.5 rounded-full`}>
              {f.status}
            </Badge>
          </TableCell>
          <TableCell className={`${cellClasses} text-right text-xs text-slate-500`} suppressHydrationWarning>
            {format(new Date(f.dueDate), "dd MMM yyyy")}
          </TableCell>
          <TableCell className="text-right pr-4 py-3">
            <button type="button" className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold px-1.5 py-0.5 rounded">
              •••
            </button>
          </TableCell>
        </>
      );
    }
    case "attendance": {
      const a = item as Attendance;
      const getAttColor = (st: string) => {
        if (st === "present") return "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400";
        if (st === "absent") return "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400";
        return "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-400";
      };
      return (
        <>
          <TableCell className="w-10 py-3 pl-4">
            <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 size-3.5" />
          </TableCell>
          <TableCell className="w-12 py-3 text-xs font-semibold text-slate-400">
            {index + 1}
          </TableCell>
          <TableCell className={cellClasses}>
            <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">{a.studentName}</span>
          </TableCell>
          <TableCell className={cellClasses}>
            <Badge variant="secondary" className="text-[11px] font-medium border-none">{a.className}</Badge>
          </TableCell>
          <TableCell className={cellClasses} suppressHydrationWarning>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="size-3.5 text-slate-400" />
              {format(new Date(a.date), "dd MMM yyyy")}
            </div>
          </TableCell>
          <TableCell className={`${cellClasses} text-center`}>
            <Badge variant="outline" className={`${getAttColor(a.status)} capitalize font-medium text-[11px] px-2 py-0.5 rounded-full`}>
              {a.status}
            </Badge>
          </TableCell>
          <TableCell className="text-right pr-4 py-3">
            <button type="button" className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold px-1.5 py-0.5 rounded">
              •••
            </button>
          </TableCell>
        </>
      );
    }
    case "notices": {
      const n = item as Notice;
      const getPriorityColor = (p: string) => {
        if (p === "high") return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50";
        if (p === "medium") return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50";
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50";
      };
      return (
        <>
          <TableCell className="w-10 py-3 pl-4">
            <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 size-3.5" />
          </TableCell>
          <TableCell className="w-12 py-3 text-xs font-semibold text-slate-400">
            {index + 1}
          </TableCell>
          <TableCell className={cellClasses}>
            <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">{n.title}</div>
            <div className="text-[11px] text-slate-400 truncate max-w-[200px]">{n.content}</div>
          </TableCell>
          <TableCell className={`${cellClasses} text-slate-600 dark:text-slate-400`}>{n.authorName}</TableCell>
          <TableCell className={cellClasses}>
            <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider h-5 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400">
              {n.targetRole}
            </Badge>
          </TableCell>
          <TableCell className={`${cellClasses} text-center`}>
            <Badge variant="outline" className={`${getPriorityColor(n.priority)} font-medium text-[11px] px-2 py-0.5 rounded-full flex items-center justify-center gap-1 w-fit mx-auto capitalize`}>
              {n.priority === 'high' && <ShieldAlert className="size-3" />}
              {n.priority}
            </Badge>
          </TableCell>
          <TableCell className={`${cellClasses} text-right text-xs text-slate-500`} suppressHydrationWarning>
            {(() => {
              try {
                const date = new Date(n.createdAt);
                if (isNaN(date.getTime())) return "-";
                return format(date, "dd MMM yyyy");
              } catch {
                return "-";
              }
            })()}
          </TableCell>
          <TableCell className="text-right pr-4 py-3">
            <button type="button" className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold px-1.5 py-0.5 rounded">
              •••
            </button>
          </TableCell>
        </>
      );
    }
  }
}
