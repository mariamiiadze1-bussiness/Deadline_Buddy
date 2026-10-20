import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, Circle, ListChecks, Pencil, Plus, Search } from "lucide-react";
import { AppLayout } from "@/components/app/layout";
import { useDialogs } from "@/components/app/dialogs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CourseDot, DeadlineBadge, EmptyState, PriorityBadge } from "@/components/app/bits";
import { PRIORITIES, STATUSES, useCourses, useProfile, useTasks, useToggleTask, type Task } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tasks")({ component: TasksPage });

const ALL = "all";

function TasksContent() {
  const tasksQuery = useTasks();
  const coursesQuery = useCourses();
  const profileQuery = useProfile();
  const toggleTask = useToggleTask();
  const { openTask } = useDialogs();
  const [progress, setProgress] = useState(ALL);
  const [priority, setPriority] = useState(ALL);
  const [search, setSearch] = useState("");
  const tasks = tasksQuery.data ?? [];
  const courses = coursesQuery.data ?? [];
  const timezone = profileQuery.data?.timezone ?? "UTC";
  const courseById = useMemo(() => new Map(courses.map((course) => [course.id, course])), [courses]);

  const visibleTasks = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesProgress = progress === ALL || task.status === progress;
      const matchesPriority = priority === ALL || task.priority === priority;
      const course = task.course_id ? courseById.get(task.course_id) : undefined;
      const matchesSearch = !needle || [task.title, task.description ?? "", course?.name ?? ""].join(" ").toLowerCase().includes(needle);
      return matchesProgress && matchesPriority && matchesSearch;
    }).sort((a, b) => {
      const doneOrder = Number(a.status === "completed") - Number(b.status === "completed");
      return doneOrder || a.due_at.localeCompare(b.due_at);
    });
  }, [tasks, progress, priority, search, courseById]);

  const loading = tasksQuery.isLoading || coursesQuery.isLoading;
  const completedCount = tasks.filter((task) => task.status === "completed").length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">YOUR WORKLOAD</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">My Tasks</h1>
          <p className="mt-2 text-muted-foreground">Every task in one place. Filter by progress or priority.</p>
        </div>
        <Button onClick={() => openTask()}><Plus className="size-4" /> Add task</Button>
      </header>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Task summary">
        {[
          { label: "All tasks", value: tasks.length },
          { label: "In progress", value: tasks.filter((task) => task.status === "in_progress").length },
          { label: "Completed", value: completedCount },
        ].map((item) => (
          <div key={item.label} className="card-surface flex items-center justify-between p-4">
            <span className="text-sm text-muted-foreground">{item.label}</span>
            <span className="text-2xl font-bold">{loading ? "—" : item.value}</span>
          </div>
        ))}
      </section>

      <section className="card-surface grid gap-4 p-4 sm:grid-cols-[minmax(200px,1fr)_180px_180px] sm:items-end" aria-label="Filter tasks">
        <div className="space-y-1.5">
          <Label htmlFor="task-search">Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="task-search" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Task or course name" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Progress</Label>
          <Select value={progress} onValueChange={setProgress}>
            <SelectTrigger aria-label="Filter by progress"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All progress</SelectItem>
              {STATUSES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger aria-label="Filter by priority"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All priorities</SelectItem>
              {PRIORITIES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </section>

      {tasksQuery.error && <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Your tasks couldn’t be loaded. Refresh to try again.</p>}

      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">{visibleTasks.length} {visibleTasks.length === 1 ? "task" : "tasks"}</h2>
        {(search || progress !== ALL || priority !== ALL) && (
          <Button type="button" variant="ghost" size="sm" onClick={() => { setSearch(""); setProgress(ALL); setPriority(ALL); }}>Clear filters</Button>
        )}
      </div>

      {loading ? (
        <div className="card-surface p-10 text-center text-sm text-muted-foreground">Loading your tasks…</div>
      ) : visibleTasks.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="size-5" />}
          title={tasks.length === 0 ? "No tasks yet" : "No matching tasks"}
          text={tasks.length === 0 ? "Add a task to start tracking your deadlines." : "Adjust the filters or search to find a task."}
          action={tasks.length === 0 ? <Button onClick={() => openTask()}><Plus className="size-4" /> Add your first task</Button> : undefined}
        />
      ) : (
        <ul className="space-y-3">
          {visibleTasks.map((task) => (
            <TaskRow key={task.id} task={task} timezone={timezone} courseName={task.course_id ? courseById.get(task.course_id)?.name : undefined}
              courseColor={task.course_id ? courseById.get(task.course_id)?.color : undefined}
              onToggle={() => toggleTask.mutate(task)} onEdit={() => openTask(task)} isUpdating={toggleTask.isPending && toggleTask.variables?.id === task.id} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TaskRow({ task, timezone, courseName, courseColor, onToggle, onEdit, isUpdating }: {
  task: Task; timezone: string; courseName?: string; courseColor?: string;
  onToggle: () => void; onEdit: () => void; isUpdating: boolean;
}) {
  const done = task.status === "completed";
  return (
    <li className={cn("card-surface flex items-start gap-3 p-4 sm:items-center sm:gap-4", done && "opacity-75")}>
      <Button type="button" variant="ghost" size="icon" aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
        disabled={isUpdating} onClick={onToggle} className="mt-0.5 shrink-0 sm:mt-0">
        {done ? <span className="flex size-5 items-center justify-center rounded-full bg-success text-success-foreground"><Check className="size-3.5" /></span> : <Circle className="size-5 text-muted-foreground" />}
      </Button>
      <div className="min-w-0 flex-1">
        <button type="button" onClick={onEdit} className="block max-w-full truncate text-left font-medium hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className={cn(done && "line-through text-muted-foreground")}>{task.title}</span>
        </button>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {courseName && <span className="inline-flex items-center gap-1.5">{courseColor && <CourseDot color={courseColor} />}<span>{courseName}</span></span>}
          <span>{task.task_type.replaceAll("_", " ")}</span>
          <span className="capitalize">{task.status.replaceAll("_", " ")}</span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
        <PriorityBadge p={task.priority} />
        <DeadlineBadge iso={task.due_at} tz={timezone} completed={done} hasTime={task.has_due_time} />
        <Button type="button" variant="ghost" size="icon" aria-label={`Edit ${task.title}`} onClick={onEdit}><Pencil className="size-4" /></Button>
      </div>
    </li>
  );
}

function TasksPage() {
  return <AppLayout><TasksContent /></AppLayout>;
}
