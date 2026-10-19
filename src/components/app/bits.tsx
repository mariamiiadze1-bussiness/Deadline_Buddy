import { cn } from "@/lib/utils";
import { deadlineInfo, type DeadlineTone } from "@/lib/dates";
import { labelOf, PRIORITIES } from "@/lib/data";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ReactNode } from "react";

const toneCls: Record<DeadlineTone, string> = {
  overdue: "bg-danger-soft text-destructive",
  today: "bg-warning-soft text-warning",
  soon: "bg-warning-soft text-warning",
  later: "bg-secondary text-secondary-foreground",
  done: "bg-success-soft text-success",
};

export function DeadlineBadge({ iso, tz, completed, hasTime }: { iso: string; tz: string; completed?: boolean; hasTime?: boolean }) {
  const d = deadlineInfo(iso, tz, completed, new Date(), hasTime);
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", toneCls[d.tone])}>{d.label}</span>;
}

const prioCls: Record<string, string> = {
  low: "text-muted-foreground border-border",
  medium: "text-primary border-primary/30",
  high: "text-warning border-warning/40",
  urgent: "text-destructive border-destructive/40",
};
export function PriorityBadge({ p }: { p: string }) {
  return <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-xs font-medium", prioCls[p])}>{labelOf(PRIORITIES, p)}</span>;
}

export function CourseDot({ color, className }: { color: string; className?: string }) {
  return <span aria-hidden className={cn("inline-block size-2.5 shrink-0 rounded-full", className)} style={{ backgroundColor: color }} />;
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-12 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-secondary text-primary">{icon}</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Confirm({
  open, onOpenChange, title, description, confirmLabel = "Delete", onConfirm,
}: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description: ReactNode; confirmLabel?: string; onConfirm: () => void }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild><div>{description}</div></AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
