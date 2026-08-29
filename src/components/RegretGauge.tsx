"use client";

import type { LadderLevel } from "@/lib/regretgate/types";

const COLORS: Record<LadderLevel | "default", string> = {
  near_zero: "#34d399",
  low: "#2dd4bf",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
  default: "#93a0b8",
};

export function RegretGauge({
  score,
  level,
}: {
  score: number;
  level?: LadderLevel;
}) {
  const color = COLORS[level ?? "default"];
  const r = 54;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score)) / 100;
  const offset = c * (1 - pct);

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="var(--line)"
          strokeWidth="10"
        />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
        <div className="mono text-3xl font-semibold" style={{ color }}>
          {score}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-[var(--muted)]">
          Expected Regret
        </div>
      </div>
    </div>
  );
}
