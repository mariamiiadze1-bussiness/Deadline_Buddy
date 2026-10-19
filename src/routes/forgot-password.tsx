import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError } from "@/lib/data";
import { AuthCard } from "./auth";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — StudyFlow" },
      { name: "description", content: "Get a link to reset your StudyFlow password." },
      { property: "og:title", content: "Reset password — StudyFlow" },
      { property: "og:description", content: "Get a link to reset your StudyFlow password." },
    ],
  }),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast.error("Enter a valid email");
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (error) return toast.error(friendlyError(error));
    setSent(true);
  };
  return (
    <AuthCard>
      <h1 className="text-2xl font-bold">Forgot your password?</h1>
      {sent ? (
        <p className="mt-3 text-sm text-muted-foreground">If an account exists for <strong>{email}</strong>, a reset link is on its way.</p>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <Button className="w-full" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm"><Link to="/auth" className="font-medium text-primary hover:underline">Back to sign in</Link></p>
    </AuthCard>
  );
}
