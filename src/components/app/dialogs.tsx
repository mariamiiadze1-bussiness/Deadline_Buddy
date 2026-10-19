import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  COURSE_COLORS, PREP_STATUSES, PRIORITIES, STATUSES, TASK_TYPES,
  useCourses, useExams, useProfile, useSave, useTasks,
  type Course, type Exam, type StudySession, type Task,
} from "@/lib/data";
import { dayKey, timeKey, zonedToUtc } from "@/lib/dates";
import { cn } from "@/lib/utils";

type TaskInit = Partial<Task> & { dateKey?: string };
type ExamInit = Partial<Exam> & { dateKey?: string };
type SessionInit = Partial<StudySession> & { dateKey?: string };

type Ctx = {
  openTask: (t?: TaskInit) => void;
  openCourse: (c?: Partial<Course>) => void;
  openExam: (e?: ExamInit) => void;
  openSession: (s?: SessionInit) => void;
};
const UICtx = createContext<Ctx>(null as unknown as Ctx);
export const useDialogs = () => useContext(UICtx);

export function DialogsProvider({ children }: { children: ReactNode }) {
  const [task, setTask] = useState<TaskInit | null>(null);
  const [course, setCourse] = useState<Partial<Course> | null>(null);
  const [exam, setExam] = useState<ExamInit | null>(null);
  const [session, setSession] = useState<SessionInit | null>(null);
  return (
    <UICtx.Provider
      value={{
        openTask: (t) => setTask(t ?? {}),
        openCourse: (c) => setCourse(c ?? {}),
        openExam: (e) => setExam(e ?? {}),
        openSession: (s) => setSession(s ?? {}),
      }}
    >
      {children}
      {task && <TaskDialog init={task} onClose={() => setTask(null)} />}
      {course && <CourseDialog init={course} onClose={() => setCourse(null)} />}
      {exam && <ExamDialog init={exam} onClose={() => setExam(null)} />}
      {session && <SessionDialog init={session} onClose={() => setSession(null)} />}
    </UICtx.Provider>
  );
}

