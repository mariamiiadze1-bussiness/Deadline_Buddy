import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { AppLayout } from "@/components/app/layout";
import { Button } from "@/components/ui/button";
import { useDialogs } from "@/components/app/dialogs";
import { useCourses, useExams, useProfile, useTasks, type Exam, type Task } from "@/lib/data";
import { addDaysKey, dayKey, formatDue, formatKey, weekdayOfKey } from "@/lib/dates";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendar")({ component: CalendarPage });

type EventItem =
  | { kind: "task"; id: string; title: string; iso: string; hasTime: boolean; courseId: string | null; status: string; source: Task }
  | { kind: "exam"; id: string; title: string; iso: string; hasTime: boolean; courseId: string | null; status: "exam"; source: Exam };

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function shiftMonth(month: string, amount: number): string {
  const [year, index] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, index - 1 + amount, 1));
  return date.toISOString().slice(0, 7);
}

function CalendarContent() {
  const taskQuery = useTasks();
  const examQuery = useExams();
  const courseQuery = useCourses();
  const profileQuery = useProfile();
  const { openTask, openExam } = useDialogs();
  const timezone = profileQuery.data?.timezone ?? "UTC";
  const weekStartsOn = profileQuery.data?.week_starts_on ?? 1;
  const today = dayKey(new Date(), timezone);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selectedDay, setSelectedDay] = useState(today);
  const tasks = taskQuery.data ?? [];
  const exams = examQuery.data ?? [];
  const courses = courseQuery.data ?? [];
  const courseNames = useMemo(() => new Map(courses.map((course) => [course.id, course.name])), [courses]);

  const events = useMemo<EventItem[]>(() => [
    ...tasks.map((task) => ({
      kind: "task" as const, id: task.id, title: task.title, iso: task.due_at,
      hasTime: task.has_due_time, courseId: task.course_id, status: task.status, source: task,
    })),
    ...exams.map((exam) => ({
      kind: "exam" as const, id: exam.id, title: exam.title, iso: exam.exam_at,
      hasTime: exam.has_exam_time, courseId: exam.course_id, status: "exam" as const, source: exam,
    })),
  ], [tasks, exams]);

  const eventsByDay = useMemo(() => {
    const grouped = new Map<string, EventItem[]>();
    for (const event of events) {
      const key = dayKey(event.iso, timezone);
      grouped.set(key, [...(grouped.get(key) ?? []), event]);
    }
    for (const dayEvents of grouped.values()) {
      dayEvents.sort((a, b) => a.iso.localeCompare(b.iso));
    }
    return grouped;
  }, [events, timezone]);

  const firstOfMonth = `${month}-01`;
  const offset = (weekdayOfKey(firstOfMonth) - weekStartsOn + 7) % 7;
  const gridStart = addDaysKey(firstOfMonth, -offset);
  const calendarDays = Array.from({ length: 42 }, (_, index) => addDaysKey(gridStart, index));
  const weekdayLabels = Array.from({ length: 7 }, (_, index) => WEEKDAYS[(weekStartsOn + index) % 7]);
  const selectedEvents = eventsByDay.get(selectedDay) ?? [];
  const isLoading = taskQuery.isLoading || examQuery.isLoading || courseQuery.isLoading;
  const loadError = taskQuery.error || examQuery.error || courseQuery.error;

  const changeMonth = (amount: number) => {
    const next = shiftMonth(month, amount);
    setMonth(next);
    setSelectedDay(`${next}-01`);
  };

  return (
    <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">YOUR SCHEDULE</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Calendar</h1>
            <p className="mt-2 text-muted-foreground">Tasks and exams, shown in your local timezone.</p>
          </div>
          <Button onClick={() => openTask({ dateKey: selectedDay })}><Plus className="size-4" /> Add task</Button>
        </header>

        {loadError && <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Your calendar items couldn’t be loaded. Refresh to try again.</p>}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
          <section className="card-surface p-4 sm:p-6" aria-label="Monthly calendar">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{formatKey(firstOfMonth, { month: "long", year: "numeric" })}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{timezone}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" aria-label="Previous month" onClick={() => changeMonth(-1)}><ChevronLeft className="size-4" /></Button>
                <Button variant="outline" onClick={() => { setMonth(today.slice(0, 7)); setSelectedDay(today); }}>Today</Button>
                <Button variant="outline" size="icon" aria-label="Next month" onClick={() => changeMonth(1)}><ChevronRight className="size-4" /></Button>
              </div>
            </div>

            {isLoading ? (
              <p className="py-16 text-center text-sm text-muted-foreground">Loading your calendar…</p>
            ) : (
              <div className="grid grid-cols-7 border-l border-t">
                {weekdayLabels.map((label) => <div key={label} className="border-b border-r bg-muted/40 py-2 text-center text-xs font-medium text-muted-foreground sm:text-sm">{label}</div>)}
                {calendarDays.map((date) => {
                  const dayEvents = eventsByDay.get(date) ?? [];
                  const inMonth = date.slice(0, 7) === month;
                  return (
                    <button key={date} type="button" onClick={() => setSelectedDay(date)}
                      aria-label={`${formatKey(date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}, ${dayEvents.length} items`}
                      aria-pressed={selectedDay === date}
                      className={cn("min-h-20 border-b border-r p-1.5 text-left transition-colors hover:bg-accent/60 sm:min-h-28 sm:p-2",
                        !inMonth && "bg-muted/20 text-muted-foreground",
                        selectedDay === date && "bg-primary/5 ring-2 ring-inset ring-primary",
                      )}>
                      <span className={cn("inline-flex size-7 items-center justify-center rounded-full text-xs font-medium sm:size-8 sm:text-sm",
                        date === today && "bg-primary text-primary-foreground",
                        date !== today && !inMonth && "opacity-60",
                      )}>{Number(date.slice(-2))}</span>
                      <span className="mt-1 flex flex-col gap-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <span key={`${event.kind}-${event.id}`} className={cn("hidden truncate rounded px-1.5 py-0.5 text-[11px] sm:block",
                            event.kind === "exam" ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200" :
                            event.status === "completed" ? "bg-muted text-muted-foreground line-through" : "bg-primary/10 text-primary",
                          )}>{event.kind === "exam" ? "Exam · " : ""}{event.title}</span>
                        ))}
                        {dayEvents.length > 2 && <span className="hidden px-1 text-[10px] text-muted-foreground sm:block">+{dayEvents.length - 2} more</span>}
                        {dayEvents.length > 0 && <span className="flex gap-1 px-1 sm:hidden"><span className="size-1.5 rounded-full bg-primary" />{dayEvents.some((event) => event.kind === "exam") && <span className="size-1.5 rounded-full bg-amber-500" />}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="card-surface p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{formatKey(selectedDay, { weekday: "long", month: "long", day: "numeric" })}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{selectedEvents.length} {selectedEvents.length === 1 ? "item" : "items"}</p>
              </div>
              <CalendarDays className="size-5 text-muted-foreground" />
            </div>
            {selectedEvents.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">Nothing scheduled for this day.</p>
                <Button variant="link" className="mt-2" onClick={() => openTask({ dateKey: selectedDay })}>Add a task</Button>
              </div>
            ) : (
              <ul className="divide-y">
                {selectedEvents.map((event) => (
                  <li key={`${event.kind}-${event.id}`} className="py-3 first:pt-0 last:pb-0">
                    <button type="button" onClick={() => event.kind === "task" ? openTask(event.source) : openExam(event.source)}
                      className="w-full rounded-md text-left hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <span className="flex items-center gap-2">
                        <span className={cn("size-2 shrink-0 rounded-full", event.kind === "exam" ? "bg-amber-500" : event.status === "completed" ? "bg-muted-foreground" : "bg-primary")} />
                        <span className={cn("truncate font-medium", event.status === "completed" && "text-muted-foreground line-through")}>{event.kind === "exam" ? "Exam: " : ""}{event.title}</span>
                      </span>
                      <span className="mt-1 block pl-4 text-sm text-muted-foreground">
                        {event.hasTime ? formatDue(event.iso, true, timezone) : event.kind === "exam" ? "All day exam" : "Due all day"}
                        {event.courseId ? ` · ${courseNames.get(event.courseId) ?? "Course"}` : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
        <p className="text-xs text-muted-foreground">Select a date to see its schedule. Choose an item to edit it.</p>
      </div>

  );
}

function CalendarPage() {
  return <AppLayout><CalendarContent /></AppLayout>;
}
