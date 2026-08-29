import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { SiteNav } from "@/components/SiteNav";
import "./globals.css";

const sans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "RegretGate — ControlPlane Checker",
  description:
    "Action-aware AI control plane that allocates verification by Expected Regret. Fast when safe. Strict when consequences matter.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <SiteNav />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-14 pt-8">
          {children}
        </main>
        <footer className="border-t border-[var(--line)] bg-[var(--bg-muted)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-sm text-[var(--muted)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="font-medium text-[var(--text)]">RegretGate</span>
            <span>
              Minimize expected regret · Every action scored · High-regret
              actions verified
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
