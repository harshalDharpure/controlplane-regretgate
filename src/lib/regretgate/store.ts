import { applyFeedback, getFeedbackOffsets } from "./policies";
import type {
  AuditEvent,
  Decision,
  FeedbackOffsets,
  HitlItem,
  MetricsSnapshot,
} from "./types";

const globalStore = globalThis as typeof globalThis & {
  __regretGateStore?: RegretGateStore;
};

class RegretGateStore {
  audit: AuditEvent[] = [];
  hitl: HitlItem[] = [];
  decisions: Decision[] = [];
  labeled: Array<{ decisionId: string; wasCorrectGate: boolean }> = [];

  recordDecision(decision: Decision) {
    this.decisions.unshift(decision);
    if (this.decisions.length > 500) this.decisions.pop();

    this.audit.unshift({
      id: `aud_${cryptoRandom()}`,
      at: new Date().toISOString(),
      kind: "evaluate",
      decision,
      summary: `${decision.intervention} · regret ${decision.regret.score} · ${decision.useCase}`,
    });
    if (this.audit.length > 500) this.audit.pop();

    if (decision.requiresHuman) {
      this.hitl.unshift({
        id: `hitl_${cryptoRandom()}`,
        decision,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
    }
  }

  listAudit(limit = 50) {
    return this.audit.slice(0, limit);
  }

  listHitl(status?: HitlItem["status"]) {
    return status ? this.hitl.filter((h) => h.status === status) : [...this.hitl];
  }

  resolveHitl(
    id: string,
    status: Exclude<HitlItem["status"], "pending">,
    note?: string,
    editedText?: string,
  ): { item: HitlItem; offsets: FeedbackOffsets } | null {
    const item = this.hitl.find((h) => h.id === id);
    if (!item || item.status !== "pending") return null;
    item.status = status;
    item.resolvedAt = new Date().toISOString();
    item.note = note;
    item.editedText = editedText;

    const offsets = applyFeedback(status);
    this.audit.unshift({
      id: `aud_${cryptoRandom()}`,
      at: item.resolvedAt,
      kind: "hitl_resolve",
      decision: item.decision,
      summary: `HITL ${status} for ${item.decision.actionId}`,
      meta: { note, editedText, offsets },
    });
    this.audit.unshift({
      id: `aud_${cryptoRandom()}`,
      at: item.resolvedAt,
      kind: "feedback_recalibrate",
      summary: `Threshold offsets updated (scoreBias=${offsets.scoreBias}, pFailureBias=${offsets.pFailureBias})`,
      meta: { ...offsets },
    });

    // Simulate labeling for FP/FN proxies
    const wasCorrectGate =
      status === "approved"
        ? item.decision.intervention !== "hard_block"
        : status === "rejected" || status === "escalated";
    this.labeled.push({ decisionId: item.decision.actionId, wasCorrectGate });

    return { item, offsets };
  }

  metrics(): MetricsSnapshot {
    const n = this.decisions.length || 1;
    const hardBlocks = this.decisions.filter((d) => d.intervention === "hard_block").length;
    const holds = this.decisions.filter((d) => d.intervention === "hold_at_gate").length;
    const passes = this.decisions.filter((d) => d.intervention === "pass_instantly").length;
    const rewrites = this.decisions.filter((d) => d.intervention === "soft_rewrite").length;
    const receiptsAttached = this.decisions.filter(
      (d) => d.intervention === "attach_receipt" || d.receipt.notes.length > 0,
    ).length;
    const thrashDetections = this.decisions.filter((d) => d.cost.thrash).length;
    const avgRegret =
      this.decisions.reduce((s, d) => s + d.regret.score, 0) / (this.decisions.length || 1);

    const resolved = this.hitl.filter((h) => h.status !== "pending");
    const overrides = resolved.filter(
      (h) => h.status === "rejected" || h.status === "edited" || h.status === "escalated",
    ).length;
    const overrideRate = resolved.length ? overrides / resolved.length : 0;
    const holdRate = holds / n;

    const labels = this.labeled;
    const fp =
      labels.length === 0
        ? 0.08
        : labels.filter((l) => !l.wasCorrectGate).length / labels.length;
    const fn = Math.max(0.02, 0.12 - overrideRate * 0.05);

    return {
      actionsScored: this.decisions.length,
      hardBlocks,
      holds,
      passes,
      rewrites,
      receiptsAttached,
      thrashDetections,
      avgRegret: Math.round(avgRegret * 10) / 10,
      overrideRate: round2(overrideRate),
      holdRate: round2(holdRate),
      simulatedFalsePositiveRate: round2(fp),
      simulatedFalseNegativeRate: round2(fn),
      alertFatigueProxy: round2(holdRate * 0.6 + overrideRate * 0.4),
    };
  }

  feedback(): FeedbackOffsets {
    return getFeedbackOffsets();
  }
}

function cryptoRandom() {
  return Math.random().toString(36).slice(2, 10);
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function getStore(): RegretGateStore {
  if (!globalStore.__regretGateStore) {
    globalStore.__regretGateStore = new RegretGateStore();
  }
  return globalStore.__regretGateStore;
}
