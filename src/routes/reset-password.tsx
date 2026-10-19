import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { AuthCard } from "./auth";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — StudyFlow" },
      { name: "description", content: "Choose a new password for your StudyFlow account." },
      { property: "og:title", content: "Set a new password — StudyFlow" },
      { property: "og:description", content: "Choose a new password for your StudyFlow account." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Password must be at least 8 characters");
    if (pw !== pw2) return toast.error("Passwords don't match");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(friendlyError(error));
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  };
  return (
    <AuthCard>
      <h1 className="text-2xl font-bold">Set a new password</h1>
      {!loading && !session ? (
        <p className="mt-3 text-sm text-muted-foreground">This reset link is invalid or has expired. Request a new one from the sign-in page.</p>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-1.5"><Label htmlFor="p1">New password</Label><Input id="p1" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /></div>
          <div className="space-y-1.5"><Label htmlFor="p2">Confirm password</Label><Input id="p2" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" /></div>
          <Button className="w-full" disabled={busy}>{busy ? "Saving…" : "Update password"}</Button>
        </form>
      )}
    </AuthCard>
  );
}
