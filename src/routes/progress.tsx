import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppLayout } from "@/components/app/layout";
import { useSave, useTasks, STATUSES, type Task } from "@/lib/data";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/progress")({ component: ProgressPage });

const STATUS_COLORS: Record<string, string> = {
  todo: "var(--muted-foreground)",
  in_progress: "var(--primary)",
  completed: "var(--success)",
};

function ProgressPage() {
  const tasksQuery = useTasks();
  const saveTask = useSave("tasks", "Task progress updated");
  const tasks = tasksQuery.data ?? [];
  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === "completed").length;
  const completionPercent = total ? Math.round((completed / total) * 100) : 0;
  const statusData = STATUSES.map((status) => {
    const count = tasks.filter((task) => task.status === status.value).length;
    return {
      status: status.label,
      value: status.value,
      count,
      percent: total ? Math.round((count / total) * 100) : 0,
      fill: STATUS_COLORS[status.value] ?? "var(--primary)",
    };
  });

  return (
    <AppLayout>
      <div className="space-y-7">
        <header>
          <p className="text-sm font-medium text-primary">YOUR STUDY PLAN</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Progress</h1>
          <p className="mt-2 text-muted-foreground">Track every task and see how your workload is moving.</p>
        </header>

        {tasksQuery.error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Your tasks couldn’t be loaded. Refresh to try again.
          </p>
        )}

        <section className="card-surface space-y-4 p-5" aria-label="Overall completion">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Overall completion</p>
              <p className="mt-1 text-3xl font-bold">{tasksQuery.isLoading ? "—" : `${completionPercent}%`}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {tasksQuery.isLoading ? "Loading tasks…" : `${completed} of ${total} ${total === 1 ? "task" : "tasks"} completed`}
            </p>
          </div>
          <Progress value={completionPercent} aria-label={`Overall completion: ${completionPercent}%`} />
        </section>

        <section className="grid gap-3 sm:grid-cols-3" aria-label="Tasks by progress">
          {statusData.map((item) => (
            <article key={item.value} className="card-surface flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <span className="size-3 rounded-full" style={{ backgroundColor: item.fill }} />
                <div>
                  <p className="text-sm text-muted-foreground">{item.status}</p>
                  <p className="mt-1 text-2xl font-bold">{tasksQuery.isLoading ? "—" : item.count}</p>
                </div>
              </div>
              <span className="text-lg font-semibold tabular-nums">{tasksQuery.isLoading ? "—" : `${item.percent}%`}</span>
            </article>
          ))}
        </section>

        <section className="card-surface p-5" aria-label="Task progress chart">
          <div className="mb-5">
            <h2 className="font-semibold">Tasks by status</h2>
            <p className="mt-1 text-sm text-muted-foreground">Share of all tasks in each progress state</p>
          </div>
          {tasksQuery.isLoading ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading chart…</div>
          ) : total === 0 ? (
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              Add tasks to see your progress chart.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{ top: 12, right: 12, left: -18, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="status" tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tickFormatter={(value: number) => `${value}%`} />
                  <Tooltip formatter={(value: number | string) => [`${value}%`, "Share of tasks"]} />
                  <Bar dataKey="percent" name="Percentage" radius={[6, 6, 0, 0]} maxBarSize={72}>
                    {statusData.map((item) => <Cell key={item.value} fill={item.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="card-surface p-5" aria-label="Update task statuses">
          <div className="mb-4">
            <h2 className="font-semibold">All tasks</h2>
            <p className="mt-1 text-sm text-muted-foreground">Change a status here to update your progress totals and chart.</p>
          </div>
          {tasksQuery.isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading your tasks…</p>
          ) : tasks.length === 0 ? (
            <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No tasks yet. Add tasks from My Tasks to start tracking progress.</p>
          ) : (
            <ul className="divide-y">
              {tasks.map((task) => (
                <TaskStatusRow key={task.id} task={task} disabled={saveTask.isPending && saveTask.variables?.id === task.id}
                  onStatusChange={(status) => saveTask.mutate({ id: task.id, values: { status } })} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppLayout>
  );
}

function TaskStatusRow({ task, disabled, onStatusChange }: {
  task: Task;
  disabled: boolean;
  onStatusChange: (status: Task["status"]) => void;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className={`truncate font-medium ${task.status === "completed" ? "text-muted-foreground line-through" : ""}`}>{task.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{task.task_type.replaceAll("_", " ")}</p>
      </div>
      <Select value={task.status} disabled={disabled} onValueChange={(value) => onStatusChange(value as Task["status"])}>
        <SelectTrigger className="w-40" aria-label={`Status for ${task.title}`}><SelectValue /></SelectTrigger>
        <SelectContent>
          {STATUSES.map((status) => <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </li>
  );
}
