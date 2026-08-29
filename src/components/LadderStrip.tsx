import { LADDER_COPY } from "@/lib/regretgate";
import type { LadderLevel } from "@/lib/regretgate/types";

const ORDER: LadderLevel[] = [
  "near_zero",
  "low",
  "medium",
  "high",
  "critical",
];

const BG: Record<LadderLevel, string> = {
  near_zero: "bg-emerald-500/20 border-emerald-400/40",
  low: "bg-teal-500/20 border-teal-400/40",
  medium: "bg-amber-500/20 border-amber-400/40",
  high: "bg-orange-500/20 border-orange-400/40",
  critical: "bg-red-500/25 border-red-400/50",
};

export function LadderStrip({ active }: { active?: LadderLevel }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
      {ORDER.map((level) => {
        const copy = LADDER_COPY[level];
        const isActive = active === level;
        return (
          <div
            key={level}
            className={`ladder-step rounded-xl border px-3 py-3 ${BG[level]} ${
              isActive ? "active ring-1 ring-[var(--brand)]" : "opacity-70"
            }`}
          >
            <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
              {copy.label}
            </div>
            <div className="text-sm font-semibold mt-1">{copy.action}</div>
          </div>
        );
      })}
    </div>
  );
}
