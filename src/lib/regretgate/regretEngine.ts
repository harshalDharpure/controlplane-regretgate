import {
  getFeedbackOffsets,
  getPolicyPack,
  getUseCasePolicy,
  irreversibilityFor,
} from "./policies";
import type {
  ActionType,
  CostSignals,
  PerformanceSignals,
  PendingAction,
  PolicyPackId,
  RegretBreakdown,
  ResponsibilityFinding,
  UseCaseId,
} from "./types";

export function estimateRegret(input: {
  action: PendingAction;
  actionType: ActionType;
  useCase: UseCaseId;
  policyPack: PolicyPackId;
  responsibility: ResponsibilityFinding;
  cost: CostSignals;
  performance: PerformanceSignals;
}): RegretBreakdown {
  const policy = getUseCasePolicy(input.useCase);
  const pack = getPolicyPack(input.policyPack);
  const feedback = getFeedbackOffsets();
  const calibratedBy: string[] = [
    `use_case:${policy.id}`,
    `policy_pack:${pack.id}`,
  ];

  let pFailure = 0.15;
  pFailure += (1 - input.performance.groundingRatio) * 0.35;
  pFailure += input.performance.confidenceProxy * 0.12;
  pFailure += (1 - input.performance.consistencyProxy) * 0.15;
  pFailure += input.cost.wasteScore * 0.2;
  if (input.performance.ungrounded) pFailure += 0.12;
  if (input.cost.thrash) pFailure += 0.1;
  if (input.responsibility.triggered) pFailure += 0.2;
  pFailure += feedback.pFailureBias;
  pFailure = clamp(pFailure, 0.02, 0.98);
  if (feedback.pFailureBias !== 0) calibratedBy.push("feedback:pFailure");

  let impact = policy.impactBase;
  const amount = input.action.metadata?.amountUsd ?? 0;
  if (amount > 0) {
    impact = clamp(impact + Math.min(0.35, Math.log10(amount + 1) / 10), 0, 1);
    calibratedBy.push("amount_usd");
  }
  if (input.actionType === "refund" || input.actionType === "approve") {
    impact = clamp(impact + 0.1, 0, 1);
  }
  if (input.responsibility.details.pii || input.responsibility.details.secrets) {
    impact = clamp(impact + 0.15, 0, 1);
  }

  let irreversibility = irreversibilityFor(input.useCase, input.actionType);
  if ((input.action.conversationContext?.length ?? 0) > 0) {
    irreversibility = clamp(irreversibility + 0.08, 0, 1);
    calibratedBy.push("compounding_context");
  }

  const rawProduct = pFailure * impact * irreversibility;
  let score = Math.round(rawProduct * 100 * 2.2); // scale into 0..100 demo range
  score += pack.scoreBias;
  score += feedback.scoreBias;
  if (input.cost.thrash) score += 8;
  if (input.performance.ungrounded) score += 10;
  if (pack.scoreBias) calibratedBy.push("policy_score_bias");
  if (feedback.scoreBias) calibratedBy.push("feedback:score");

  score = clamp(Math.round(score), 0, 100);

  return {
    pFailure: round4(pFailure),
    impact: round4(impact),
    irreversibility: round4(irreversibility),
    rawProduct: round4(rawProduct),
    score,
    calibratedBy,
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function round4(n: number) {
  return Math.round(n * 10000) / 10000;
}
