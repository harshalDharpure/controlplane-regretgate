import type { PendingAction, PerformanceSignals, ResponsibilityFinding } from "./types";

/** Deterministic soft rewrite for medium-regret path. */
export function softRewrite(
  action: PendingAction,
  responsibility: ResponsibilityFinding,
  performance: PerformanceSignals,
): string {
  let text = action.text;

  // Redact obvious PII-ish spans lightly (demo)
  text = text.replace(
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    "[REDACTED_EMAIL]",
  );
  text = text.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED_SSN]");
  text = text.replace(
    /\b(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g,
    "[REDACTED_PHONE]",
  );

  if (performance.ungrounded || performance.confidenceProxy > 0.7) {
    text = text
      .replace(/\bdefinitely\b/gi, "likely")
      .replace(/\bcertainly\b/gi, "based on available information")
      .replace(/\bguaranteed\b/gi, "expected")
      .replace(/\bwithout (a )?doubt\b/gi, "to the best of our knowledge");
    if (!/\[needs verification\]/i.test(text)) {
      text += "\n\n[needs verification] Claim requires source receipt before commit.";
    }
  }

  if (responsibility.details.pii && !responsibility.hardBlock) {
    text += "\n\n[privacy note] Personal data minimized in this rewrite.";
  }

  // Collapse thrashy repetition
  text = text.replace(/(\btrying again\b[^\n]*\n?){2,}/gi, "Retry halted pending verification.\n");

  return text.trim();
}
