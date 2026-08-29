import { LADDER_COPY } from "@/lib/regretgate";
import type { LadderLevel } from "@/lib/regretgate/types";

const ORDER: LadderLevel[] = [
  "near_zero",
  "low",
  "medium",
  "high",
  "critical",
];

const ACCENT: Record<LadderLevel, string> = {
  near_zero: "var(--pass)",
  low: "var(--low)",
  medium: "var(--medium)",
  high: "var(--high)",
  critical: "var(--critical)",
};

export function LadderStrip({ active }: { active?: LadderLevel }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-5 border border-[var(--line)]">
      {ORDER.map((level, i) => {
        const copy = LADDER_COPY[level];
        const isActive = active === level;
        return (
          <div
            key={level}
            className={`px-3 py-3 ${
              i > 0 ? "sm:border-l border-t sm:border-t-0 border-[var(--line)]" : ""
            } ${isActive ? "bg-[var(--bg-muted)]" : "bg-[var(--bg)]"}`}
            style={{
              boxShadow: isActive
                ? `inset 0 3px 0 0 ${ACCENT[level]}`
                : undefined,
            }}
          >
            <div className="label-caps">{copy.label}</div>
            <div
              className={`text-sm mt-1 ${
                isActive ? "font-semibold text-[var(--text)]" : "text-[var(--muted)]"
              }`}
            >
              {copy.action}
            </div>
          </div>
        );
      })}
    </div>
  );
}
