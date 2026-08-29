import { describe, expect, it, beforeEach } from "vitest";
import {
  evaluateAction,
  mapToLadder,
  analyzeCost,
  checkResponsibility,
  resetFeedback,
  applyFeedback,
  getFeedbackOffsets,
} from "@/lib/regretgate";
import { SCENARIOS } from "@/data/scenarios";

describe("RegretGate core", () => {
  beforeEach(() => {
    resetFeedback();
  });

  it("fast-passes a safe grounded FAQ", () => {
    const safe = SCENARIOS.find((s) => s.id === "safe-faq")!;
    const d = evaluateAction(safe.action, { persist: false });
    expect(d.intervention).toBe("pass_instantly");
    expect(d.allowed).toBe(true);
    expect(d.regret.score).toBeLessThanOrEqual(30);
  });

  it("hard-blocks PII / secrets via responsibility override", () => {
    const pii = SCENARIOS.find((s) => s.id === "pii-leak")!;
    const d = evaluateAction(pii.action, { persist: false });
    expect(d.responsibility.hardBlock).toBe(true);
    expect(d.intervention).toBe("hard_block");
    expect(d.ladderLevel).toBe("critical");
  });

  it("detects thrash as quietly expensive", () => {
    const thrash = SCENARIOS.find((s) => s.id === "thrash-loop")!;
    const cost = analyzeCost(thrash.action);
    expect(cost.thrash).toBe(true);
    const d = evaluateAction(thrash.action, { persist: false });
    expect(d.tags).toContain("thrash");
    expect(d.regret.score).toBeGreaterThan(30);
  });

  it("tags overlap hallucination + privacy", () => {
    const overlap = SCENARIOS.find((s) => s.id === "overlap-fabricated-person")!;
    const d = evaluateAction(overlap.action, { persist: false });
    expect(d.tags).toContain("overlap_hallucination_privacy");
  });

  it("holds high-regret compounding approvals", () => {
    const c = SCENARIOS.find((s) => s.id === "compounding-approve")!;
    const d = evaluateAction(c.action, { persist: false });
    expect(["hold_at_gate", "hard_block", "soft_rewrite"]).toContain(
      d.intervention,
    );
    expect(d.regret.score).toBeGreaterThan(40);
    expect(d.tags).toContain("compounding");
  });

  it("maps ladder bands correctly", () => {
    const none = checkResponsibility({
      text: "hello",
      useCase: "customer_support",
    });
    expect(mapToLadder(5, "customer_support", none).intervention).toBe(
      "pass_instantly",
    );
    expect(mapToLadder(25, "customer_support", none).intervention).toBe(
      "attach_receipt",
    );
    expect(mapToLadder(50, "customer_support", none).intervention).toBe(
      "soft_rewrite",
    );
    expect(mapToLadder(80, "customer_support", none).intervention).toBe(
      "hold_at_gate",
    );
  });

  it("EU pack is stricter than US for automated refund scenario", () => {
    const base = SCENARIOS.find((s) => s.id === "policy-eu-refund")!;
    const us = evaluateAction(
      { ...base.action, policyPack: "us_internal" },
      { persist: false },
    );
    const eu = evaluateAction(
      { ...base.action, policyPack: "eu_gdpr" },
      { persist: false },
    );
    expect(eu.regret.score).toBeGreaterThanOrEqual(us.regret.score);
  });

  it("feedback recalibration shifts offsets", () => {
    applyFeedback("rejected");
    applyFeedback("rejected");
    const off = getFeedbackOffsets();
    expect(off.updates).toBe(2);
    expect(off.scoreBias).toBeGreaterThan(0);
  });
});
