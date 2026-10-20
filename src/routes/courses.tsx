import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BookOpen, Check, ExternalLink, FileUp, Plus, Search } from "lucide-react";
import { AppLayout } from "@/components/app/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCourses, useSave, COURSE_COLORS } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/courses")({ component: CoursesPage });

type CatalogCourse = { name: string; code: string; category: string; description: string };

const CATALOG: CatalogCourse[] = [
  { category: "Business", code: "ACC 101", name: "Introduction to Accounting", description: "Financial statements, transactions, and accounting principles." },
  { category: "Business", code: "ACC 201", name: "Managerial Accounting", description: "Cost behavior, budgeting, and decisions for organizations." },
  { category: "Business", code: "FIN 201", name: "Corporate Finance", description: "Investment decisions, valuation, and financing." },
  { category: "Business", code: "MKT 101", name: "Principles of Marketing", description: "Customers, markets, and the marketing mix." },
  { category: "Business", code: "MGT 101", name: "Introduction to Management", description: "Teams, leadership, and organizational fundamentals." },
  { category: "Business", code: "MGT 220", name: "Organizational Behavior", description: "How people and groups work inside organizations." },
  { category: "Business", code: "BUS 210", name: "Business Communication", description: "Clear writing, presentations, and professional communication." },
  { category: "Business", code: "ENT 200", name: "Entrepreneurship", description: "Finding opportunities and developing a business model." },
  { category: "Business", code: "ECO 101", name: "Microeconomics", description: "Markets, incentives, supply, and demand." },
  { category: "Business", code: "ECO 102", name: "Macroeconomics", description: "Growth, inflation, employment, and economic policy." },

  { category: "Computer Science", code: "CS 101", name: "Introduction to Programming", description: "Programming fundamentals, problem solving, and basic algorithms." },
  { category: "Computer Science", code: "CS 120", name: "Data Structures", description: "Lists, trees, graphs, and the algorithms that use them." },
  { category: "Computer Science", code: "CS 201", name: "Algorithms", description: "Algorithm design, analysis, and computational complexity." },
  { category: "Computer Science", code: "CS 210", name: "Web Development", description: "Building interactive websites and web applications." },
  { category: "Computer Science", code: "CS 230", name: "Database Systems", description: "Relational modeling, SQL, and database design." },
  { category: "Computer Science", code: "CS 240", name: "Operating Systems", description: "Processes, memory, filesystems, and concurrency." },
  { category: "Computer Science", code: "CS 250", name: "Computer Networks", description: "Network protocols, routing, and distributed communication." },
  { category: "Computer Science", code: "CS 260", name: "Software Engineering", description: "Designing, building, testing, and maintaining software." },
  { category: "Computer Science", code: "CS 280", name: "Human-Computer Interaction", description: "User-centered design, usability, and interaction." },
  { category: "Computer Science", code: "CS 310", name: "Cybersecurity Fundamentals", description: "Security principles, threats, and defensive practices." },

  { category: "Data & Mathematics", code: "MAT 101", name: "College Algebra", description: "Equations, functions, polynomials, and systems." },
  { category: "Data & Mathematics", code: "MAT 120", name: "Calculus I", description: "Limits, derivatives, and applications of change." },
  { category: "Data & Mathematics", code: "MAT 121", name: "Calculus II", description: "Integration techniques, series, and applications." },
  { category: "Data & Mathematics", code: "MAT 210", name: "Linear Algebra", description: "Vectors, matrices, linear systems, and transformations." },
  { category: "Data & Mathematics", code: "STA 201", name: "Statistics", description: "Data summaries, probability, inference, and interpretation." },
  { category: "Data & Mathematics", code: "STA 220", name: "Applied Data Analysis", description: "Explore datasets and communicate evidence-based findings." },
  { category: "Data & Mathematics", code: "DS 101", name: "Introduction to Data Science", description: "Data workflows, visualization, and introductory modeling." },
  { category: "Data & Mathematics", code: "DS 210", name: "Machine Learning", description: "Supervised learning, model evaluation, and core methods." },
  { category: "Data & Mathematics", code: "MAT 230", name: "Discrete Mathematics", description: "Logic, sets, combinatorics, and graph theory." },
  { category: "Data & Mathematics", code: "STA 310", name: "Probability", description: "Random variables, distributions, and stochastic models." },

  { category: "Health & Science", code: "BIO 101", name: "General Biology", description: "Cells, genetics, evolution, and living systems." },
  { category: "Health & Science", code: "BIO 210", name: "Human Anatomy", description: "The structure and organization of the human body." },
  { category: "Health & Science", code: "CHM 101", name: "General Chemistry", description: "Matter, reactions, bonding, and chemical principles." },
  { category: "Health & Science", code: "PHY 101", name: "General Physics", description: "Motion, forces, energy, and physical systems." },
  { category: "Health & Science", code: "ENV 110", name: "Environmental Science", description: "Ecosystems, climate, and human impacts on the environment." },
  { category: "Health & Science", code: "PSY 101", name: "Introduction to Psychology", description: "Behavior, cognition, development, and mental processes." },
  { category: "Health & Science", code: "NUR 101", name: "Foundations of Nursing", description: "Core nursing practice, care, and clinical principles." },
  { category: "Health & Science", code: "PUB 200", name: "Public Health", description: "Population health, prevention, and health systems." },
  { category: "Health & Science", code: "BIO 240", name: "Genetics", description: "Inheritance, gene expression, and genetic variation." },
  { category: "Health & Science", code: "CHM 220", name: "Organic Chemistry", description: "Structure, reactions, and synthesis of organic compounds." },

  { category: "Social Sciences", code: "SOC 101", name: "Introduction to Sociology", description: "Social groups, institutions, and inequality." },
  { category: "Social Sciences", code: "POL 101", name: "Introduction to Political Science", description: "Political systems, institutions, and public life." },
  { category: "Social Sciences", code: "HIS 101", name: "World History", description: "Major societies, events, and connections across time." },
  { category: "Social Sciences", code: "ANT 101", name: "Cultural Anthropology", description: "Culture, communities, and human ways of life." },
  { category: "Social Sciences", code: "GEO 101", name: "Human Geography", description: "People, places, movement, and the built environment." },
  { category: "Social Sciences", code: "IR 201", name: "International Relations", description: "States, global institutions, conflict, and cooperation." },
  { category: "Social Sciences", code: "PSY 210", name: "Developmental Psychology", description: "Human development from infancy through adulthood." },
  { category: "Social Sciences", code: "SOC 220", name: "Social Research Methods", description: "Research questions, study design, and evidence." },
  { category: "Social Sciences", code: "CRM 101", name: "Criminology", description: "Crime, justice systems, and explanations of offending." },
  { category: "Social Sciences", code: "ECO 240", name: "Behavioral Economics", description: "How psychology shapes choices and economic behavior." },

  { category: "Humanities", code: "ENG 101", name: "Academic Writing", description: "Research, argument, and clear academic prose." },
  { category: "Humanities", code: "ENG 201", name: "Literature and Culture", description: "Reading literary works in their cultural contexts." },
  { category: "Humanities", code: "PHI 101", name: "Introduction to Philosophy", description: "Classic questions about knowledge, ethics, and reality." },
  { category: "Humanities", code: "PHI 220", name: "Ethics", description: "Moral reasoning, ethical frameworks, and real-world cases." },
  { category: "Humanities", code: "REL 101", name: "World Religions", description: "Beliefs, practices, and histories of major traditions." },
  { category: "Humanities", code: "COM 101", name: "Public Speaking", description: "Planning and delivering clear, confident presentations." },
  { category: "Humanities", code: "JRN 110", name: "Media and Society", description: "How media shapes culture, public opinion, and daily life." },
  { category: "Humanities", code: "HIS 210", name: "Modern European History", description: "Political, social, and cultural change in modern Europe." },

  { category: "Arts & Design", code: "ART 101", name: "Foundations of Art", description: "Visual elements, materials, and creative process." },
  { category: "Arts & Design", code: "DES 101", name: "Introduction to Graphic Design", description: "Typography, layout, image, and visual communication." },
  { category: "Arts & Design", code: "UX 201", name: "User Experience Design", description: "Research, prototyping, and designing useful products." },
  { category: "Arts & Design", code: "MUS 101", name: "Music Appreciation", description: "Listening to and understanding music across traditions." },
  { category: "Arts & Design", code: "FIL 110", name: "Introduction to Film", description: "Film language, history, and critical viewing." },
  { category: "Arts & Design", code: "ARC 101", name: "Architectural Design", description: "Space, form, drawing, and introductory design methods." },
  { category: "Arts & Design", code: "PHO 120", name: "Digital Photography", description: "Camera fundamentals, composition, and image editing." },
  { category: "Arts & Design", code: "THR 101", name: "Theatre and Performance", description: "Performance, storytelling, and the foundations of theatre." },

  { category: "Languages", code: "SPA 101", name: "Spanish I", description: "Beginning Spanish conversation, grammar, and vocabulary." },
  { category: "Languages", code: "FRE 101", name: "French I", description: "Beginning French conversation, grammar, and vocabulary." },
  { category: "Languages", code: "GER 101", name: "German I", description: "Beginning German conversation, grammar, and vocabulary." },
  { category: "Languages", code: "JPN 101", name: "Japanese I", description: "Beginning Japanese speaking, reading, and writing." },
  { category: "Languages", code: "CHI 101", name: "Chinese I", description: "Beginning Mandarin conversation and character basics." },
  { category: "Languages", code: "ARA 101", name: "Arabic I", description: "Beginning Arabic conversation, reading, and writing." },
  { category: "Languages", code: "GEO 101L", name: "Georgian Language I", description: "Beginning Georgian vocabulary, conversation, and script." },
  { category: "Languages", code: "ENG 210", name: "Professional English", description: "Clear English for academic and workplace settings." },
];

