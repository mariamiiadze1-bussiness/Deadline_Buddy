import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useAuth } from "./auth";
import { DEMO_MODE, readDemoRows, writeDemoRows } from "./demo-mode";

export type Profile = Tables<"profiles">;
export type Course = Tables<"courses">;
export type Task = Tables<"tasks">;
export type Exam = Tables<"exams">;
export type StudySession = Tables<"study_sessions">;

type TableName = "courses" | "tasks" | "exams" | "study_sessions";

export const TASK_TYPES = [
  { value: "assignment", label: "Assignment" },
  { value: "homework", label: "Homework" },
  { value: "project", label: "Project" },
  { value: "reading", label: "Reading" },
  { value: "exam_prep", label: "Exam Preparation" },
  { value: "other", label: "Other" },
] as const;
export const PRIORITIES = [
  { value: "low", label: "Low", rank: 0 },
  { value: "medium", label: "Medium", rank: 1 },
  { value: "high", label: "High", rank: 2 },
  { value: "urgent", label: "Urgent", rank: 3 },
] as const;
export const STATUSES = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
] as const;
export const PREP_STATUSES = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "Preparing" },
  { value: "ready", label: "Ready" },
] as const;
export const COURSE_COLORS = ["#2457A7", "#0E9F6E", "#D97706", "#DC2626", "#7C3AED", "#0891B2", "#DB2777", "#4B5563"];

export const labelOf = (list: readonly { value: string; label: string }[], v: string) =>
  list.find((x) => x.value === v)?.label ?? v;

export function friendlyError(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? "Something went wrong";
  if (/Failed to fetch|NetworkError/i.test(msg)) return "Can't reach the server. Check your connection and try again.";
  if (/JWT|expired/i.test(msg)) return "Your session expired. Please sign in again.";
  if (/check constraint/i.test(msg)) return "Some values are invalid. Please review the form.";
  return msg;
}

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (DEMO_MODE) {
        const saved = readDemoRows<Profile>(user!.id, "profile")?.[0];
        return saved ?? {
          id: user!.id, full_name: user!.user_metadata.full_name || "Demo Student", onboarded: true,
          current_semester: "Fall 2026", university_name: "", study_goals: "Stay on top of coursework",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, week_starts_on: 1,
          notify_due_soon: true, notify_due_today: true, notify_overdue: true,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        } satisfies Profile;
      }
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      if (data) return data;
      const { data: created, error: e2 } = await supabase.from("profiles").insert({ id: user!.id }).select().single();
      if (e2) throw e2;
      return created;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (patch: TablesUpdate<"profiles">) => {
      if (DEMO_MODE) {
        const current = readDemoRows<Profile>(user!.id, "profile")?.[0] ?? {
          id: user!.id, full_name: user!.user_metadata.full_name || "Demo Student", onboarded: true,
          current_semester: null, university_name: null, study_goals: null, timezone: "UTC", week_starts_on: 1,
          notify_due_soon: true, notify_due_today: true, notify_overdue: true,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        } satisfies Profile;
        writeDemoRows(user!.id, "profile", [{ ...current, ...patch, updated_at: new Date().toISOString() }]);
        return;
      }
      const { error } = await supabase.from("profiles").update(patch).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
    onError: (e) => toast.error(friendlyError(e)),
  });
}

function useList<T>(table: TableName, order: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: [table, user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (DEMO_MODE) {
        const saved = readDemoRows<T>(user!.id, table);
        if (saved) return saved.sort((a, b) => String((a as unknown as Record<string, unknown>)[order] ?? "").localeCompare(String((b as unknown as Record<string, unknown>)[order] ?? "")));
        const now = new Date();
        const later = (days: number) => new Date(now.getTime() + days * 86400000).toISOString();
        const created = now.toISOString();
        const courseId = "demo-course-cs";
        let rows: unknown[] = [];
        if (table === "courses") rows = [
          { id: courseId, user_id: user!.id, name: "Introduction to Computer Science", course_code: "CS 101", description: "Programming fundamentals and problem solving.", color: "#2457A7", instructor_name: "Dr. Morgan", semester: "Fall 2026", created_at: created, updated_at: created },
          { id: "demo-course-writing", user_id: user!.id, name: "Academic Writing", course_code: "ENG 110", description: "Research, structure, and clear academic prose.", color: "#7C3AED", instructor_name: "Prof. Lee", semester: "Fall 2026", created_at: created, updated_at: created },
          { id: "demo-course-math", user_id: user!.id, name: "Calculus I", course_code: "MATH 120", description: "Limits, derivatives, and applications.", color: "#0E9F6E", instructor_name: "Dr. Patel", semester: "Fall 2026", created_at: created, updated_at: created },
        ];
        if (table === "tasks") rows = [
          { id: "demo-task-reading", user_id: user!.id, title: "Read chapter 4 and take notes", description: "Focus on the core concepts and examples.", course_id: courseId, due_at: later(2), has_due_time: false, priority: "medium", status: "todo", task_type: "reading", estimated_duration_minutes: 45, exam_id: null, completed_at: null, created_at: created, updated_at: created },
          { id: "demo-task-project", user_id: user!.id, title: "Build the project outline", description: "Draft the main sections before the group meeting.", course_id: courseId, due_at: later(4), has_due_time: false, priority: "high", status: "in_progress", task_type: "project", estimated_duration_minutes: 90, exam_id: null, completed_at: null, created_at: created, updated_at: created },
          { id: "demo-task-essay", user_id: user!.id, title: "Submit research response", description: "Upload the final response to the course portal.", course_id: "demo-course-writing", due_at: later(6), has_due_time: true, priority: "urgent", status: "todo", task_type: "assignment", estimated_duration_minutes: 60, exam_id: null, completed_at: null, created_at: created, updated_at: created },
          { id: "demo-task-practice", user_id: user!.id, title: "Complete derivative practice set", description: null, course_id: "demo-course-math", due_at: later(1), has_due_time: false, priority: "high", status: "completed", task_type: "homework", estimated_duration_minutes: 40, exam_id: null, completed_at: created, created_at: created, updated_at: created },
        ];
        if (table === "exams") rows = [{ id: "demo-exam-cs", user_id: user!.id, title: "Computer Science Midterm", course_id: courseId, exam_at: later(12), has_exam_time: false, location_or_format: "Room 204", notes: "Review chapters 1–5", preparation_status: "in_progress", study_goal: "Complete two practice exams", created_at: created, updated_at: created }];
        if (table === "study_sessions") rows = [{ id: "demo-session", user_id: user!.id, title: "Review lecture notes", course_id: courseId, task_id: "demo-task-project", starts_at: later(1), ends_at: later(1.05), status: "planned", created_at: created, updated_at: created }];
        writeDemoRows(user!.id, table, rows as T[]);
        return rows as T[];
      }
      const { data, error } = await supabase.from(table).select("*").order(order, { ascending: true });
      if (error) throw error;
      return data as T[];
    },
  });
}

