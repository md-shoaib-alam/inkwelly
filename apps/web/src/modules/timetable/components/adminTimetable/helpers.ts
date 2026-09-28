import { SUBJECT_COLORS, SUBJECT_DOT_COLORS } from "./constants";

function getSubjectColorIndex(
  uniqueSubjects: string[],
  subject: string,
): number {
  const idx = uniqueSubjects.indexOf(subject);
  return idx >= 0 ? idx : 0;
}

export function getCurrentDayIndex(days: string[]): number {
  const jsDay = new Date().getDay(); // 0 = Sunday, 1 = Monday ...
  const dayMap: Record<number, string> = {
    0: "sunday",
    1: "monday",
    2: "tuesday",
    3: "wednesday",
    4: "thursday",
    5: "friday",
    6: "saturday",
  };
  const todayKey = dayMap[jsDay];
  return days.indexOf(todayKey);
}

export function isCurrentPeriod(start: string, end: string): boolean {
  const now = new Date();
  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);
  const startMin = startH * 60 + (startM ?? 0);
  const endMin = endH * 60 + (endM ?? 0);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return nowMin >= startMin && nowMin < endMin;
}

export function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h ?? "0", 10);
  const min = m ?? "00";
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${min} ${ampm}`;
}

export function getSubjectBadgeClass(
  subject: string,
  uniqueSubjects: string[],
): string {
  const idx = getSubjectColorIndex(uniqueSubjects, subject);
  return SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
}

export function getSubjectDotClass(
  subject: string,
  uniqueSubjects: string[],
): string {
  const idx = getSubjectColorIndex(uniqueSubjects, subject);
  return SUBJECT_DOT_COLORS[idx % SUBJECT_DOT_COLORS.length];
}
