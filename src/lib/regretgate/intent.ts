import type { ActionType, PendingAction } from "./types";

const ACTION_HINTS: Array<{ type: ActionType; patterns: RegExp[] }> = [
  {
    type: "refund",
    patterns: [/refund/i, /chargeback/i, /credit\s+\$?\d/i, /return\s+payment/i],
  },
  {
    type: "approve",
    patterns: [/approve/i, /authorization/i, /sign[- ]off/i, /greenlight/i],
  },
  {
    type: "execute",
    patterns: [/execute/i, /run\s+script/i, /deploy/i, /kubectl/i, /DROP\s+TABLE/i],
  },
  {
    type: "send",
    patterns: [/send\s+(email|message)/i, /mailto:/i, /outbound/i, /notify\s+customer/i],
  },
  {
    type: "tool_loop",
    patterns: [/tool\s*call/i, /retrying/i, /calling\s+api/i, /searching\s+again/i],
  },
  {
    type: "reply",
    patterns: [/./],
  },
];

export function identifyIntent(action: PendingAction): {
  actionType: ActionType;
  summary: string;
} {
  if (action.actionType) {
    return {
      actionType: action.actionType,
      summary: summarize(action.actionType, action.text),
    };
  }

  const text = action.text;
  for (const hint of ACTION_HINTS) {
    if (hint.patterns.some((p) => p.test(text))) {
      return {
        actionType: hint.type,
        summary: summarize(hint.type, text),
      };
    }
  }

  return { actionType: "reply", summary: summarize("reply", text) };
}

function summarize(type: ActionType, text: string): string {
  const snippet = text.replace(/\s+/g, " ").trim().slice(0, 80);
  const labels: Record<ActionType, string> = {
    reply: "Model intends to reply to the user",
    send: "Model intends to send an outbound message",
    approve: "Model intends to approve a decision",
    execute: "Model intends to execute a system action",
    refund: "Model intends to issue a financial refund",
    tool_loop: "Model is looping on tool calls / retries",
  };
  return `${labels[type]}: “${snippet}${text.length > 80 ? "…" : ""}”`;
}
