import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BarChart3, Bell, BookOpen, CalendarDays, CalendarClock, GraduationCap, LayoutDashboard, ListChecks, LogOut, Menu, Plus, Settings, FileUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { useProfile, useTasks } from "@/lib/data";
import { DialogsProvider, useDialogs } from "@/components/app/dialogs";
import { DeadlineBadge } from "@/components/app/bits";
import { deadlineInfo } from "@/lib/dates";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tasks", label: "My Tasks", icon: ListChecks },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/courses", label: "Courses", icon: BookOpen },
  { to: "/syllabus", label: "Syllabus", icon: FileUp },
  { to: "/exams", label: "Exams", icon: GraduationCap },
  { to: "/planner", label: "Study Planner", icon: CalendarClock },
  { to: "/progress", label: "Progress", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppLayout({ children }: { children?: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const profile = useProfile();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);
  useEffect(() => {
    if (profile.data && !profile.data.onboarded) navigate({ to: "/onboarding" });
  }, [profile.data, navigate]);

  if (loading || !user || profile.isLoading || !profile.data?.onboarded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {profile.error ? <p className="text-sm text-destructive">Could not load your profile. Please refresh.</p> : <Skeleton className="h-8 w-40" />}
      </div>
    );
  }
  return (
    <DialogsProvider>
      <Shell>{children}</Shell>
    </DialogsProvider>
  );
}

function Logo() {
  return (
    <Link to="/dashboard" className="flex items-center gap-2 px-2 text-lg font-bold tracking-tight">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><ListChecks className="size-4" /></span>
      StudyFlow
    </Link>
  );
}

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { openTask } = useDialogs();
  const { data: profile } = useProfile();
  const { signOut } = useAuth();
  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <Logo />
      <Button className="w-full" onClick={() => { openTask(); onNavigate?.(); }}><Plus className="size-4" /> Add Task</Button>
      <nav className="flex flex-1 flex-col gap-1" aria-label="Main">
        {NAV.map((n) => {
          const active = path === n.to || path.startsWith(n.to + "/");
          return (
            <Link key={n.to} to={n.to} onClick={onNavigate}
              className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              <n.icon className="size-4" /> {n.label}
            </Link>
          );
        })}
      </nav>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 rounded-lg border p-2 text-left hover:bg-muted">
            <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-primary">
              {(profile?.full_name || "S").slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{profile?.full_name || "Student"}</span>
              <span className="block truncate text-xs text-muted-foreground">{profile?.university_name || "My account"}</span>
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem asChild><Link to="/settings"><Settings className="size-4" /> Settings</Link></DropdownMenuItem>
          <DropdownMenuItem onClick={signOut}><LogOut className="size-4" /> Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function Notifications() {
  const { data: tasks = [] } = useTasks();
  const { data: p } = useProfile();
  const tz = p?.timezone ?? "UTC";
  const items = useMemo(() => {
    const now = new Date();
    return tasks
      .filter((t) => t.status !== "completed")
      .map((t) => ({ t, d: deadlineInfo(t.due_at, tz, false, now, t.has_due_time) }))
      .filter(({ d }) =>
        (d.tone === "overdue" && p?.notify_overdue) || (d.tone === "today" && p?.notify_due_today) || (d.tone === "soon" && p?.notify_due_soon))
      .slice(0, 12);
  }, [tasks, tz, p]);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Deadline alerts (${items.length})`}>
          <Bell className="size-5" />
          {items.length > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3 text-sm font-semibold">Deadline alerts</div>
        {items.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">You're all caught up.</p>
        ) : (
          <ul className="max-h-80 overflow-y-auto">
            {items.map(({ t }) => (
              <li key={t.id} className="flex items-center justify-between gap-2 border-b px-4 py-2.5 last:border-0">
                <span className="truncate text-sm">{t.title}</span>
                <DeadlineBadge iso={t.due_at} tz={tz} hasTime={t.has_due_time} />
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

function Shell({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-sidebar lg:block"><SideNav /></aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SideNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/85 px-4 backdrop-blur lg:px-8">
        <div className="flex items-center gap-2 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="size-5" /></Button>
          <span className="font-bold">StudyFlow</span>
        </div>
        <div className="ml-auto"><Notifications /></div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-8">{children ?? <Outlet />}</main>
    </div>
  );
}
