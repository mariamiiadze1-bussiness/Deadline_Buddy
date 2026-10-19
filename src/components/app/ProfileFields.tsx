import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type ProfileForm = {
  full_name: string; university_name: string; current_semester: string; timezone: string; week_starts_on: string; study_goals: string;
};

function zones(current: string): string[] {
  let list: string[] = [];
  try {
    list = (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf("timeZone");
  } catch {
    list = ["UTC"];
  }
  if (!list.includes(current)) list = [current, ...list];
  if (!list.includes("UTC")) list = ["UTC", ...list];
  return list;
}

export function ProfileFields({ f, setF, nameError }: { f: ProfileForm; setF: (f: ProfileForm) => void; nameError?: string }) {
  const set = (k: keyof ProfileForm) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="pf-name">Full name *</Label>
        <Input id="pf-name" value={f.full_name} onChange={set("full_name")} />
        {nameError && <p className="text-xs text-destructive">{nameError}</p>}
      </div>
      <div className="space-y-1.5"><Label htmlFor="pf-uni">University (optional)</Label><Input id="pf-uni" value={f.university_name} onChange={set("university_name")} /></div>
      <div className="space-y-1.5"><Label htmlFor="pf-sem">Current semester (optional)</Label><Input id="pf-sem" value={f.current_semester} onChange={set("current_semester")} placeholder="Fall 2026" /></div>
      <div className="space-y-1.5">
        <Label>Time zone</Label>
        <Select value={f.timezone} onValueChange={(v) => setF({ ...f, timezone: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent className="max-h-72">{zones(f.timezone).map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Week starts on</Label>
        <Select value={f.week_starts_on} onValueChange={(v) => setF({ ...f, week_starts_on: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="1">Monday</SelectItem><SelectItem value="0">Sunday</SelectItem></SelectContent>
        </Select>
      </div>
    </div>
  );
}
