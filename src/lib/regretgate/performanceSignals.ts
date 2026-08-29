import type { PendingAction, PerformanceSignals } from "./types";

const ABSOLUTE =
  /\b(definitely|certainly|guaranteed|always|never|100%|without (a )?doubt|as a fact)\b/i;
const UNGROUNDED_CLAIM =
  /\b(according to (our|the) (records|system)|customer.?s? (SSN|salary|balance) is|policy says|legal requirement)\b/i;

export function analyzePerformance(action: PendingAction): PerformanceSignals {
  const text = action.text;
  const claimed =
    action.metadata?.claimedFacts ??
    Math.max(1, (text.match(/\./g)?.length ?? 1));
  const grounded =
    action.metadata?.groundedFacts ??
    (action.metadata?.sourcesAttached ? Math.ceil(claimed * 0.8) : 0);

  const groundingRatio = clamp(grounded / Math.max(claimed, 1), 0, 1);
  const confidenceProxy = ABSOLUTE.test(text) ? 0.85 : 0.45;
  const consistencyProxy = inferConsistency(action);
  const ungrounded =
    groundingRatio < 0.35 &&
    (UNGROUNDED_CLAIM.test(text) || confidenceProxy > 0.7 || claimed >= 2);

  const reasons: string[] = [];
  if (ungrounded) {
    reasons.push(
      "Low grounding vs confident claims (no reliable real-time ground truth attached)",
    );
  }
  if (confidenceProxy > 0.7) {
    reasons.push("High-confidence linguistic markers without proof");
  }
  if (consistencyProxy < 0.5) {
    reasons.push("Inconsistency with prior conversation turns");
  }
  if (!action.metadata?.sourcesAttached && UNGROUNDED_CLAIM.test(text)) {
    reasons.push("Factual claim pattern with no sources attached");
  }

  return {
    groundingRatio,
    confidenceProxy,
    consistencyProxy,
    ungrounded,
    reasons,
  };
}

function inferConsistency(action: PendingAction): number {
  const ctx = action.conversationContext ?? [];
  if (ctx.length === 0) return 0.75;
  const prior = ctx.join(" ").toLowerCase();
  const current = action.text.toLowerCase();
  // Naive flip detection
  const flips =
    (/\bapproved\b/.test(prior) && /\breject/.test(current)) ||
    (/\breject/.test(prior) && /\bapproved\b/.test(current)) ||
    (/\b\$\d+/.test(prior) &&
      /\b\$\d+/.test(current) &&
      extractMoney(prior) !== extractMoney(current));
  return flips ? 0.3 : 0.8;
}

function extractMoney(s: string): string | null {
  const m = s.match(/\$\s?[\d,]+(?:\.\d+)?/);
  return m?.[0] ?? null;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
