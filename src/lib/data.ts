import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useAuth } from "./auth";

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
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: TablesInsert<N> | TablesUpdate<N> }) => {
      // user_id is never sent from the client: the DB defaults it to auth.uid().
      const clean = { ...(values as Record<string, unknown>) };
      delete clean.user_id;
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
  return useMutation({
    mutationFn: async (id: string) => {
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
