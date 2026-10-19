import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, BellRing, CalendarRange, GraduationCap, Inbox, ListChecks, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StudyFlow — Your University Life, Organized" },
      { name: "description", content: "Manage assignments, exams, and deadlines in one place. All your deadlines. One clear plan." },
      { property: "og:title", content: "StudyFlow — Your University Life, Organized" },
      { property: "og:description", content: "Manage assignments, exams, and deadlines in one place." },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Inbox, title: "All Tasks in One Place", text: "Collect assignments from every course, chat and email into one list." },
  { icon: BellRing, title: "Smart Deadline Tracking", text: "Clear “Due today” and “Overdue” signals so nothing slips by." },
  { icon: GraduationCap, title: "Exam and Course Planning", text: "Track exams per course and link preparation tasks to them." },
  { icon: Flag, title: "Priority-Based Tasks", text: "Sort by urgency and focus on what matters most right now." },
  { icon: BarChart3, title: "Progress Tracking", text: "See your completion rate and weekly progress at a glance." },
  { icon: CalendarRange, title: "A Clear Weekly Schedule", text: "Plan study sessions and spot overloaded days early." },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><ListChecks className="size-4" /></span>
          StudyFlow
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <a href="/#features" className="hover:text-foreground">Features</a>
          <a href="/#how" className="hover:text-foreground">How It Works</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild><Link to="/auth">Sign In</Link></Button>
          <Button asChild><Link to="/auth" search={{ mode: "signup" }}>Get Started</Link></Button>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
        <span>© {new Date().getFullYear()} StudyFlow</span>
        <nav className="flex flex-wrap gap-5">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <a href="/#features" className="hover:text-foreground">Features</a>
          <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-foreground">Terms</Link>
          <Link to="/contact" className="hover:text-foreground">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}

function Landing() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
        <div>
          <span className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">All your deadlines. One clear plan.</span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">Your University Life, Organized.</h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            Manage assignments, exams, and deadlines in one place. Spend less time worrying about what's next and more time making progress.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild><Link to="/auth" search={{ mode: "signup" }}>Get Started Free</Link></Button>
            <Button size="lg" variant="outline" asChild><a href="#features">Explore Features</a></Button>
          </div>
        </div>
        <img src={hero} width={1280} height={960} alt="Student planning assignments with a calendar, checklist and progress tracker" className="w-full rounded-2xl border shadow-card" />
      </section>

      <section id="features" className="border-t bg-card py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold tracking-tight">Everything a semester needs</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">Built for students juggling multiple courses, overlapping deadlines and real life.</p>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="card-surface p-6 transition hover:-translate-y-0.5">
                <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary"><f.icon className="size-5" /></div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold tracking-tight">How it works</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {["Add your university courses and academic tasks.", "Organize deadlines and set priorities.", "Track your progress and complete work on time."].map((s, i) => (
              <div key={s} className="card-surface p-6">
                <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{i + 1}</span>
                <p className="mt-4 font-medium">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20">
        <div className="mx-auto max-w-4xl rounded-2xl bg-primary px-8 py-14 text-center text-primary-foreground">
          <h2 className="text-3xl font-bold tracking-tight">Make Your Next Semester More Organized.</h2>
          <Button size="lg" variant="secondary" className="mt-6" asChild><Link to="/auth" search={{ mode: "signup" }}>Start Planning</Link></Button>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
