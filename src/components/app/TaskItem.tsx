import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, RotateCcw, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CourseDot, Confirm, DeadlineBadge, PriorityBadge } from "./bits";
import { useDialogs } from "./dialogs";
import { labelOf, TASK_TYPES, useDelete, useToggleTask, type Course, type Task } from "@/lib/data";
import { formatDue } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function TaskItem({ task, course, tz, compact, card }: { task: Task; course?: Course; tz: string; compact?: boolean; card?: boolean }) {
  const toggle = useToggleTask();
  const del = useDelete("tasks", "Task deleted");
  const { openTask } = useDialogs();
  const [confirm, setConfirm] = useState(false);
  const done = task.status === "completed";

  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 shrink-0" aria-label="Task actions"><MoreHorizontal className="size-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => openTask(task)}><Pencil className="size-4" /> Edit</DropdownMenuItem>
        <DropdownMenuItem onClick={() => toggle.mutate(task)}>
          {done ? <><RotateCcw className="size-4" /> Reopen</> : <><Check className="size-4" /> Mark complete</>}
        </DropdownMenuItem>
        <DropdownMenuItem className="text-destructive" onClick={() => setConfirm(true)}><Trash2 className="size-4" /> Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className={cn("group flex gap-3 transition-colors", card ? "card-surface flex-col p-4" : "items-center rounded-lg px-3 py-2.5 hover:bg-muted/60")}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Checkbox className="mt-0.5" checked={done} onCheckedChange={() => toggle.mutate(task)} aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`} />
        <button className="min-w-0 flex-1 text-left" onClick={() => openTask(task)}>
          <p className={cn("truncate text-sm font-medium", done && "text-muted-foreground line-through")}>{task.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {course && <span className="inline-flex items-center gap-1.5"><CourseDot color={course.color} />{course.name}</span>}
            {!compact && <span>{labelOf(TASK_TYPES, task.task_type)}</span>}
            <span>{formatDue(task.due_at, task.has_due_time, tz)}</span>
          </div>
        </button>
        {card && menu}
      </div>
      <div className={cn("flex shrink-0 items-center gap-2", card && "pl-7")}>
        <PriorityBadge p={task.priority} />
        <DeadlineBadge iso={task.due_at} tz={tz} completed={done} hasTime={task.has_due_time} />
        {!card && menu}
      </div>
      <Confirm open={confirm} onOpenChange={setConfirm} title="Delete this task?" description={`“${task.title}” will be permanently removed.`} onConfirm={() => del.mutate(task.id)} />
    </div>
  );
}
