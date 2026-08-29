import type { Metadata } from "next";
import { IBM_Plex_Mono, Sora } from "next/font/google";
import { SiteNav } from "@/components/SiteNav";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plex = IBM_Plex_Mono({
  variable: "--font-plex",
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
    <html lang="en" className={`${sora.variable} ${plex.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <SiteNav />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pb-16 pt-6">
          {children}
        </main>
        <footer className="border-t border-[var(--line)] py-6 text-center text-sm text-[var(--muted)]">
          RegretGate · Minimize Expected Regret · Every action scored · Every high-regret action verified
        </footer>
      </body>
    </html>
  );
}
