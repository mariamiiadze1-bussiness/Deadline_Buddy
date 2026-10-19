import type { ReactNode } from "react";
import { SiteFooter, SiteNav } from "@/routes/index";

export function StaticPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-16 text-muted-foreground">
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
