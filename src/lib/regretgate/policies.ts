import type {
  ActionType,
  FeedbackOffsets,
  PolicyPack,
  PolicyPackId,
  UseCaseId,
  UseCasePolicy,
} from "./types";

export const DEFAULT_THRESHOLDS = {
  nearZeroMax: 15,
  lowMax: 30,
  mediumMax: 70,
  highMax: 100,
};

export const USE_CASE_POLICIES: Record<UseCaseId, UseCasePolicy> = {
  customer_support: {
    id: "customer_support",
    label: "Customer Support Assistant",
    description:
      "Customer-facing chatbot. Tight latency budget; medium impact on refunds and outbound sends.",
    latencyBudgetMs: 200,
    riskAppetite: "balanced",
    thresholds: { ...DEFAULT_THRESHOLDS },
    impactBase: 0.45,
    irreversibilityByAction: {
      reply: 0.25,
      send: 0.55,
      refund: 0.75,
      approve: 0.7,
      execute: 0.65,
      tool_loop: 0.35,
    },
  },
  internal_copilot: {
    id: "internal_copilot",
    label: "Internal Knowledge Copilot",
    description:
      "Employee assistant over mixed-governance knowledge bases. Medium latency; high leakage sensitivity.",
    latencyBudgetMs: 800,
    riskAppetite: "strict",
    thresholds: {
      nearZeroMax: 12,
      lowMax: 28,
      mediumMax: 60,
      highMax: 100,
    },
    impactBase: 0.55,
    irreversibilityByAction: {
      reply: 0.35,
      send: 0.6,
      refund: 0.5,
      approve: 0.65,
      execute: 0.7,
      tool_loop: 0.4,
    },
  },
  decision_support: {
    id: "decision_support",
    label: "Decision Support (Regulated)",
    description:
      "Embedded in regulated workflows. Higher irreversibility; human gate preferred for high regret.",
    latencyBudgetMs: 3000,
    riskAppetite: "strict",
    thresholds: {
      nearZeroMax: 10,
      lowMax: 25,
      mediumMax: 55,
      highMax: 100,
    },
    impactBase: 0.75,
    irreversibilityByAction: {
      reply: 0.4,
      send: 0.7,
      refund: 0.85,
      approve: 0.9,
      execute: 0.88,
      tool_loop: 0.5,
    },
  },
};

export const POLICY_PACKS: Record<PolicyPackId, PolicyPack> = {
  us_internal: {
    id: "us_internal",
    label: "US Internal",
    region: "United States",
    rules: [
      "Block secrets and credentials in outbound content",
      "Flag PII in customer-facing sends",
      "Retain audit trail for approvals > $1,000",
    ],
    scoreBias: 0,
    hardBlockOn: ["secrets", "unsafe", "pii"],
  },
  eu_gdpr: {
    id: "eu_gdpr",
    label: "EU / GDPR",
    region: "European Union",
    rules: [
      "Hard-block personal data leakage without lawful basis",
      "Minimize special-category data in model outputs",
      "Require human review for automated decisions with legal effect",
    ],
    scoreBias: 8,
    hardBlockOn: ["pii", "secrets", "unsafe", "policy_breach"],
  },
  apac_general: {
    id: "apac_general",
    label: "APAC General",
    region: "APAC",
    rules: [
      "Block secrets and unsafe content",
      "Escalate high-impact automated approvals",
      "Prefer receipts on customer financial claims",
    ],
    scoreBias: 3,
    hardBlockOn: ["secrets", "unsafe"],
  },
};

let feedbackOffsets: FeedbackOffsets = {
  scoreBias: 0,
  pFailureBias: 0,
  updates: 0,
};

/** Mutable demo overrides for thresholds (ops UI). */
const thresholdOverrides: Partial<
  Record<UseCaseId, Partial<UseCasePolicy["thresholds"]>>
> = {};

export function getFeedbackOffsets(): FeedbackOffsets {
  return { ...feedbackOffsets };
}

export function applyFeedback(resolution: "approved" | "edited" | "rejected" | "escalated") {
  feedbackOffsets.updates += 1;
  if (resolution === "rejected" || resolution === "escalated") {
    feedbackOffsets.scoreBias = clamp(feedbackOffsets.scoreBias + 2, -15, 20);
    feedbackOffsets.pFailureBias = clamp(
      feedbackOffsets.pFailureBias + 0.03,
      -0.2,
      0.25,
    );
  } else if (resolution === "approved") {
    feedbackOffsets.scoreBias = clamp(feedbackOffsets.scoreBias - 1, -15, 20);
    feedbackOffsets.pFailureBias = clamp(
      feedbackOffsets.pFailureBias - 0.015,
      -0.2,
      0.25,
    );
  } else if (resolution === "edited") {
    feedbackOffsets.scoreBias = clamp(feedbackOffsets.scoreBias + 0.5, -15, 20);
  }
  return getFeedbackOffsets();
}

export function resetFeedback() {
  feedbackOffsets = { scoreBias: 0, pFailureBias: 0, updates: 0 };
}

export function getUseCasePolicy(id: UseCaseId): UseCasePolicy {
  const base = USE_CASE_POLICIES[id];
  const override = thresholdOverrides[id];
  if (!override) return structuredClone(base);
  return {
    ...structuredClone(base),
    thresholds: { ...base.thresholds, ...override },
  };
}

export function listUseCasePolicies(): UseCasePolicy[] {
  return (Object.keys(USE_CASE_POLICIES) as UseCaseId[]).map(getUseCasePolicy);
}

export function updateThresholds(
  id: UseCaseId,
  thresholds: Partial<UseCasePolicy["thresholds"]>,
) {
  thresholdOverrides[id] = { ...thresholdOverrides[id], ...thresholds };
  return getUseCasePolicy(id);
}

export function getPolicyPack(id: PolicyPackId = "us_internal"): PolicyPack {
  return structuredClone(POLICY_PACKS[id]);
}

export function listPolicyPacks(): PolicyPack[] {
  return Object.values(POLICY_PACKS).map((p) => structuredClone(p));
}

export function irreversibilityFor(
  useCase: UseCaseId,
  actionType: ActionType,
): number {
  return getUseCasePolicy(useCase).irreversibilityByAction[actionType];
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