const CATEGORIES = ["All subjects", ...Array.from(new Set(CATALOG.map((course) => course.category)))];

function CoursesPage() {
  const coursesQuery = useCourses();
  const saveCourse = useSave("courses", "Course added to your plan");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All subjects");
  const [importOpen, setImportOpen] = useState(false);
  const courses = coursesQuery.data ?? [];

  const addedKeys = useMemo(() => new Set(courses.flatMap((course) => [
    course.name.trim().toLowerCase(),
    course.course_code?.trim().toLowerCase(),
  ].filter((value): value is string => !!value))), [courses]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return CATALOG.filter((course) => {
      const matchesCategory = category === "All subjects" || course.category === category;
      const matchesSearch = !needle || `${course.name} ${course.code} ${course.category} ${course.description}`.toLowerCase().includes(needle);
      return matchesCategory && matchesSearch;
    });
  }, [search, category]);

  const addCourse = (course: CatalogCourse, index: number) => {
    saveCourse.mutate({
      values: {
        name: course.name,
        course_code: course.code,
        description: course.description,
        color: COURSE_COLORS[index % COURSE_COLORS.length],
      },
    });
  };

  const importCourse = async (course: { name: string; code: string; description: string }) => {
    await saveCourse.mutateAsync({
      values: {
        name: course.name.trim(),
        course_code: course.code.trim() || null,
        description: course.description.trim() || null,
        color: COURSE_COLORS[courses.length % COURSE_COLORS.length],
      },
    });
    setImportOpen(false);
  };

  return (
    <AppLayout>
      <div className="space-y-7">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">BUILD YOUR SEMESTER</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Explore courses</h1>
            <p className="mt-2 text-muted-foreground">Choose from a course catalog and add the classes you’re taking to your plan.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setImportOpen(true)}><FileUp className="size-4" /> Import from university page</Button>
            <div className="rounded-lg border bg-card px-4 py-2 text-sm">
              <span className="font-semibold">{courses.length}</span><span className="text-muted-foreground"> in your plan</span>
            </div>
          </div>
        </header>

        <section className="card-surface space-y-4 p-4 sm:p-5" aria-label="Search and filter courses">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Search courses, codes, or subjects" aria-label="Search courses" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Course subjects">
            {CATEGORIES.map((item) => (
              <Button key={item} type="button" size="sm" variant={category === item ? "default" : "outline"}
                aria-pressed={category === item} onClick={() => setCategory(item)} className="shrink-0">
                {item}
              </Button>
            ))}
          </div>
        </section>

        {coursesQuery.error && <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Your saved courses couldn’t be loaded. Refresh to try again.</p>}

        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">{filtered.length} {filtered.length === 1 ? "course" : "courses"}</h2>
          {search || category !== "All subjects" ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => { setSearch(""); setCategory("All subjects"); }}>Clear filters</Button>
          ) : null}
        </div>

        {coursesQuery.isLoading ? (
          <p className="card-surface p-10 text-center text-sm text-muted-foreground">Loading your courses…</p>
        ) : filtered.length === 0 ? (
          <div className="card-surface p-10 text-center">
            <p className="font-medium">No courses match that search.</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a different title, course code, or subject.</p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((course) => {
              const alreadyAdded = addedKeys.has(course.name.toLowerCase()) || addedKeys.has(course.code.toLowerCase());
              const originalIndex = CATALOG.indexOf(course);
              return (
                <li key={course.code} className="card-surface flex min-h-48 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary"><BookOpen className="size-5" /></span>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{course.category}</span>
                  </div>
                  <h3 className="mt-4 font-semibold leading-snug">{course.name}</h3>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">{course.code}</p>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{course.description}</p>
                  <Button type="button" size="sm" variant={alreadyAdded ? "secondary" : "default"} className="mt-4 w-full"
                    disabled={alreadyAdded || saveCourse.isPending}
                    onClick={() => addCourse(course, originalIndex)}>
                    {alreadyAdded ? <><Check className="size-4" /> Added</> : <><Plus className="size-4" /> {saveCourse.isPending ? "Adding…" : "Add to my courses"}</>}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <CourseImportDialog open={importOpen} onOpenChange={setImportOpen} onImport={importCourse} isSaving={saveCourse.isPending} />
    </AppLayout>
  );
}

type ImportedCourse = { name: string; code: string; description: string };

function CourseImportDialog({ open, onOpenChange, onImport, isSaving }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (course: ImportedCourse) => Promise<void>;
  isSaving: boolean;
}) {
  const [url, setUrl] = useState("");
  const [pageText, setPageText] = useState("");
  const [course, setCourse] = useState<ImportedCourse | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const reset = () => {
    setUrl("");
    setPageText("");
    setCourse(null);
    setBusy(false);
    setMessage("");
    setError("");
  };

  const parseText = (text: string, titleHint = "") => {
    setError("");
    const parsed = extractCourseDetails(text, titleHint);
    if (!parsed.name) {
      setError("We couldn’t identify a course name. Paste the course title and details from the university page, then try again.");
      return;
    }
    setCourse(parsed);
    setMessage("Review the imported details below and edit anything that needs correction.");
  };

  const fetchPage = async () => {
    setError("");
    let pageUrl: URL;
    try {
      pageUrl = new URL(url.trim());
      if (pageUrl.protocol !== "https:" && pageUrl.protocol !== "http:") throw new Error();
    } catch {
      setError("Enter a valid university page URL starting with http:// or https://.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(pageUrl.href, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error(`The page returned ${response.status}.`);
      const html = await response.text();
      const documentPage = new DOMParser().parseFromString(html, "text/html");
      const heading = documentPage.querySelector("h1")?.textContent?.trim()
        || documentPage.querySelector('meta[property="og:title"]')?.getAttribute("content")?.trim()
        || documentPage.title.trim();
      const description = documentPage.querySelector('meta[name="description"]')?.getAttribute("content")?.trim() ?? "";
      const body = documentPage.body?.innerText ?? documentPage.body?.textContent ?? "";
      setPageText(body);
      parseText([heading, description, body].filter(Boolean).join("\n\n"), heading);
    } catch (fetchError) {
      setMessage("This university page blocked direct access. Copy the course title and details from the page, paste them below, and import from that text.");
      if (fetchError instanceof Error && fetchError.name === "TimeoutError") setMessage("The page took too long to respond. Paste the course details from the page below instead.");
    } finally {
      setBusy(false);
    }
  };

  const submitImport = async () => {
    if (!course?.name.trim()) {
      setError("Course name is required.");
      return;
    }
    try {
      await onImport(course);
      reset();
    } catch {
      // useSave displays the error toast; keep the dialog open so the user can retry.
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) reset(); onOpenChange(nextOpen); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Import from a university page</DialogTitle>
          <DialogDescription>Paste a course page link to try importing its details. If the university blocks direct access, paste the course text instead.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="university-course-url">University course page URL</Label>
          <div className="flex gap-2">
            <Input id="university-course-url" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://university.edu/catalog/course" />
            <Button type="button" variant="outline" onClick={() => void fetchPage()} disabled={busy || !url.trim()}><ExternalLink className="size-4" />{busy ? "Reading…" : "Read page"}</Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="university-course-text">Course page text</Label>
          <Textarea id="university-course-text" rows={5} value={pageText} onChange={(event) => { setPageText(event.target.value); setCourse(null); }} placeholder="Paste the course title, code, and description copied from the university page." />
          <Button type="button" variant="secondary" size="sm" onClick={() => parseText(pageText)} disabled={!pageText.trim()}>Extract course details</Button>
        </div>

        {message && <p className="text-sm text-muted-foreground">{message}</p>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

        {course && (
          <div className="space-y-4 rounded-lg border p-4">
            <p className="text-sm font-medium">Review imported course</p>
            <div className="space-y-2"><Label htmlFor="import-course-name">Course name *</Label><Input id="import-course-name" value={course.name} onChange={(event) => setCourse({ ...course, name: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="import-course-code">Course code</Label><Input id="import-course-code" value={course.code} onChange={(event) => setCourse({ ...course, code: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="import-course-description">Description</Label><Textarea id="import-course-description" rows={3} value={course.description} onChange={(event) => setCourse({ ...course, description: event.target.value })} /></div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={() => void submitImport()} disabled={!course?.name.trim() || busy || isSaving}>{isSaving ? "Adding…" : "Add course"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function extractCourseDetails(text: string, titleHint = ""): ImportedCourse {
  const lines = text.split(/[\r\n]+/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
  const codeMatch = text.match(/\b[A-Z]{2,6}\s*\d{2,4}[A-Z]?\b/);
  const code = codeMatch?.[0]?.replace(/\s+/g, " ") ?? "";
  const codeLine = code ? lines.find((line) => line.includes(codeMatch![0])) ?? "" : "";
  const nameFromCodeLine = codeLine && codeMatch
    ? codeLine.replace(codeMatch[0], "").replace(/^[\s:|–—-]+/, "").replace(/[|–—-]+$/, "").trim()
    : "";
  const cleanHint = titleHint.replace(/\s*[|–—-]\s*[^|–—-]*(university|catalog|course listing).*$/i, "").trim();
  const name = (nameFromCodeLine.length > 2 ? nameFromCodeLine : cleanHint || lines.find((line) => !codeMatch || !line.includes(codeMatch[0])) || "").slice(0, 200);
  const description = lines.find((line) => line !== name && line !== codeLine && line.length >= 40 && line.length <= 500) ?? "";
  return { name, code, description };
}
