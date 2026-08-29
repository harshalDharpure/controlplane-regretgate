"use client";

import type { LadderLevel } from "@/lib/regretgate/types";

const COLORS: Record<LadderLevel | "default", string> = {
  near_zero: "#1b5e3b",
  low: "#1a4d6d",
  medium: "#8a5b00",
  high: "#9a3412",
  critical: "#9b1c1c",
  default: "#5a636e",
};

export function RegretGauge({
  score,
  level,
}: {
  score: number;
  level?: LadderLevel;
}) {
  const color = COLORS[level ?? "default"];
  const pct = Math.min(100, Math.max(0, score));

  return (
    <div className="w-full max-w-[200px]">
      <div className="label-caps mb-2">Expected regret</div>
      <div className="mono text-4xl font-semibold tabular-nums" style={{ color }}>
        {score}
        <span className="text-base font-normal text-[var(--muted)]">/100</span>
      </div>
      <div
        className="mt-3 h-1.5 w-full bg-[var(--bg-inset)]"
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Expected regret score"
      >
        <div
          className="h-full transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] mono text-[var(--muted)]">
        <span>0</span>
        <span>30</span>
        <span>70</span>
        <span>100</span>
      </div>
    </div>
  );
}
