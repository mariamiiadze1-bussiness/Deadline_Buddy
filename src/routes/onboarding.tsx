import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { useProfile, useUpdateProfile } from "@/lib/data";
import { browserTimeZone } from "@/lib/dates";
import { ProfileFields, type ProfileForm } from "@/components/app/ProfileFields";
import { AuthCard } from "./auth";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Welcome — StudyFlow" },
      { name: "description", content: "Set up your StudyFlow profile." },
      { property: "og:title", content: "Welcome — StudyFlow" },
      { property: "og:description", content: "Set up your StudyFlow profile." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const [f, setF] = useState<ProfileForm | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);
  useEffect(() => {
    if (profile && !f)
      setF({
        full_name: profile.full_name, university_name: profile.university_name ?? "", current_semester: profile.current_semester ?? "",
        timezone: profile.timezone === "UTC" ? browserTimeZone() : profile.timezone, week_starts_on: String(profile.week_starts_on),
        study_goals: profile.study_goals ?? "",
      });
  }, [profile, f]);

  if (!f) return <AuthCard><p className="text-sm text-muted-foreground">Loading…</p></AuthCard>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.full_name.trim()) return setErr("Please enter your name");
    await update.mutateAsync({
      full_name: f.full_name.trim(), university_name: f.university_name.trim() || null, current_semester: f.current_semester.trim() || null,
      timezone: f.timezone, week_starts_on: Number(f.week_starts_on), study_goals: f.study_goals.trim() || null, onboarded: true,
    });
    navigate({ to: "/dashboard" });
  };

  return (
    <AuthCard>
      <h1 className="text-2xl font-bold">Let's set up your space</h1>
      <p className="mt-1 text-sm text-muted-foreground">A few details so dates and greetings feel right. You can change these later.</p>
      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <ProfileFields f={f} setF={setF} nameError={err} />
        <div className="space-y-1.5">
          <Label htmlFor="goals">Study goals (optional)</Label>
          <Textarea id="goals" rows={2} value={f.study_goals} onChange={(e) => setF({ ...f, study_goals: e.target.value })} placeholder="e.g. Start assignments a week early" />
        </div>
        <Button className="w-full" disabled={update.isPending}>{update.isPending ? "Saving…" : "Go to my dashboard"}</Button>
      </form>
      <Input type="hidden" />
    </AuthCard>
  );
}