function Field({ label, error, children, className }: { label: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Pick({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function useTz() {
  const { data } = useProfile();
  return data?.timezone ?? "UTC";
}

const NONE = "__none";

function TaskDialog({ init, onClose }: { init: TaskInit; onClose: () => void }) {
  const tz = useTz();
  const { data: courses = [] } = useCourses();
  const { data: exams = [] } = useExams();
  const save = useSave("tasks", init.id ? "Task updated" : "Task created");
  const [f, setF] = useState({
    title: init.title ?? "",
    description: init.description ?? "",
    course_id: init.course_id ?? NONE,
    exam_id: init.exam_id ?? NONE,
    task_type: init.task_type ?? "assignment",
    date: init.due_at ? dayKey(init.due_at, tz) : init.dateKey ?? dayKey(new Date(), tz),
    time: init.due_at && init.has_due_time ? timeKey(init.due_at, tz) : "",
    priority: init.priority ?? "medium",
    status: init.status ?? "todo",
    est: init.estimated_duration_minutes?.toString() ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!f.title.trim()) err.title = "Title is required";
    if (f.title.length > 200) err.title = "Keep the title under 200 characters";
    if (!f.date) err.date = "Due date is required";
    if (f.est && (!/^\d+$/.test(f.est) || +f.est < 1 || +f.est > 10000)) err.est = "Enter minutes between 1 and 10000";
    setErrors(err);
    if (Object.keys(err).length) return;
    const due = zonedToUtc(f.date, f.time || "23:59", tz);
    await save.mutateAsync({
      id: init.id,
      values: {
        title: f.title.trim(),
        description: f.description.trim() || null,
        course_id: f.course_id === NONE ? null : f.course_id,
        exam_id: f.exam_id === NONE ? null : f.exam_id,
        task_type: f.task_type,
        due_at: due.toISOString(),
        has_due_time: !!f.time,
        priority: f.priority,
        status: f.status,
        estimated_duration_minutes: f.est ? +f.est : null,
      },
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{init.id ? "Edit task" : "New task"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field label="Title *" error={errors.title} className="sm:col-span-2">
            <Input autoFocus value={f.title} onChange={(e) => set("title")(e.target.value)} placeholder="e.g. Submit case study" />
          </Field>
          <Field label="Course">
            <Pick value={f.course_id} onChange={set("course_id")} options={[{ value: NONE, label: "No course" }, ...courses.map((c) => ({ value: c.id, label: c.name }))]} />
          </Field>
          <Field label="Type">
            <Pick value={f.task_type} onChange={set("task_type")} options={[...TASK_TYPES]} />
          </Field>
          <Field label="Due date *" error={errors.date}>
            <Input type="date" value={f.date} onChange={(e) => set("date")(e.target.value)} />
          </Field>
          <Field label="Due time (optional)">
            <Input type="time" value={f.time} onChange={(e) => set("time")(e.target.value)} />
          </Field>
          <Field label="Priority">
            <Pick value={f.priority} onChange={set("priority")} options={PRIORITIES.map((p) => ({ value: p.value, label: p.label }))} />
          </Field>
          <Field label="Status">
            <Pick value={f.status} onChange={set("status")} options={[...STATUSES]} />
          </Field>
          <Field label="Estimated minutes" error={errors.est}>
            <Input inputMode="numeric" value={f.est} onChange={(e) => set("est")(e.target.value)} placeholder="60" />
          </Field>
          <Field label="Linked exam">
            <Pick value={f.exam_id} onChange={set("exam_id")} options={[{ value: NONE, label: "None" }, ...exams.map((x) => ({ value: x.id, label: x.title }))]} />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea rows={3} value={f.description} onChange={(e) => set("description")(e.target.value)} />
          </Field>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save task"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CourseDialog({ init, onClose }: { init: Partial<Course>; onClose: () => void }) {
  const save = useSave("courses", init.id ? "Course updated" : "Course created");
  const [f, setF] = useState({
    name: init.name ?? "", course_code: init.course_code ?? "", instructor_name: init.instructor_name ?? "",
    semester: init.semester ?? "", color: init.color ?? COURSE_COLORS[0], description: init.description ?? "",
  });
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim()) return setErr("Course name is required");
    const n = (s: string) => s.trim() || null;
    await save.mutateAsync({
      id: init.id,
      values: { name: f.name.trim(), course_code: n(f.course_code), instructor_name: n(f.instructor_name), semester: n(f.semester), color: f.color, description: n(f.description) },
    });
    onClose();
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{init.id ? "Edit course" : "New course"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field label="Course name *" error={err} className="sm:col-span-2"><Input autoFocus value={f.name} onChange={set("name")} /></Field>
          <Field label="Course code"><Input value={f.course_code} onChange={set("course_code")} placeholder="MKT 301" /></Field>
          <Field label="Instructor"><Input value={f.instructor_name} onChange={set("instructor_name")} /></Field>
          <Field label="Semester"><Input value={f.semester} onChange={set("semester")} placeholder="Fall 2026" /></Field>
          <Field label="Color">
            <div className="flex flex-wrap gap-2 pt-1">
              {COURSE_COLORS.map((c) => (
                <button key={c} type="button" aria-label={`Color ${c}`} onClick={() => setF((p) => ({ ...p, color: c }))}
                  className={cn("size-7 rounded-full ring-offset-2 transition", f.color === c && "ring-2 ring-ring")} style={{ backgroundColor: c }} />
              ))}
            </div>
          </Field>
          <Field label="Description" className="sm:col-span-2"><Textarea rows={2} value={f.description} onChange={set("description")} /></Field>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save course"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ExamDialog({ init, onClose }: { init: ExamInit; onClose: () => void }) {
  const tz = useTz();
  const { data: courses = [] } = useCourses();
  const save = useSave("exams", init.id ? "Exam updated" : "Exam added");
  const [f, setF] = useState({
    title: init.title ?? "", course_id: init.course_id ?? NONE,
    date: init.exam_at ? dayKey(init.exam_at, tz) : init.dateKey ?? "",
    time: init.exam_at && init.has_exam_time ? timeKey(init.exam_at, tz) : "",
    location: init.location_or_format ?? "", notes: init.notes ?? "", goal: init.study_goal ?? "",
    prep: init.preparation_status ?? "not_started",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!f.title.trim()) er.title = "Exam title is required";
    if (!f.date) er.date = "Exam date is required";
    setErrors(er);
    if (Object.keys(er).length) return;
    const n = (s: string) => s.trim() || null;
    await save.mutateAsync({
      id: init.id,
      values: {
        title: f.title.trim(), course_id: f.course_id === NONE ? null : f.course_id,
        exam_at: zonedToUtc(f.date, f.time || "09:00", tz).toISOString(), has_exam_time: !!f.time,
        location_or_format: n(f.location), notes: n(f.notes), study_goal: n(f.goal), preparation_status: f.prep,
      },
    });
    onClose();
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{init.id ? "Edit exam" : "New exam"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field label="Exam title *" error={errors.title} className="sm:col-span-2"><Input autoFocus value={f.title} onChange={(e) => set("title")(e.target.value)} /></Field>
          <Field label="Course"><Pick value={f.course_id} onChange={set("course_id")} options={[{ value: NONE, label: "No course" }, ...courses.map((c) => ({ value: c.id, label: c.name }))]} /></Field>
          <Field label="Preparation"><Pick value={f.prep} onChange={set("prep")} options={[...PREP_STATUSES]} /></Field>
          <Field label="Date *" error={errors.date}><Input type="date" value={f.date} onChange={(e) => set("date")(e.target.value)} /></Field>
          <Field label="Time (optional)"><Input type="time" value={f.time} onChange={(e) => set("time")(e.target.value)} /></Field>
          <Field label="Location or format" className="sm:col-span-2"><Input value={f.location} onChange={(e) => set("location")(e.target.value)} placeholder="Room B204 / Online" /></Field>
          <Field label="Study goal" className="sm:col-span-2"><Input value={f.goal} onChange={(e) => set("goal")(e.target.value)} placeholder="Review chapters 1–6" /></Field>
          <Field label="Notes" className="sm:col-span-2"><Textarea rows={2} value={f.notes} onChange={(e) => set("notes")(e.target.value)} /></Field>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save exam"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SessionDialog({ init, onClose }: { init: SessionInit; onClose: () => void }) {
  const tz = useTz();
  const { data: courses = [] } = useCourses();
  const { data: tasks = [] } = useTasks();
  const save = useSave("study_sessions", init.id ? "Session updated" : "Session planned");
  const [f, setF] = useState({
    title: init.title ?? "", course_id: init.course_id ?? NONE, task_id: init.task_id ?? NONE,
    date: init.starts_at ? dayKey(init.starts_at, tz) : init.dateKey ?? dayKey(new Date(), tz),
    start: init.starts_at ? timeKey(init.starts_at, tz) : "18:00",
    end: init.ends_at ? timeKey(init.ends_at, tz) : "19:00",
    status: init.status ?? "planned",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  useEffect(() => {
    if (!f.title && f.task_id !== NONE) {
      const t = tasks.find((x) => x.id === f.task_id);
      if (t) setF((p) => ({ ...p, title: `Work on: ${t.title}`, course_id: t.course_id ?? p.course_id }));
    }
  }, [f.task_id, f.title, tasks]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!f.title.trim()) er.title = "Title is required";
    if (f.end <= f.start) er.end = "End time must be after start time";
    setErrors(er);
    if (Object.keys(er).length) return;
    await save.mutateAsync({
      id: init.id,
      values: {
        title: f.title.trim(), course_id: f.course_id === NONE ? null : f.course_id, task_id: f.task_id === NONE ? null : f.task_id,
        starts_at: zonedToUtc(f.date, f.start, tz).toISOString(), ends_at: zonedToUtc(f.date, f.end, tz).toISOString(), status: f.status,
      },
    });
    onClose();
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{init.id ? "Edit study session" : "Plan a study session"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field label="For task (optional)" className="sm:col-span-2">
            <Pick value={f.task_id} onChange={set("task_id")} options={[{ value: NONE, label: "No specific task" }, ...tasks.filter((t) => t.status !== "completed").map((t) => ({ value: t.id, label: t.title }))]} />
          </Field>
          <Field label="Title *" error={errors.title} className="sm:col-span-2"><Input value={f.title} onChange={(e) => set("title")(e.target.value)} /></Field>
          <Field label="Course"><Pick value={f.course_id} onChange={set("course_id")} options={[{ value: NONE, label: "No course" }, ...courses.map((c) => ({ value: c.id, label: c.name }))]} /></Field>
          <Field label="Date"><Input type="date" value={f.date} onChange={(e) => set("date")(e.target.value)} /></Field>
          <Field label="Start"><Input type="time" value={f.start} onChange={(e) => set("start")(e.target.value)} /></Field>
          <Field label="End" error={errors.end}><Input type="time" value={f.end} onChange={(e) => set("end")(e.target.value)} /></Field>
          <Field label="Status"><Pick value={f.status} onChange={set("status")} options={[{ value: "planned", label: "Planned" }, { value: "done", label: "Done" }, { value: "skipped", label: "Skipped" }]} /></Field>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save session"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
