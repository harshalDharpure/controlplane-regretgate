import { analyzeCost } from "./costSignals";
import { identifyIntent } from "./intent";
import { mapToLadder } from "./ladder";
import { analyzePerformance } from "./performanceSignals";
import { buildReceipt } from "./receipts";
import { estimateRegret } from "./regretEngine";
import { checkResponsibility } from "./responsibility";
import { softRewrite } from "./rewrite";
import { getStore } from "./store";
import { getUseCasePolicy } from "./policies";
import type { Decision, PendingAction, SignalTag } from "./types";

/**
 * Pre-commit control-plane pipeline.
 * Responsibility + cost + performance run conceptually in parallel, then merge.
 */
export function evaluateAction(
  action: PendingAction,
  opts?: { persist?: boolean },
): Decision {
  const started = Date.now();
  const policyPack = action.policyPack ?? "us_internal";
  const persist = opts?.persist !== false;

  const intent = identifyIntent(action);
  const actionWithType: PendingAction = {
    ...action,
    actionType: intent.actionType,
    policyPack,
  };

  // Parallel-style analysis (sync PoC; structured as independent branches)
  const responsibility = checkResponsibility(actionWithType, policyPack);
  const cost = analyzeCost(actionWithType);
  const performance = analyzePerformance(actionWithType);

  const regret = estimateRegret({
    action: actionWithType,
    actionType: intent.actionType,
    useCase: action.useCase,
    policyPack,
    responsibility,
    cost,
    performance,
  });

  const ladder = mapToLadder(regret.score, action.useCase, responsibility);

  const tags = uniqueTags([
    ...responsibility.tags,
    ...(cost.thrash ? (["cost", "thrash"] as SignalTag[]) : []),
    ...(performance.ungrounded
      ? (["performance", "ungrounded"] as SignalTag[])
      : []),
    ...((action.conversationContext?.length ?? 0) > 0
      ? (["compounding"] as SignalTag[])
      : []),
    ...(responsibility.details.pii && performance.ungrounded
      ? (["overlap_hallucination_privacy"] as SignalTag[])
      : []),
  ]);

  const receipt = buildReceipt({
    action: actionWithType,
    responsibility,
    cost,
    performance,
    intervention: ladder.intervention,
  });

  const rewrittenText =
    ladder.intervention === "soft_rewrite" ||
    ladder.intervention === "hold_at_gate"
      ? softRewrite(actionWithType, responsibility, performance)
      : undefined;

  const requiresHuman =
    ladder.intervention === "hold_at_gate" ||
    (ladder.intervention === "hard_block" && responsibility.triggered);

  const allowed =
    ladder.intervention === "pass_instantly" ||
    ladder.intervention === "attach_receipt" ||
    ladder.intervention === "soft_rewrite";

  const policy = getUseCasePolicy(action.useCase);
  const latencyEstimateMs = estimateLatency(ladder.intervention, policy.latencyBudgetMs);

  const decision: Decision = {
    actionId: action.id ?? `act_${Math.random().toString(36).slice(2, 10)}`,
    timestamp: new Date().toISOString(),
    useCase: action.useCase,
    policyPack,
    actionType: intent.actionType,
    intentSummary: intent.summary,
    regret,
    responsibility,
    cost,
    performance,
    tags,
    ladderLevel: ladder.level,
    intervention: ladder.intervention,
    allowed,
    requiresHuman,
    rewrittenText,
    receipt,
    explanation: explain(ladder.intervention, regret.score, responsibility, cost, performance),
    latencyEstimateMs,
  };

  // Ensure evaluate timing doesn't exceed conceptual budget tracking
  void started;

  if (persist) {
    getStore().recordDecision(decision);
  }

  return decision;
}

function estimateLatency(
  intervention: Decision["intervention"],
  budget: number,
): number {
  switch (intervention) {
    case "pass_instantly":
      return Math.min(40, budget);
    case "attach_receipt":
      return Math.min(80, budget);
    case "soft_rewrite":
      return Math.min(180, budget);
    case "hold_at_gate":
      return budget;
    case "hard_block":
      return Math.min(60, budget);
  }
}

function explain(
  intervention: Decision["intervention"],
  score: number,
  responsibility: Decision["responsibility"],
  cost: Decision["cost"],
  performance: Decision["performance"],
): string {
  if (intervention === "hard_block") {
    return `HARD BLOCK (override): ${responsibility.reasons.join("; ") || "critical responsibility risk"}. Expected Regret score ${score} is secondary to safety/policy.`;
  }
  if (intervention === "hold_at_gate") {
    return `High Expected Regret (${score}). Holding at pre-commit gate for proof or human escalation. ${[...performance.reasons, ...cost.reasons].slice(0, 2).join(" ")}`;
  }
  if (intervention === "soft_rewrite") {
    return `Medium Expected Regret (${score}). Soft rewrite applied for light verification before commit.`;
  }
  if (intervention === "attach_receipt") {
    return `Low Expected Regret (${score}). Fast path with receipt attached for auditability.`;
  }
  return `Near-zero Expected Regret (${score}). Fast pass — verification effort deferred where safe.`;
}

function uniqueTags(tags: SignalTag[]): SignalTag[] {
  return [...new Set(tags)];
}
