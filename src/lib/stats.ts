import { addDaysKey, dayKey, isOverdue, startOfWeekKey } from "./dates";

type T = { status: string; due_at: string; has_due_time: boolean; completed_at: string | null; course_id: string | null };

/** Dashboard + progress numbers, all derived from the student's task rows. */
export function computeStats(tasks: T[], tz: string, weekStartsOn: number, now: Date = new Date()) {
  const today = dayKey(now, tz);
  const weekStart = startOfWeekKey(today, weekStartsOn);
  const weekEnd = addDaysKey(weekStart, 6);
  const inWeek = (k: string) => k >= weekStart && k <= weekEnd;
  const open = tasks.filter((t) => t.status !== "completed");

  const dueToday = open.filter((t) => dayKey(t.due_at, tz) === today && !isOverdue(t.due_at, tz, t.has_due_time, now)).length;
  const overdue = open.filter((t) => isOverdue(t.due_at, tz, t.has_due_time, now)).length;
  const upcoming = open.filter((t) => {
    const k = dayKey(t.due_at, tz);
    return k > today && k <= addDaysKey(today, 7);
  }).length;
  const completedThisWeek = tasks.filter((t) => t.completed_at && inWeek(dayKey(t.completed_at, tz))).length;

  // Weekly progress: tasks due this week, completed vs total.
  const weekTasks = tasks.filter((t) => inWeek(dayKey(t.due_at, tz)));
  const weekDone = weekTasks.filter((t) => t.status === "completed").length;
  const weekPct = weekTasks.length ? Math.round((weekDone / weekTasks.length) * 100) : 0;

  const totalCompleted = tasks.filter((t) => t.status === "completed").length;
  // Completion rate: completed tasks / all tasks (all time).
  const completionRate = tasks.length ? Math.round((totalCompleted / tasks.length) * 100) : 0;

  return { today, weekStart, weekEnd, dueToday, overdue, upcoming, completedThisWeek, weekTotal: weekTasks.length, weekDone, weekPct, totalCompleted, completionRate };
}
