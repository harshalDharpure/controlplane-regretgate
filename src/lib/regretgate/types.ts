export type UseCaseId =
  | "customer_support"
  | "internal_copilot"
  | "decision_support";

export type ActionType =
  | "reply"
  | "approve"
  | "send"
  | "execute"
  | "refund"
  | "tool_loop";

export type PolicyPackId = "us_internal" | "eu_gdpr" | "apac_general";

export type LadderLevel =
  | "near_zero"
  | "low"
  | "medium"
  | "high"
  | "critical";

export type Intervention =
  | "pass_instantly"
  | "attach_receipt"
  | "soft_rewrite"
  | "hold_at_gate"
  | "hard_block";

export type SignalTag =
  | "performance"
  | "cost"
  | "responsibility"
  | "overlap_hallucination_privacy"
  | "compounding"
  | "thrash"
  | "ungrounded"
  | "pii"
  | "secrets"
  | "unsafe"
  | "policy_breach";

export interface PendingAction {
  id?: string;
  text: string;
  useCase: UseCaseId;
  actionType?: ActionType;
  policyPack?: PolicyPackId;
  /** Prior turn outputs that may compound risk */
  conversationContext?: string[];
  metadata?: {
    tokens?: number;
    toolCalls?: number;
    retries?: number;
    newInformationGain?: number; // 0..1, low = thrash
    sourcesAttached?: boolean;
    claimedFacts?: number;
    groundedFacts?: number;
    amountUsd?: number;
    latencyBudgetMs?: number;
  };
}

export interface ResponsibilityFinding {
  triggered: boolean;
  hardBlock: boolean;
  reasons: string[];
  tags: SignalTag[];
  details: {
    pii: boolean;
    secrets: boolean;
    unsafe: boolean;
    policyBreach: boolean;
  };
}

export interface CostSignals {
  tokens: number;
  toolCalls: number;
  retries: number;
  thrash: boolean;
  wasteScore: number; // 0..1
  reasons: string[];
}

export interface PerformanceSignals {
  groundingRatio: number; // 0..1
  confidenceProxy: number; // 0..1 (higher = more absolute claims)
  consistencyProxy: number; // 0..1
  ungrounded: boolean;
  reasons: string[];
}

export interface RegretBreakdown {
  pFailure: number; // 0..1
  impact: number; // 0..1
  irreversibility: number; // 0..1
  rawProduct: number;
  score: number; // 0..100
  calibratedBy: string[];
}

export interface Receipt {
  sources: string[];
  toolIds: string[];
  policyIds: string[];
  dataProof: string[];
  notes: string[];
}

export interface Decision {
  actionId: string;
  timestamp: string;
  useCase: UseCaseId;
  policyPack: PolicyPackId;
  actionType: ActionType;
  intentSummary: string;
  regret: RegretBreakdown;
  responsibility: ResponsibilityFinding;
  cost: CostSignals;
  performance: PerformanceSignals;
  tags: SignalTag[];
  ladderLevel: LadderLevel;
  intervention: Intervention;
  allowed: boolean;
  requiresHuman: boolean;
  rewrittenText?: string;
  receipt: Receipt;
  explanation: string;
  latencyEstimateMs: number;
}

export interface UseCasePolicy {
  id: UseCaseId;
  label: string;
  description: string;
  latencyBudgetMs: number;
  riskAppetite: "low" | "balanced" | "strict";
  /** Score thresholds for ladder (exclusive upper bounds for lower bands) */
  thresholds: {
    nearZeroMax: number;
    lowMax: number;
    mediumMax: number;
    highMax: number;
  };
  impactBase: number;
  irreversibilityByAction: Record<ActionType, number>;
}

export interface PolicyPack {
  id: PolicyPackId;
  label: string;
  region: string;
  rules: string[];
  /** Extra threshold shift applied to scores before banding */
  scoreBias: number;
  hardBlockOn: Array<"pii" | "secrets" | "unsafe" | "policy_breach">;
}

export interface HitlItem {
  id: string;
  decision: Decision;
  status: "pending" | "approved" | "edited" | "rejected" | "escalated";
  createdAt: string;
  resolvedAt?: string;
  note?: string;
  editedText?: string;
}

export interface AuditEvent {
  id: string;
  at: string;
  kind:
    | "evaluate"
    | "hitl_resolve"
    | "policy_update"
    | "feedback_recalibrate";
  decision?: Decision;
  summary: string;
  meta?: Record<string, unknown>;
}

export interface MetricsSnapshot {
  actionsScored: number;
  hardBlocks: number;
  holds: number;
  passes: number;
  rewrites: number;
  receiptsAttached: number;
  thrashDetections: number;
  avgRegret: number;
  overrideRate: number;
  holdRate: number;
  simulatedFalsePositiveRate: number;
  simulatedFalseNegativeRate: number;
  alertFatigueProxy: number;
}

export interface FeedbackOffsets {
  /** Additive score bias learned from HITL */
  scoreBias: number;
  pFailureBias: number;
  updates: number;
}
