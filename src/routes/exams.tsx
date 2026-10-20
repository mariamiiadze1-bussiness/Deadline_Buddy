import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { CalendarDays, GraduationCap, Plus } from "lucide-react";
import { AppLayout } from "@/components/app/layout";
import { useDialogs } from "@/components/app/dialogs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCourses, useExams, useProfile, PREP_STATUSES } from "@/lib/data";
import { dayKey, diffDaysKey, formatDue } from "@/lib/dates";

export const Route = createFileRoute("/exams")({ component: ExamsPage });

function ExamsContent() {
  const examsQuery = useExams();
  const coursesQuery = useCourses();
  const profileQuery = useProfile();
  const { openExam } = useDialogs();
  const timezone = profileQuery.data?.timezone ?? "UTC";
  const today = dayKey(new Date(), timezone);
  const exams = examsQuery.data ?? [];
  const courses = coursesQuery.data ?? [];
  const courseNames = useMemo(() => new Map(courses.map((course) => [course.id, course.name])), [courses]);
  const now = Date.now();
  const upcoming = exams.filter((exam) => {
    const days = diffDaysKey(dayKey(exam.exam_at, timezone), today);
    return days > 0 || (days === 0 && (!exam.has_exam_time || new Date(exam.exam_at).getTime() >= now));
  }).sort((a, b) => a.exam_at.localeCompare(b.exam_at));
  const thisWeek = upcoming.filter((exam) => diffDaysKey(dayKey(exam.exam_at, timezone), today) <= 7).length;
  const needsPrep = upcoming.filter((exam) => exam.preparation_status !== "ready").length;
  const loading = examsQuery.isLoading || coursesQuery.isLoading;

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">EXAM TRACKER</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Upcoming Exams</h1>
          <p className="mt-2 text-muted-foreground">See what’s coming and how many days you have left to prepare.</p>
        </div>
        <Button onClick={() => openExam()}><Plus className="size-4" /> Add exam</Button>
      </header>

      {(examsQuery.error || coursesQuery.error) && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Your exams couldn’t be loaded. Refresh to try again.</p>
      )}

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Exam summary">
        {[
          { label: "Upcoming exams", value: upcoming.length },
          { label: "Within 7 days", value: thisWeek },
          { label: "Need preparation", value: needsPrep },
        ].map((item) => (
          <article key={item.label} className="card-surface flex items-center justify-between p-4">
            <span className="text-sm text-muted-foreground">{item.label}</span>
            <span className="text-2xl font-bold">{loading ? "—" : item.value}</span>
          </article>
        ))}
      </section>

      <section className="space-y-4" aria-label="Upcoming exams list">
        <div>
          <h2 className="text-xl font-semibold">Your exam schedule</h2>
          <p className="mt-1 text-sm text-muted-foreground">Countdowns use your profile timezone: {timezone}</p>
        </div>
        {loading ? (
          <div className="card-surface p-10 text-center text-sm text-muted-foreground">Loading your exams…</div>
        ) : upcoming.length === 0 ? (
          <div className="card-surface flex flex-col items-center gap-3 p-10 text-center">
            <CalendarDays className="size-9 text-muted-foreground" />
            <div>
              <p className="font-medium">No upcoming exams</p>
              <p className="mt-1 text-sm text-muted-foreground">Add an exam to start a countdown and keep track of preparation.</p>
            </div>
            <Button onClick={() => openExam()}><Plus className="size-4" /> Add your first exam</Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((exam) => {
              const days = diffDaysKey(dayKey(exam.exam_at, timezone), today);
              const prepLabel = PREP_STATUSES.find((status) => status.value === exam.preparation_status)?.label ?? exam.preparation_status;
              return (
                <li key={exam.id} className="card-surface flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-warning-soft text-warning"><GraduationCap className="size-5" /></span>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{exam.title}</h3>
                      <p className="mt-1 truncate text-sm text-muted-foreground">{exam.course_id ? courseNames.get(exam.course_id) ?? "Course" : "No course linked"}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{formatDue(exam.exam_at, exam.has_exam_time, timezone)}</p>
                    </div>
                  </div>
                  <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:justify-end">
                    <Badge variant={days <= 2 ? "destructive" : days <= 7 ? "default" : "secondary"} className="px-3 py-1.5 text-sm">
                      {days === 0 ? "Today" : days === 1 ? "1 day left" : `${days} days left`}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{prepLabel}</span>
                      <Button type="button" variant="outline" size="sm" onClick={() => openExam(exam)}>Edit</Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function ExamsPage() {
  return <AppLayout><ExamsContent /></AppLayout>;
}
