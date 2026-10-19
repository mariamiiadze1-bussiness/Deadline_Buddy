// Timezone-aware date helpers. All timestamps are stored in UTC; display and
// day-bucketing use the student's configured IANA time zone.

export function dayKey(d: Date | string, tz: string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function timeKey(d: Date | string, tz: string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function tzOffsetMs(date: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const g = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), g("second"));
  return asUtc - date.getTime();
}

/** Convert a wall-clock date ("YYYY-MM-DD") + time ("HH:mm") in tz to a UTC Date. */
export function zonedToUtc(dateStr: string, timeStr: string, tz: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = (timeStr || "00:00").split(":").map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm));
  const off1 = tzOffsetMs(guess, tz);
  const first = new Date(guess.getTime() - off1);
  const off2 = tzOffsetMs(first, tz);
  return off1 === off2 ? first : new Date(guess.getTime() - off2);
}

/** Add n days to a "YYYY-MM-DD" key. */
export function addDaysKey(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

export function diffDaysKey(a: string, b: string): number {
  const pa = Date.UTC(...(a.split("-").map(Number).map((v, i) => (i === 1 ? v - 1 : v)) as [number, number, number]));
  const pb = Date.UTC(...(b.split("-").map(Number).map((v, i) => (i === 1 ? v - 1 : v)) as [number, number, number]));
  return Math.round((pa - pb) / 86400000);
}

/** Weekday of a day key, 0 = Sunday. */
export function weekdayOfKey(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function startOfWeekKey(key: string, weekStartsOn: number): string {
  const wd = weekdayOfKey(key);
  const back = (wd - weekStartsOn + 7) % 7;
  return addDaysKey(key, -back);
}

export function formatKey(key: string, opts: Intl.DateTimeFormatOptions): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { ...opts, timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d, 12)));
}

export function formatDue(iso: string, hasTime: boolean, tz: string): string {
  const date = new Date(iso);
  const opts: Intl.DateTimeFormatOptions = { timeZone: tz, month: "short", day: "numeric" };
  if (hasTime) Object.assign(opts, { hour: "numeric", minute: "2-digit" });
  return new Intl.DateTimeFormat("en-US", opts).format(date);
}

export type DeadlineTone = "overdue" | "today" | "soon" | "later" | "done";

/** Human deadline label like "Due today", "Due in 3 days", "Overdue". */
export function deadlineInfo(
  iso: string,
  tz: string,
  completed = false,
  now: Date = new Date(),
  hasTime = false,
): { label: string; tone: DeadlineTone } {
  if (completed) return { label: "Completed", tone: "done" };
  const due = new Date(iso);
  const diff = diffDaysKey(dayKey(due, tz), dayKey(now, tz));
  if (diff < 0 || (hasTime && due < now)) return { label: "Overdue", tone: "overdue" };
  if (diff === 0) return { label: "Due today", tone: "today" };
  if (diff === 1) return { label: "Due tomorrow", tone: "soon" };
  if (diff <= 3) return { label: `Due in ${diff} days`, tone: "soon" };
  return { label: `Due in ${diff} days`, tone: "later" };
}

export function isOverdue(iso: string, tz: string, hasTime: boolean, now: Date = new Date()): boolean {
  return deadlineInfo(iso, tz, false, now, hasTime).tone === "overdue";
}

export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function greeting(tz: string, now: Date = new Date()): string {
  const h = Number(timeKey(now, tz).slice(0, 2));
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
