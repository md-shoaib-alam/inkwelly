import { CalendarEvent } from "./types";

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function formatDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isSameDay(d1: string | Date, d2: string | Date): boolean {
  const a = typeof d1 === "string" ? d1 : formatDateISO(d1);
  const b = typeof d2 === "string" ? d2 : formatDateISO(d2);
  return a === b;
}

export function isToday(dateStr: string): boolean {
  return isSameDay(dateStr, new Date());
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function eventFallsOnDate(ev: CalendarEvent, dayStr: string): boolean {
  if (ev.date === dayStr) return true;
  if (ev.endDate && ev.endDate >= dayStr && ev.date <= dayStr) return true;
  return false;
}
