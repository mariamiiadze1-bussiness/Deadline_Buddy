import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { BookOpenCheck, CalendarClock, Download, FileText, Lightbulb, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/app/layout";
import { useDialogs } from "@/components/app/dialogs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useCourses, useProfile, useTasks, type Task } from "@/lib/data";
import { addDaysKey, dayKey, diffDaysKey, formatKey, formatDue } from "@/lib/dates";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE } from "@/lib/demo-mode";

export const Route = createFileRoute("/planner")({ component: PlannerPage });

const BUCKET = "syllabi";
type StoredFile = { id: string; name: string; created_at: string; metadata: Record<string, unknown> | null };
type Suggestion = {
  id: string;
  title: string;
  detail: string;
  courseId: string | null;
  dateKey: string;
  taskType: Task["task_type"];
  priority: Task["priority"];
  kind: "deadline" | "lecture" | "prep";
};

function PlannerContent() {
  const { user } = useAuth();
  const { openTask } = useDialogs();
  const tasksQuery = useTasks();
  const coursesQuery = useCourses();
  const profileQuery = useProfile();
  const timezone = profileQuery.data?.timezone ?? "UTC";
  const tasks = tasksQuery.data ?? [];
  const courses = coursesQuery.data ?? [];
  const courseById = useMemo(() => new Map(courses.map((course) => [course.id, course])), [courses]);
  const filesQuery = useQuery({
    queryKey: ["syllabi", user?.id],
    enabled: !!user && !DEMO_MODE,
    queryFn: async () => {
      if (DEMO_MODE) return [];
      const { data, error } = await supabase.storage.from(BUCKET).list(user!.id, {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      });
      if (error) throw error;
      return (data ?? []).filter((file) => file.id).map((file) => ({
        id: file.id!,
        name: file.name,
        created_at: file.created_at ?? "",
        metadata: file.metadata as Record<string, unknown> | null,
      })) as StoredFile[];
    },
  });
  const today = dayKey(new Date(), timezone);
  const files = filesQuery.data ?? [];
  const suggestions = useMemo(() => buildSuggestions(files, tasks, today, timezone, new Map(courses.map((course) => [course.id, course.name]))), [files, tasks, today, timezone, courses]);
  const linkedCourseIds = new Set(files.map((file) => file.metadata?.course_id).filter((id): id is string => typeof id === "string"));
  const upcoming = tasks.filter((task) => {
    if (task.status === "completed") return false;
    const days = diffDaysKey(dayKey(task.due_at, timezone), today);
    return days >= 0 && days <= 14;
  }).sort((a, b) => a.due_at.localeCompare(b.due_at));

  const downloadSyllabus = async (file: StoredFile) => {
    if (!user) return;
    try {
      const { data, error } = await supabase.storage.from(BUCKET).download(`${user.id}/${file.name}`);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = String(file.metadata?.original_name ?? file.name.replace(/^[0-9a-f-]{36}-/, ""));
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      toast.error((error as Error).message || "The syllabus could not be downloaded.");
    }
  };

  const loading = tasksQuery.isLoading || coursesQuery.isLoading || filesQuery.isLoading;

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">PLAN AHEAD</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Study Planner</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Connect course syllabi to your task list, spot upcoming deadlines, and plan lecture follow-ups.</p>
        </div>
        <Button asChild variant="outline"><Link to="/syllabus"><Upload className="size-4" /> Manage syllabi</Link></Button>
      </header>

      {(tasksQuery.error || coursesQuery.error || filesQuery.error) && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Some planner data couldn’t be loaded. Check your connection and refresh.
        </p>
      )}

      <section className="space-y-4" aria-label="Linked syllabi">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Syllabi and courses</h2>
            <p className="mt-1 text-sm text-muted-foreground">Syllabi linked to a course are matched with that course’s tasks.</p>
          </div>
          <Badge variant="secondary">{files.length} {files.length === 1 ? "syllabus" : "syllabi"}</Badge>
        </div>
        {loading ? (
          <div className="card-surface p-8 text-center text-sm text-muted-foreground">Loading your study plan…</div>
        ) : files.length === 0 ? (
          <div className="card-surface flex flex-col items-center gap-3 p-8 text-center">
            <FileText className="size-8 text-muted-foreground" />
            <div>
              <p className="font-medium">No syllabus linked yet</p>
              <p className="mt-1 text-sm text-muted-foreground">{DEMO_MODE ? "Syllabus uploads need Supabase setup. Your courses and tasks are available in this local demo." : "Upload a syllabus and attach it to a course to get course-specific planning suggestions."}</p>
            </div>
            <Button asChild><Link to="/syllabus"><Upload className="size-4" /> Upload syllabus</Link></Button>
          </div>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {files.map((file) => {
              const courseId = typeof file.metadata?.course_id === "string" ? file.metadata.course_id : null;
              const course = courseId ? courseById.get(courseId) : undefined;
              const name = String(file.metadata?.original_name ?? file.name.replace(/^[0-9a-f-]{36}-/, ""));
              const courseTasks = courseId ? tasks.filter((task) => task.course_id === courseId) : [];
              return (
                <li key={file.id} className="card-surface flex min-w-0 items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary"><BookOpenCheck className="size-5" /></span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{name}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{course?.name ?? (courseId ? "Course unavailable" : "General syllabus")} · {courseTasks.length} {courseTasks.length === 1 ? "task" : "tasks"}</p>
                    </div>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => void downloadSyllabus(file)} aria-label={`Download ${name}`}><Download className="size-4" /> Open</Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4" aria-label="Planner suggestions">
          <div>
            <h2 className="text-xl font-semibold">Suggested next steps</h2>
            <p className="mt-1 text-sm text-muted-foreground">Add a suggestion to your tasks with its course and proposed due date filled in.</p>
          </div>
          {loading ? <div className="card-surface p-6 text-sm text-muted-foreground">Finding planning opportunities…</div> : suggestions.length === 0 ? (
            <div className="card-surface p-6 text-sm text-muted-foreground">No suggestions right now. Add a course syllabus or upcoming task to build your plan.</div>
          ) : (
            <ul className="space-y-3">
              {suggestions.map((suggestion) => (
                <li key={suggestion.id} className="card-surface flex items-start gap-3 p-4">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                    {suggestion.kind === "prep" ? <CalendarClock className="size-4" /> : <Lightbulb className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{suggestion.title}</p>
                      <Badge variant="outline">{suggestion.kind === "prep" ? "Upcoming" : suggestion.kind === "lecture" ? "Lecture follow-up" : "Syllabus check"}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{suggestion.detail}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Suggested date: {formatKey(suggestion.dateKey, { month: "short", day: "numeric", year: "numeric" })}</p>
                    <Button type="button" size="sm" className="mt-3" onClick={() => openTask({
                      title: suggestion.title,
                      course_id: suggestion.courseId,
                      task_type: suggestion.taskType,
                      priority: suggestion.priority,
                      status: "todo",
                      dateKey: suggestion.dateKey,
                    })}><Plus className="size-4" /> Add to tasks</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">Suggestions are planning prompts based on your linked courses and task list. Syllabus files are not automatically parsed, so confirm dates in the document before adding them.</p>
        </div>

        <div className="space-y-4" aria-label="Upcoming task deadlines">
          <div>
            <h2 className="text-xl font-semibold">Due in the next 14 days</h2>
            <p className="mt-1 text-sm text-muted-foreground">Open tasks already connected to your schedule.</p>
          </div>
          {loading ? <div className="card-surface p-6 text-sm text-muted-foreground">Loading deadlines…</div> : upcoming.length === 0 ? (
            <div className="card-surface p-6 text-sm text-muted-foreground">No open deadlines in the next two weeks.</div>
          ) : (
            <ul className="card-surface divide-y px-4">
              {upcoming.map((task) => {
                const course = task.course_id ? courseById.get(task.course_id) : undefined;
                const days = diffDaysKey(dayKey(task.due_at, timezone), today);
                const hasPrep = tasks.some((item) => item.id !== task.id && item.status !== "completed" && item.course_id === task.course_id && /prepare for/i.test(item.title) && item.title.toLowerCase().includes(task.title.toLowerCase()));
                return (
                  <li key={task.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{task.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{course?.name ?? "No course"} · {formatDue(task.due_at, task.has_due_time, timezone)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={days <= 2 ? "destructive" : "secondary"}>{days === 0 ? "Due today" : days === 1 ? "Tomorrow" : `${days} days`}</Badge>
                      {!hasPrep && <Button type="button" variant="ghost" size="sm" onClick={() => openTask({
                        title: `Prepare for ${task.title}`,
                        course_id: task.course_id,
                        task_type: "exam_prep",
                        priority: task.priority,
                        status: "todo",
                        dateKey: days > 0 ? addDaysKey(dayKey(task.due_at, timezone), -1) : today,
                      })}><Plus className="size-4" /> Plan prep</Button>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {files.length > 0 && linkedCourseIds.size === 0 && (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Your syllabus files aren’t linked to courses yet. Edit the course selection on the Syllabus page to get tailored suggestions.</p>
      )}
    </div>
  );
}

function buildSuggestions(files: StoredFile[], tasks: Task[], today: string, timezone: string, courseNames: Map<string, string>): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const linkedCourseIds = [...new Set(files.map((file) => file.metadata?.course_id).filter((id): id is string => typeof id === "string"))];

  for (const courseId of linkedCourseIds) {
    if (!courseNames.has(courseId)) continue;
    const courseTasks = tasks.filter((task) => task.course_id === courseId);
    const openTasks = courseTasks.filter((task) => task.status !== "completed");
    const courseName = courseNames.get(courseId) ?? "this course";
    const hasFutureDeadline = openTasks.some((task) => diffDaysKey(dayKey(task.due_at, timezone), today) >= 0);
    const hasDeadlineReview = openTasks.some((task) => /syllabus|upcoming deadline/i.test(`${task.title} ${task.description ?? ""}`));
    if (!hasFutureDeadline && !hasDeadlineReview) {
      suggestions.push({
        id: `deadline-${courseId}`,
        title: `Check upcoming deadlines — ${courseName}`,
        detail: "This course has a linked syllabus but no upcoming open tasks. Check the document and capture any due dates.",
        courseId,
        dateKey: addDaysKey(today, 3),
        taskType: "assignment",
        priority: "high",
        kind: "deadline",
      });
    }

    const hasLectureFollowUp = openTasks.some((task) => /lecture|notes|reading update/i.test(`${task.title} ${task.description ?? ""}`));
    if (!hasLectureFollowUp) {
      suggestions.push({
        id: `lecture-${courseId}`,
        title: `Review and update lecture notes — ${courseName}`,
        detail: "A light course follow-up to keep lecture notes aligned with the syllabus and recent classes.",
        courseId,
        dateKey: addDaysKey(today, 7),
        taskType: "reading",
        priority: "medium",
        kind: "lecture",
      });
    }
  }

  const soon = tasks.filter((task) => {
    const days = diffDaysKey(dayKey(task.due_at, timezone), today);
    return task.status !== "completed" && days >= 1 && days <= 7;
  }).sort((a, b) => a.due_at.localeCompare(b.due_at));
  for (const task of soon) {
    const hasPrep = tasks.some((item) => item.id !== task.id && item.status !== "completed" && item.course_id === task.course_id && /prepare for/i.test(item.title) && item.title.toLowerCase().includes(task.title.toLowerCase()));
    if (hasPrep) continue;
    const days = diffDaysKey(dayKey(task.due_at, timezone), today);
    suggestions.push({
      id: `prep-${task.id}`,
      title: `Start preparing — ${task.title}`,
      detail: `This task is due in ${days} ${days === 1 ? "day" : "days"}. Add a preparation reminder before the deadline.`,
      courseId: task.course_id,
      dateKey: addDaysKey(dayKey(task.due_at, timezone), -1),
      taskType: "exam_prep",
      priority: task.priority,
      kind: "prep",
    });
  }

  return suggestions.slice(0, 8);
}

function PlannerPage() {
  return <AppLayout><PlannerContent /></AppLayout>;
}