export const useCourses = () => useList<Course>("courses", "name");
export const useTasks = () => useList<Task>("tasks", "due_at");
export const useExams = () => useList<Exam>("exams", "exam_at");
export const useSessions = () => useList<StudySession>("study_sessions", "starts_at");

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  for (const t of ["courses", "tasks", "exams", "study_sessions"]) qc.invalidateQueries({ queryKey: [t] });
}

export function useSave<N extends TableName>(table: N, successMsg?: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: TablesInsert<N> | TablesUpdate<N> }) => {
      // user_id is never sent from the client: the DB defaults it to auth.uid().
      const clean = { ...(values as Record<string, unknown>) };
      delete clean.user_id;
      if (DEMO_MODE) {
        const rows = readDemoRows<Record<string, unknown>>(user!.id, table) ?? [];
        const now = new Date().toISOString();
        if (id) writeDemoRows(user!.id, table, rows.map((row) => row.id === id ? { ...row, ...clean, updated_at: now } : row));
        else writeDemoRows(user!.id, table, [...rows, { ...clean, id: crypto.randomUUID(), user_id: user!.id, created_at: now, updated_at: now }]);
        return;
      }
      const q = id
        ? supabase.from(table).update(clean as never).eq("id", id)
        : supabase.from(table).insert(clean as never);
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll(qc);
      if (successMsg) toast.success(successMsg);
    },
    onError: (e) => toast.error(friendlyError(e)),
  });
}

export function useDelete(table: TableName, successMsg = "Deleted") {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      if (DEMO_MODE) {
        writeDemoRows(user!.id, table, (readDemoRows<Record<string, unknown>>(user!.id, table) ?? []).filter((row) => row.id !== id));
        return;
      }
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll(qc);
      toast.success(successMsg);
    },
    onError: (e) => toast.error(friendlyError(e)),
  });
}

/** Optimistic complete/reopen toggle that rolls back on error. */
export function useToggleTask() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const key = ["tasks", user?.id];
  return useMutation({
    mutationFn: async (t: Task) => {
      const status = t.status === "completed" ? "todo" : "completed";
      if (DEMO_MODE) {
        writeDemoRows(user!.id, "tasks", (readDemoRows<Task>(user!.id, "tasks") ?? []).map((task) => task.id === t.id ? { ...task, status, completed_at: status === "completed" ? new Date().toISOString() : null } : task));
        return status;
      }
      const { error } = await supabase.from("tasks").update({ status }).eq("id", t.id);
      if (error) throw error;
      return status;
    },
    onMutate: async (t) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Task[]>(key);
      qc.setQueryData<Task[]>(key, (old) =>
        old?.map((x) =>
          x.id === t.id
            ? {
                ...x,
                status: x.status === "completed" ? "todo" : "completed",
                completed_at: x.status === "completed" ? null : new Date().toISOString(),
              }
            : x,
        ),
      );
      return { prev };
    },
    onError: (e, _t, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      toast.error(friendlyError(e));
    },
    onSuccess: (status) => toast.success(status === "completed" ? "Task completed" : "Task reopened"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useLoadDemo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (DEMO_MODE) {
        return;
      }
      const { error } = await supabase.rpc("load_demo_data");
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll(qc);
      toast.success("Sample data added. Items are labelled “(Demo)”.");
    },
    onError: (e) => toast.error(friendlyError(e)),
  });
}
