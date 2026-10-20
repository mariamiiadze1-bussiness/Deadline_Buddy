import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Moon, Sun, UserRound } from "lucide-react";
import { AppLayout } from "@/components/app/layout";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsContent() {
  const { theme, setTheme } = useTheme();
  const dark = theme === "dark";

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <header>
        <p className="text-sm font-medium text-primary">PREFERENCES</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 text-muted-foreground">Adjust how StudyFlow looks and manage your account details.</p>
      </header>

      <section className="space-y-3" aria-label="Display settings">
        <h2 className="text-lg font-semibold">Display</h2>
        <div className="card-surface flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">{dark ? <Moon className="size-5" /> : <Sun className="size-5" />}</span>
            <div>
              <p className="font-medium">Dark mode</p>
              <p className="mt-1 text-sm text-muted-foreground">Use {dark ? "dark" : "light"} colors across the app.</p>
            </div>
          </div>
          <Switch checked={dark} onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} aria-label="Toggle dark mode" />
        </div>
      </section>

      <section className="space-y-3" aria-label="Account settings">
        <h2 className="text-lg font-semibold">Account</h2>
        <Link to="/account-info" className="card-surface flex items-center justify-between gap-4 p-5 transition-colors hover:bg-accent/50">
          <span className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary"><UserRound className="size-5" /></span>
            <span>
              <span className="block font-medium">Account info</span>
              <span className="mt-1 block text-sm text-muted-foreground">View and update your personal information.</span>
            </span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}

function SettingsPage() {
  return <AppLayout><SettingsContent /></AppLayout>;
}
