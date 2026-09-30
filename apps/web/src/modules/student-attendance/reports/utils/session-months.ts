export interface SessionMonthOption {
  label: string; // e.g. "April 2026"
  shortLabel: string; // e.g. "Apr 2026"
  value: string; // e.g. "2026-04"
  from: string; // e.g. "2026-04-01"
  to: string; // e.g. "2026-04-30"
  year: number;
  month: number;
}

export interface QuickFillPreset {
  label: string;
  from: string;
  to: string;
}

export function parseYears(str?: string | null): { startYear: number; endYear: number } {
  const match = (str || "").match(/(\d{4})(?:-(\d{2,4}))?/);
  if (match) {
    const y1 = parseInt(match[1], 10);
    let y2 = y1 + 1;
    if (match[2]) {
      const raw2 = parseInt(match[2], 10);
      y2 = raw2 < 100 ? Math.floor(y1 / 100) * 100 + raw2 : raw2;
    }
    return { startYear: y1, endYear: y2 };
  }
  const now = new Date();
  const y = now.getFullYear();
  return { startYear: y, endYear: y + 1 };
}

export function getSessionMonthsAndPresets(
  activeYear?: { startDate?: string | null; endDate?: string | null; name?: string | null } | null,
  yearSlug?: string | null,
  pathname?: string | null
): {
  sessionMonths: SessionMonthOption[];
  quickFillPresets: QuickFillPreset[];
  sessionStartDate: string;
  sessionEndDate: string;
} {
  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const SHORT_MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sept", "Oct", "Nov", "Dec",
  ];

  let startYear: number;
  let startMonth: number;
  let endYear: number;
  let endMonth: number;
  let sessionStartDate: string;
  let sessionEndDate: string;

  const sMatch = (activeYear?.startDate || "").match(/^(\d{4})-(\d{2})/);
  const eMatch = (activeYear?.endDate || "").match(/^(\d{4})-(\d{2})/);

  if (sMatch && eMatch) {
    startYear = parseInt(sMatch[1], 10);
    startMonth = parseInt(sMatch[2], 10);
    endYear = parseInt(eMatch[1], 10);
    endMonth = parseInt(eMatch[2], 10);
    sessionStartDate = activeYear!.startDate!.slice(0, 10);
    sessionEndDate = activeYear!.endDate!.slice(0, 10);
  } else {
    const parsed = parseYears(activeYear?.name || yearSlug || pathname);
    startYear = parsed.startYear;
    startMonth = 4;
    endYear = parsed.endYear;
    endMonth = 3;
    sessionStartDate = `${startYear}-04-01`;
    sessionEndDate = `${endYear}-03-31`;
  }

  const sessionMonths: SessionMonthOption[] = [];
  let curY = startYear;
  let curM = startMonth;
  let safety = 0;

  while (
    (curY < endYear || (curY === endYear && curM <= endMonth)) &&
    safety < 48
  ) {
    const val = `${curY}-${String(curM).padStart(2, "0")}`;
    const daysInMonth = new Date(curY, curM, 0).getDate();
    const from = `${val}-01`;
    const to = `${val}-${String(daysInMonth).padStart(2, "0")}`;
    const label = `${MONTH_NAMES[curM - 1]} ${curY}`;
    const shortLabel = `${SHORT_MONTH_NAMES[curM - 1]} ${curY}`;

    sessionMonths.push({
      label,
      shortLabel,
      value: val,
      from,
      to,
      year: curY,
      month: curM,
    });

    curM++;
    if (curM > 12) {
      curM = 1;
      curY++;
    }
    safety++;
  }

  const quickFillPresets: QuickFillPreset[] = [
    { label: "Full session", from: sessionStartDate, to: sessionEndDate },
    ...sessionMonths.map((m) => ({
      label: m.shortLabel,
      from: m.from,
      to: m.to,
    })),
  ];

  return { sessionMonths, quickFillPresets, sessionStartDate, sessionEndDate };
}
