import {
  Atom, BarChart3, BookOpen, Briefcase, Calculator, Code2, Dna, FlaskConical,
  Globe2, Languages, Landmark, Laptop, Music2, Palette, PieChart, type LucideIcon,
} from "lucide-react";

type Theme = { label: string; icon: LucideIcon; accent: LucideIcon; colors: [string, string, string]; photo: string };

// Subject photos are served by Unsplash's image CDN. They are decorative backgrounds;
// the subject icon and label remain legible above them.
const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=80`;

const THEMES: { match: RegExp; theme: Theme }[] = [
  { match: /\barts?\b|design|photograph|visual|ux|architecture/i, theme: { label: "Studio", icon: Palette, accent: BookOpen, colors: ["#a855f7", "#6d28d9", "#f0abfc"], photo: photo("photo-1758522276889-ec31a6fa3492") } },
  { match: /history|historic|archaeolog|civilization/i, theme: { label: "History", icon: Landmark, accent: BookOpen, colors: ["#d97706", "#78350f", "#fcd34d"], photo: photo("photo-1659270936482-b00f8a6b0553") } },
  { match: /business|account|finance|management|market|entrepreneur|economic/i, theme: { label: "Business", icon: Briefcase, accent: PieChart, colors: ["#2563eb", "#1e3a8a", "#93c5fd"], photo: photo("photo-1460925895917-afdab827c52f") } },
  { match: /computer|program|software|web|database|cyber|network|operating system/i, theme: { label: "Technology", icon: Laptop, accent: Code2, colors: ["#0891b2", "#164e63", "#67e8f9"], photo: photo("photo-1657524433787-a30cefc92661") } },
  { match: /math|algebra|calculus|statistic|probability|data science|linear algebra/i, theme: { label: "Mathematics", icon: Calculator, accent: BarChart3, colors: ["#059669", "#064e3b", "#6ee7b7"], photo: photo("photo-1635372722656-389f87a941b7") } },
  { match: /biology|genetic|anatomy|nurs|health/i, theme: { label: "Life science", icon: Dna, accent: FlaskConical, colors: ["#16a34a", "#14532d", "#86efac"], photo: photo("photo-1441974231531-c6227db76b6e") } },
  { match: /chemistry|\bchem\b/i, theme: { label: "Chemistry", icon: FlaskConical, accent: Atom, colors: ["#e11d48", "#881337", "#fda4af"], photo: photo("photo-1532094349884-543bc11b234d") } },
  { match: /physics|environment|science/i, theme: { label: "Science", icon: Atom, accent: Globe2, colors: ["#ea580c", "#7c2d12", "#fdba74"], photo: photo("photo-1462331940025-496dfbfc7564") } },
  { match: /sociology|politic|geography|anthropology|criminology|international relation|public health/i, theme: { label: "Society", icon: Globe2, accent: Landmark, colors: ["#0284c7", "#0c4a6e", "#7dd3fc"], photo: photo("photo-1593632717071-218c1d85c663") } },
  { match: /language|spanish|french|german|japanese|chinese|arabic|georgian/i, theme: { label: "Languages", icon: Languages, accent: BookOpen, colors: ["#0d9488", "#134e4a", "#5eead4"], photo: photo("photo-1491841651911-c44c30c34548") } },
  { match: /music|film|theatre|performance/i, theme: { label: "Performing arts", icon: Music2, accent: Palette, colors: ["#db2777", "#831843", "#f9a8d4"], photo: photo("photo-1511379938547-c1f69419868d") } },
  { match: /literature|writing|philosophy|ethics|religion|media|english|humanit/i, theme: { label: "Humanities", icon: BookOpen, accent: Languages, colors: ["#7c3aed", "#312e81", "#c4b5fd"], photo: photo("photo-1743923165242-38b228ee2fa3") } },
];

const DEFAULT_THEME: Theme = { label: "Course", icon: BookOpen, accent: Atom, colors: ["#475569", "#1e293b", "#cbd5e1"], photo: photo("photo-1491841573634-28140fc7ced7") };

function hashText(text: string): number {
  let hash = 0;
  for (const character of text) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return hash;
}

function resolveTheme(name: string, category = "", code = ""): Theme {
  const properties = `${name} ${category} ${code}`;
  return THEMES.find((item) => item.match.test(properties))?.theme ?? DEFAULT_THEME;
}

export function CourseArtwork({ name, category, code, compact = false }: {
  name: string;
  category?: string | null;
  code?: string | null;
  compact?: boolean;
}) {
  const theme = resolveTheme(name, category ?? "", code ?? "");
  const Icon = theme.icon;
  const Accent = theme.accent;
  const variant = hashText(`${name}${code ?? ""}`) % 3;
  const [start, end, highlight] = theme.colors;
  const height = compact ? "h-20 w-24" : "h-36 w-full";

  return (
    <div
      aria-hidden="true"
      className={`relative isolate ${height} shrink-0 overflow-hidden rounded-xl`}
      style={{
        backgroundColor: start,
        backgroundImage: `linear-gradient(125deg, ${start}b8 0%, ${end}78 52%, ${end}c9 100%), radial-gradient(circle at ${20 + variant * 24}% ${28 + variant * 10}%, ${highlight} 0, transparent 34%), url("${theme.photo}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <span className="absolute -right-5 -top-10 size-36 rounded-full border border-white/20" />
      <span className="absolute -bottom-14 left-1/4 size-40 rounded-full border-[18px] border-white/10" />
      <span className="absolute left-5 top-5 grid grid-cols-4 gap-1 opacity-35">
        {Array.from({ length: 16 }, (_, index) => <i key={index} className={`size-1 rounded-full bg-white ${index % (variant + 3) === 0 ? "opacity-100" : "opacity-45"}`} />)}
      </span>
      {!compact && <span className="absolute right-5 top-4 grid size-24 place-items-center rounded-2xl border border-white/25 bg-white/10 shadow-lg backdrop-blur-[2px]">
        <Icon className="size-[4.25rem] text-white drop-shadow-md" strokeWidth={1.35} />
      </span>}
      {compact && <Icon className="absolute right-3 top-3 size-12 text-white/85" strokeWidth={1.35} />}
      <span className={`absolute ${compact ? "bottom-2 left-2 size-7 rounded-md" : "bottom-4 left-5 size-10 rounded-lg"} grid place-items-center border border-white/20 bg-white/15 text-white/90`}>
        <Accent className={compact ? "size-4" : "size-5"} strokeWidth={1.6} />
      </span>
      {!compact && <span className="absolute bottom-4 left-[4.25rem] text-[10px] font-semibold uppercase tracking-[0.22em] text-white/90">{theme.label}</span>}
      {compact && <BarChart3 className="absolute bottom-2 left-3 size-5 text-white/35" strokeWidth={1.25} />}
    </div>
  );
}
