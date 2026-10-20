import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, FileUp, FolderOpen, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/app/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { useCourses } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/syllabus")({ component: SyllabusPage });

const BUCKET = "syllabi";
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];
const NO_COURSE = "__none";

function fileMimeType(file: File): string {
  if (file.type) return file.type;
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (extension === ".pdf") return "application/pdf";
  if (extension === ".docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  return "application/msword";
}

type StoredFile = {
  id: string;
  name: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

function SyllabusContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const coursesQuery = useCourses();
  const fileInput = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [courseId, setCourseId] = useState(NO_COURSE);
  const [validationError, setValidationError] = useState("");
  const courses = coursesQuery.data ?? [];
  const courseById = useMemo(() => new Map(courses.map((course) => [course.id, course])), [courses]);

  const filesQuery = useQuery({
    queryKey: ["syllabi", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(BUCKET).list(user!.id, {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      });
      if (error) throw error;
      return (data ?? []).filter((item) => item.id).map((item) => ({
        id: item.id!,
        name: item.name,
        created_at: item.created_at ?? "",
        metadata: item.metadata as Record<string, unknown> | null,
      })) as StoredFile[];
    },
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Sign in to upload a syllabus.");
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = user.id + "/" + crypto.randomUUID() + "-" + safeName;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: fileMimeType(file),
        upsert: false,
        metadata: { original_name: file.name, course_id: courseId === NO_COURSE ? null : courseId },
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setSelectedFile(null);
      setValidationError("");
      if (fileInput.current) fileInput.current.value = "";
      await queryClient.invalidateQueries({ queryKey: ["syllabi", user?.id] });
      toast.success("Syllabus uploaded");
    },
    onError: (error: Error) => {
      const message = /bucket.*not found|not found.*bucket/i.test(error.message)
        ? "Syllabus storage is not configured yet. Ask your project administrator to apply the syllabus storage setup."
        : error.message || "The syllabus could not be uploaded.";
      toast.error(message);
    },
  });

  const chooseFile = (file: File | null) => {
    setSelectedFile(null);
    setValidationError("");
    if (!file) return;
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setValidationError("Choose a PDF, DOC, or DOCX file.");
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setValidationError("The file must be 20 MB or smaller.");
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    setSelectedFile(file);
  };

  const downloadFile = async (file: StoredFile) => {
    if (!user) return;
    try {
      const { data, error } = await supabase.storage.from(BUCKET).download(user.id + "/" + file.name);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = String(file.metadata?.original_name ?? file.name.replace(/^[0-9a-f-]{36}-/, ""));
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error((error as Error).message || "The syllabus could not be downloaded.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <header>
        <p className="text-sm font-medium text-primary">COURSE MATERIALS</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Upload a syllabus</h1>
        <p className="mt-2 text-muted-foreground">Keep your syllabus files with your courses so they’re easy to find later.</p>
      </header>

      <section className="card-surface space-y-5 p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary"><FileUp className="size-5" /></span>
          <div>
            <h2 className="font-semibold">Add a syllabus file</h2>
            <p className="mt-1 text-sm text-muted-foreground">PDF or Word document, up to 20 MB. Files are private to your account.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[minmax(200px,1fr)_minmax(220px,0.7fr)] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="syllabus-file">Syllabus file</Label>
            <Input ref={fileInput} id="syllabus-file" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => chooseFile(event.target.files?.[0] ?? null)} />
            {selectedFile && <p className="text-xs text-muted-foreground">{selectedFile.name} · {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</p>}
            {validationError && <p role="alert" className="text-xs text-destructive">{validationError}</p>}
          </div>
          <div className="space-y-2">
            <Label>Course (optional)</Label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger aria-label="Attach syllabus to a course"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_COURSE}>No specific course</SelectItem>
                {courses.map((course) => <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button type="button" disabled={!selectedFile || upload.isPending} onClick={() => selectedFile && upload.mutate(selectedFile)}>
          {upload.isPending ? <><Loader2 className="size-4 animate-spin" /> Uploading…</> : <><Upload className="size-4" /> Upload syllabus</>}
        </Button>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Your uploaded syllabi</h2>
          <p className="mt-1 text-sm text-muted-foreground">Files stay private and can be downloaded from here.</p>
        </div>

        {filesQuery.error ? (
          <div className="card-surface p-5 text-sm text-muted-foreground">Syllabus storage isn’t available yet. Your project administrator needs to apply the syllabus storage setup before uploads can be used.</div>
        ) : filesQuery.isLoading ? (
          <div className="card-surface p-8 text-center text-sm text-muted-foreground">Loading your files…</div>
        ) : filesQuery.data?.length ? (
          <ul className="card-surface divide-y px-4">
            {filesQuery.data.map((file) => {
              const linkedCourse = typeof file.metadata?.course_id === "string" ? courseById.get(file.metadata.course_id) : undefined;
              const originalName = String(file.metadata?.original_name ?? file.name.replace(/^[0-9a-f-]{36}-/, ""));
              return (
                <li key={file.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary"><FileText className="size-5" /></span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{originalName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{linkedCourse?.name ?? "General"}{file.created_at ? " · " + new Date(file.created_at).toLocaleDateString() : ""}</p>
                    </div>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => void downloadFile(file)}>Download</Button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="card-surface p-8 text-center">
            <FolderOpen className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 font-medium">No syllabi uploaded yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Upload a PDF or Word syllabus to keep it with your study plan.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function SyllabusPage() {
  return <AppLayout><SyllabusContent /></AppLayout>;
}
