import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, CalendarDays, CheckCircle2, ListChecks } from "lucide-react";
import { AppLayout } from "@/components/app/layout";
import { DeadlineBadge, PriorityBadge } from "@/components/app/bits";
import { useCourses, useExams, useProfile, useTasks } from "@/lib/data";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

const STATS = [
  { label: "Open tasks", icon: ListChecks },
  { label: "Courses", icon: BookOpen },
  { label: "Upcoming exams", icon: CalendarDays },
  { label: "Completed", icon: CheckCircle2 },
];

function Dashboard() {
  const tasksQuery = useTasks();
  const coursesQuery = useCourses();
  const examsQuery = useExams();
  const { data: profile } = useProfile();
  const tasks = tasksQuery.data ?? [];
  const courses = coursesQuery.data ?? [];
  const exams = examsQuery.data ?? [];
  const openTasks = tasks.filter((task) => task.status !== "completed");
  const upcomingTasks = [...openTasks].sort((a, b) => a.due_at.localeCompare(b.due_at)).slice(0, 5);
  const upcomingExams = [...exams].sort((a, b) => a.exam_at.localeCompare(b.exam_at)).slice(0, 3);
  const courseNames = new Map(courses.map((course) => [course.id, course.name]));
  const values = [openTasks.length, courses.length, upcomingExams.length, tasks.length - openTasks.length];
  const loading = tasksQuery.isLoading || coursesQuery.isLoading || examsQuery.isLoading;
  const timezone = profile?.timezone ?? "UTC";

  return (
    <AppLayout>
      <div className="space-y-8">
        <header>
          <p className="text-sm font-medium text-primary">STUDYFLOW HOME</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Welcome, {profile?.full_name || "Guest"}</h1>
          <p className="mt-2 text-muted-foreground">Here’s your current study plan at a glance.</p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Study overview">
          {STATS.map(({ label, icon: Icon }, index) => (
            <article key={label} className="card-surface flex items-center gap-4 p-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary"><Icon className="size-5" /></span>
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">{loading ? "—" : values[index]}</p>
              </div>
            </article>
          ))}
        </section>

        {tasksQuery.error && <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Your tasks couldn’t be loaded. Refresh to try again.</p>}

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className="card-surface p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Next up</h2>
                <p className="mt-1 text-sm text-muted-foreground">Your nearest deadlines</p>
              </div>
              <ListChecks className="size-5 text-muted-foreground" />
            </div>
            {loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading your plan…</p>
            ) : upcomingTasks.length === 0 ? (
              <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No open tasks yet. Add one from the sidebar to get started.</p>
            ) : (
              <ul className="divide-y">
                {upcomingTasks.map((task) => (
                  <li key={task.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{task.title}</p>
                      <p className="mt-1 truncate text-sm text-muted-foreground">{task.course_id ? courseNames.get(task.course_id) ?? "Course" : "No course"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <PriorityBadge p={task.priority} />
                      <DeadlineBadge iso={task.due_at} tz={timezone} hasTime={task.has_due_time} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card-surface p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Upcoming exams</h2>
                <p className="mt-1 text-sm text-muted-foreground">Prepare ahead of time</p>
              </div>
              <CalendarDays className="size-5 text-muted-foreground" />
            </div>
            {loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading your exams…</p>
            ) : upcomingExams.length === 0 ? (
              <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No upcoming exams planned.</p>
            ) : (
              <ul className="divide-y">
                {upcomingExams.map((exam) => (
                  <li key={exam.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{exam.title}</p>
                      <p className="mt-1 truncate text-sm text-muted-foreground">{exam.course_id ? courseNames.get(exam.course_id) ?? "Course" : "No course"}</p>
                    </div>
                    <DeadlineBadge iso={exam.exam_at} tz={timezone} hasTime={exam.has_exam_time} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section>
          <h2 className="mb-3 font-semibold">Your courses</h2>
          {loading ? (
            <p className="py-6 text-sm text-muted-foreground">Loading your courses…</p>
          ) : courses.length === 0 ? (
            <p className="card-surface p-6 text-sm text-muted-foreground">No courses yet. Add your first course to organize related deadlines.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <li key={course.id} className="card-surface flex items-center gap-3 p-4">
                  <span className="size-3 rounded-full" style={{ backgroundColor: course.color }} />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{course.name}</p>
                    {course.course_code && <p className="text-sm text-muted-foreground">{course.course_code}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppLayout>
  );
}