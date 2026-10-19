import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ListChecks, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { friendlyError } from "@/lib/data";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ mode: s.mode === "signup" ? ("signup" as const) : undefined }),
  head: () => ({
    meta: [
      { title: "Sign in — StudyFlow" },
      { name: "description", content: "Sign in or create your free StudyFlow account." },
      { property: "og:title", content: "Sign in — StudyFlow" },
      { property: "og:description", content: "Sign in or create your free StudyFlow account." },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Link to="/" className="mb-6 flex items-center gap-2 text-lg font-bold">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><ListChecks className="size-4" /></span>
        StudyFlow
      </Link>
      <div className="card-surface w-full max-w-md p-8">{children}</div>
    </div>
  );
}

function AuthPage() {
  const { mode } = Route.useSearch();
  const [signup, setSignup] = useState(mode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse({ email, password });
    const errs: Record<string, string> = {};
    if (!r.success) r.error.issues.forEach((i) => (errs[i.path[0] as string] = i.message));
    if (signup && !name.trim()) errs.name = "Please enter your name";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      if (signup) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: name.trim() } },
        });
        if (error) throw error;
        if (!data.session) setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  if (sent)
    return (
      <AuthCard>
        <div className="text-center">
          <MailCheck className="mx-auto size-10 text-primary" />
          <h1 className="mt-4 text-xl font-bold">Check your email</h1>
          <p className="mt-2 text-sm text-muted-foreground">We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
        </div>
      </AuthCard>
    );

  return (
    <AuthCard>
      <h1 className="text-2xl font-bold">{signup ? "Create your account" : "Welcome back"}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{signup ? "Start organizing your semester for free." : "Sign in to continue to your plan."}</p>
      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        {signup && (
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {!signup && <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">Forgot password?</Link>}
          </div>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={signup ? "new-password" : "current-password"} />
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Please wait…" : signup ? "Create account" : "Sign in"}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {signup ? "Already have an account?" : "New to StudyFlow?"}{" "}
        <button className="font-medium text-primary hover:underline" onClick={() => { setSignup(!signup); setErrors({}); }}>
          {signup ? "Sign in" : "Create an account"}
        </button>
      </p>
    </AuthCard>
  );
}
