/** Demo mode keeps the app usable before Supabase is configured. Set VITE_DEMO_MODE=false to use Supabase. */
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== "false";

const SESSION_KEY = "studyflow-demo-session";
const DATA_PREFIX = "studyflow-demo-data:";

export type DemoUser = { id: string; email: string; user_metadata: { full_name: string } };

export function readDemoUser(): DemoUser | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const value = localStorage.getItem(SESSION_KEY);
    return value ? JSON.parse(value) as DemoUser : null;
  } catch {
    return null;
  }
}

export function writeDemoUser(user: DemoUser | null) {
  if (typeof localStorage === "undefined") return;
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
}

export function demoDataKey(userId: string, table: string) {
  return `${DATA_PREFIX}${userId}:${table}`;
}

export function readDemoRows<T>(userId: string, table: string): T[] | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const value = localStorage.getItem(demoDataKey(userId, table));
    return value ? JSON.parse(value) as T[] : null;
  } catch {
    return null;
  }
}

export function writeDemoRows<T>(userId: string, table: string, rows: T[]) {
  if (typeof localStorage !== "undefined") localStorage.setItem(demoDataKey(userId, table), JSON.stringify(rows));
}
