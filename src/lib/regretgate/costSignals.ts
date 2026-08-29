import type { CostSignals, PendingAction } from "./types";

export function analyzeCost(action: PendingAction): CostSignals {
  const tokens = action.metadata?.tokens ?? estimateTokens(action.text);
  const toolCalls = action.metadata?.toolCalls ?? countToolMentions(action.text);
  const retries = action.metadata?.retries ?? countRetries(action.text);
  const infoGain = action.metadata?.newInformationGain ?? inferInfoGain(action);

  const thrash =
    (retries >= 3 || toolCalls >= 3) && infoGain < 0.25;

  const wasteScore = clamp(
    (retries / 6) * 0.4 + (toolCalls / 8) * 0.35 + (1 - infoGain) * 0.25,
    0,
    1,
  );

  const reasons: string[] = [];
  if (thrash) {
    reasons.push(
      "Thrash detected: 3+ retries/tool calls with little new information",
    );
  }
  if (tokens > 4000) reasons.push(`High token spend (~${tokens})`);
  if (toolCalls >= 5) reasons.push(`Elevated tool-call volume (${toolCalls})`);
  if (retries >= 2) reasons.push(`Retry pressure (${retries})`);

  return { tokens, toolCalls, retries, thrash, wasteScore, reasons };
}

function estimateTokens(text: string): number {
  return Math.max(32, Math.round(text.split(/\s+/).length * 1.3));
}

function countToolMentions(text: string): number {
  const matches = text.match(/\b(tool|api|search|retrieve|fetch)\b/gi);
  return matches?.length ?? 0;
}

function countRetries(text: string): number {
  const matches = text.match(/\b(retry|retried|trying again|once more)\b/gi);
  return matches?.length ?? 0;
}

function inferInfoGain(action: PendingAction): number {
  if (typeof action.metadata?.newInformationGain === "number") {
    return action.metadata.newInformationGain;
  }
  const ctx = action.conversationContext ?? [];
  if (ctx.length === 0) return 0.6;
  const last = ctx[ctx.length - 1] ?? "";
  const overlap = jaccard(tokenize(last), tokenize(action.text));
  return clamp(1 - overlap, 0, 1);
}

function tokenize(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
