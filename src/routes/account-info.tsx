import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { AppLayout } from "@/components/app/layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ProfileFields, type ProfileForm } from "@/components/app/ProfileFields";
import { useAuth } from "@/lib/auth";
import { useProfile, useUpdateProfile } from "@/lib/data";
import { toast } from "sonner";

export const Route = createFileRoute("/account-info")({ component: AccountInfoPage });

function AccountInfoContent() {
  const { user } = useAuth();
  const profileQuery = useProfile();
  const updateProfile = useUpdateProfile();
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [error, setError] = useState("");
  const profile = profileQuery.data;

  useEffect(() => {
    if (profile && !form) {
      setForm({
        full_name: profile.full_name,
        university_name: profile.university_name ?? "",
        current_semester: profile.current_semester ?? "",
        timezone: profile.timezone,
        week_starts_on: String(profile.week_starts_on),
        study_goals: profile.study_goals ?? "",
      });
    }
  }, [profile, form]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
    if (!form.full_name.trim()) {
      setError("Please enter your name.");
      return;
    }
    setError("");
    try {
      await updateProfile.mutateAsync({
        full_name: form.full_name.trim(),
        university_name: form.university_name.trim() || null,
        current_semester: form.current_semester.trim() || null,
        timezone: form.timezone,
        week_starts_on: Number(form.week_starts_on),
        study_goals: form.study_goals.trim() || null,
      });
      toast.success("Personal information updated");
    } catch {
      // useUpdateProfile displays the save error toast.
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <header>
        <Button asChild variant="ghost" className="mb-3 -ml-3"><Link to="/settings"><ArrowLeft className="size-4" /> Settings</Link></Button>
        <p className="text-sm font-medium text-primary">YOUR ACCOUNT</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Personal information</h1>
        <p className="mt-2 text-muted-foreground">Manage the personal details used throughout your study plan.</p>
      </header>

      {profileQuery.error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Your account information couldn’t be loaded. Refresh to try again.</p>
      ) : profileQuery.isLoading || !form ? (
        <div className="card-surface p-8 text-center text-sm text-muted-foreground">Loading account information…</div>
      ) : (
        <form className="card-surface space-y-6 p-5 sm:p-7" onSubmit={save}>
          <div className="space-y-1.5">
            <Label htmlFor="account-email">Email</Label>
            <input id="account-email" className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground" value={user?.email ?? "Guest account"} readOnly />
            <p className="text-xs text-muted-foreground">Email address is managed by your sign-in provider.</p>
          </div>
          <ProfileFields f={form} setF={setForm} nameError={error} />
          <div className="space-y-1.5">
            <Label htmlFor="account-goals">Study goals (optional)</Label>
            <Textarea id="account-goals" rows={3} value={form.study_goals} onChange={(event) => setForm({ ...form, study_goals: event.target.value })} placeholder="e.g. Start assignments a week early" />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={updateProfile.isPending}><Save className="size-4" />{updateProfile.isPending ? "Saving…" : "Save changes"}</Button>
          </div>
        </form>
      )}
    </div>
  );
}

function AccountInfoPage() {
  return <AppLayout><AccountInfoContent /></AppLayout>;
}
