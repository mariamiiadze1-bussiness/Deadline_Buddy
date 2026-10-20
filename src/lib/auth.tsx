import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { DEMO_MODE, readDemoUser, writeDemoUser, type DemoUser } from "./demo-mode";

type AuthCtx = { session: Session | null; user: User | null; loading: boolean; signOut: () => Promise<void>; startDemo: (name?: string) => void };
const Ctx = createContext<AuthCtx>({ session: null, user: null, loading: true, signOut: async () => {}, startDemo: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  useEffect(() => {
    if (DEMO_MODE) {
      setDemoUser(readDemoUser());
      setLoading(false);
      return;
    }
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setLoading(false);
      if (event === "SIGNED_OUT") qc.clear();
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [qc]);

  return (
    <Ctx.Provider
      value={{
        session,
        user: DEMO_MODE ? demoUser as unknown as User | null : session?.user ?? null,
        loading,
        startDemo: (name = "Demo Student") => {
          const cleanName = name.trim() || "Demo Student";
          const next: DemoUser = { id: "local-demo-student", email: "demo@studyflow.local", user_metadata: { full_name: cleanName } };
          writeDemoUser(next);
          setDemoUser(next);
          qc.clear();
        },
        signOut: async () => {
          if (DEMO_MODE) {
            writeDemoUser(null);
            setDemoUser(null);
            qc.clear();
          } else {
            await supabase.auth.signOut();
          }
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
