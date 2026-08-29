import { getUseCasePolicy } from "./policies";
import type {
  Intervention,
  LadderLevel,
  ResponsibilityFinding,
  UseCaseId,
} from "./types";

export function mapToLadder(
  score: number,
  useCase: UseCaseId,
  responsibility: ResponsibilityFinding,
): { level: LadderLevel; intervention: Intervention } {
  if (responsibility.hardBlock) {
    return { level: "critical", intervention: "hard_block" };
  }

  const t = getUseCasePolicy(useCase).thresholds;

  if (score <= t.nearZeroMax) {
    return { level: "near_zero", intervention: "pass_instantly" };
  }
  if (score <= t.lowMax) {
    return { level: "low", intervention: "attach_receipt" };
  }
  if (score <= t.mediumMax) {
    return { level: "medium", intervention: "soft_rewrite" };
  }
  if (score <= t.highMax) {
    return { level: "high", intervention: "hold_at_gate" };
  }
  return { level: "critical", intervention: "hard_block" };
}

export const LADDER_COPY: Record<
  LadderLevel,
  { label: string; action: string; blurb: string }
> = {
  near_zero: {
    label: "Near-zero",
    action: "Pass instantly",
    blurb: "Low-risk actions proceed with minimal latency.",
  },
  low: {
    label: "Low",
    action: "Attach receipt",
    blurb: "Proceed with documentation for auditability.",
  },
  medium: {
    label: "Medium",
    action: "Soft rewrite",
    blurb: "Refine output before commit — light verification.",
  },
  high: {
    label: "High",
    action: "Hold at gate",
    blurb: "Pre-commit gate: proof, rewrite, or human escalation.",
  },
  critical: {
    label: "Critical",
    action: "Hard block",
    blurb: "Responsibility override — action stopped.",
  },
};
