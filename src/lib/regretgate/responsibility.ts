import { getPolicyPack } from "./policies";
import type {
  PendingAction,
  PolicyPackId,
  ResponsibilityFinding,
  SignalTag,
} from "./types";

const EMAIL =
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE =
  /\b(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/;
const SSN = /\b\d{3}-\d{2}-\d{4}\b/;
const CARD = /\b(?:\d[ -]*?){13,19}\b/;
const SECRET =
  /\b(api[_-]?key|secret|password|passwd|bearer\s+[a-z0-9\-._~+/]+=*|sk-[a-z0-9]{10,}|AKIA[0-9A-Z]{16})\b/i;
const UNSAFE =
  /\b(how to (make|build) (a )?bomb|kill yourself|credit card dump|exploit rce)\b/i;
const BIAS =
  /\b(all (women|men|immigrants) are|inferior race|should not hire (women|disabled))\b/i;

export function checkResponsibility(
  action: PendingAction,
  policyPackId: PolicyPackId = "us_internal",
): ResponsibilityFinding {
  const text = [
    action.text,
    ...(action.conversationContext ?? []),
  ].join("\n");

  const pack = getPolicyPack(policyPackId);
  const details = {
    pii: Boolean(
      EMAIL.test(text) ||
        PHONE.test(text) ||
        SSN.test(text) ||
        (CARD.test(text) && /\b(card|visa|mastercard|cvv)\b/i.test(text)),
    ),
    secrets: SECRET.test(text),
    unsafe: UNSAFE.test(text) || BIAS.test(text),
    policyBreach: false,
  };

  // Policy breach: automated approve/refund with legal/financial effect under EU pack
  if (
    policyPackId === "eu_gdpr" &&
    (action.actionType === "approve" ||
      action.actionType === "refund" ||
      /\b(approve|refund|reject claim)\b/i.test(action.text)) &&
    (action.metadata?.amountUsd ?? 0) >= 500
  ) {
    details.policyBreach = true;
  }

  // Fabricated personal detail overlap often also privacy-sensitive under GDPR
  if (
    policyPackId === "eu_gdpr" &&
    /\b(SSN|social security|home address|date of birth|DOB)\b/i.test(text) &&
    !action.metadata?.sourcesAttached
  ) {
    details.policyBreach = true;
    details.pii = true;
  }

  const tags: SignalTag[] = ["responsibility"];
  const reasons: string[] = [];

  if (details.pii) {
    tags.push("pii");
    reasons.push("Potential PII detected in pending action output");
  }
  if (details.secrets) {
    tags.push("secrets");
    reasons.push("Possible secrets / credentials in output");
  }
  if (details.unsafe) {
    tags.push("unsafe");
    reasons.push("Unsafe, harmful, or biased content signals");
  }
  if (details.policyBreach) {
    tags.push("policy_breach");
    reasons.push(`Policy pack ${pack.label} breach risk`);
  }

  const triggered =
    details.pii || details.secrets || details.unsafe || details.policyBreach;

  const hardBlock =
    triggered &&
    ((details.pii && pack.hardBlockOn.includes("pii")) ||
      (details.secrets && pack.hardBlockOn.includes("secrets")) ||
      (details.unsafe && pack.hardBlockOn.includes("unsafe")) ||
      (details.policyBreach && pack.hardBlockOn.includes("policy_breach")));

  return {
    triggered,
    hardBlock,
    reasons,
    tags: triggered ? tags : [],
    details,
  };
}
