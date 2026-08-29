import type {
  CostSignals,
  Decision,
  PerformanceSignals,
  PendingAction,
  Receipt,
  ResponsibilityFinding,
} from "./types";

export function buildReceipt(input: {
  action: PendingAction;
  responsibility: ResponsibilityFinding;
  cost: CostSignals;
  performance: PerformanceSignals;
  intervention: Decision["intervention"];
}): Receipt {
  const sources: string[] = [];
  const toolIds: string[] = [];
  const policyIds: string[] = [];
  const dataProof: string[] = [];
  const notes: string[] = [];

  if (input.action.metadata?.sourcesAttached) {
    sources.push("kb://attached-source-pack");
  } else if (input.performance.ungrounded) {
    notes.push("No ground-truth source available — verification via hold/receipt path");
  }

  if (input.cost.toolCalls > 0) {
    toolIds.push(`tool-calls:${input.cost.toolCalls}`);
  }
  if (input.cost.thrash) {
    toolIds.push("thrash-detector:v1");
    notes.push("Cost-as-regret: thrash path flagged for proof-path optimization");
  }

  policyIds.push(`usecase:${input.action.useCase}`);
  if (input.action.policyPack) {
    policyIds.push(`pack:${input.action.policyPack}`);
  }

  if (input.responsibility.triggered) {
    dataProof.push(
      ...Object.entries(input.responsibility.details)
        .filter(([, v]) => v)
        .map(([k]) => `responsibility:${k}`),
    );
  }

  if (
    input.intervention === "attach_receipt" ||
    input.intervention === "hold_at_gate" ||
    input.intervention === "soft_rewrite"
  ) {
    notes.push("Receipt attached proportional to Expected Regret");
  }

  return { sources, toolIds, policyIds, dataProof, notes };
}
