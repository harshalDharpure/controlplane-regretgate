"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Control Plane" },
  { href: "/scenarios", label: "Scenarios" },
  { href: "/ops", label: "Ops" },
];

export function SiteNav() {
  const pathname = usePathname();
  return (
    <header className="border-b border-[var(--line)] bg-[var(--bg)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-baseline gap-3 min-w-0">
          <span className="text-base font-semibold tracking-tight text-[var(--text)]">
            RegretGate
          </span>
          <span className="hidden sm:inline text-xs text-[var(--muted)] border-l border-[var(--line)] pl-3">
            ControlPlane Checker
          </span>
        </Link>
        <nav className="flex items-center gap-5">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm pb-0.5 border-b-2 ${
                  active
                    ? "border-[var(--text)] text-[var(--text)] font-medium"
                    : "border-transparent text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
