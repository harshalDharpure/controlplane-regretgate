"use client";

import { useMemo, useState, type ReactNode } from "react";
import { DecisionPanel } from "@/components/DecisionPanel";
import { LadderStrip } from "@/components/LadderStrip";
import {
  POLICY_OPTIONS,
  SCENARIOS,
  USE_CASE_OPTIONS,
} from "@/data/scenarios";
import type {
  ActionType,
  Decision,
  PendingAction,
  PolicyPackId,
  UseCaseId,
} from "@/lib/regretgate/types";

const ACTION_TYPES: ActionType[] = [
  "reply",
  "send",
  "approve",
  "refund",
  "execute",
  "tool_loop",
];

export default function ControlPlanePage() {
  const [text, setText] = useState(SCENARIOS[0].action.text);
  const [useCase, setUseCase] = useState<UseCaseId>("customer_support");
  const [policyPack, setPolicyPack] = useState<PolicyPackId>("us_internal");
  const [actionType, setActionType] = useState<ActionType | "auto">("auto");
  const [tokens, setTokens] = useState(200);
  const [toolCalls, setToolCalls] = useState(0);
  const [retries, setRetries] = useState(0);
  const [amountUsd, setAmountUsd] = useState(0);
  const [sourcesAttached, setSourcesAttached] = useState(false);
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [error, setError] = useState<string | null>(null);

  const payload: PendingAction = useMemo(
    () => ({
      text,
      useCase,
      policyPack,
      actionType: actionType === "auto" ? undefined : actionType,
      metadata: {
        tokens,
        toolCalls,
        retries,
        amountUsd: amountUsd || undefined,
        sourcesAttached,
        newInformationGain:
          retries >= 3 || toolCalls >= 3 ? 0.1 : sourcesAttached ? 0.85 : 0.55,
        claimedFacts: sourcesAttached ? 2 : 3,
        groundedFacts: sourcesAttached ? 2 : 0,
      },
    }),
    [
      text,
      useCase,
      policyPack,
      actionType,
      tokens,
      toolCalls,
      retries,
      amountUsd,
      sourcesAttached,
    ],
  );

  async function evaluate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Evaluate failed");
      setDecision(data.decision);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Evaluate failed");
    } finally {
      setLoading(false);
    }
  }

  function loadQuick(id: string) {
    const s = SCENARIOS.find((x) => x.id === id);
    if (!s) return;
    setText(s.action.text);
    setUseCase(s.action.useCase);
    setPolicyPack(s.action.policyPack ?? "us_internal");
    setActionType(s.action.actionType ?? "auto");
    setTokens(s.action.metadata?.tokens ?? 200);
    setToolCalls(s.action.metadata?.toolCalls ?? 0);
    setRetries(s.action.metadata?.retries ?? 0);
    setAmountUsd(s.action.metadata?.amountUsd ?? 0);
    setSourcesAttached(Boolean(s.action.metadata?.sourcesAttached));
    setDecision(null);
  }

  return (
    <div className="space-y-8">
      <section className="border-b border-[var(--line)] pb-6">
        <p className="text-sm text-[var(--muted)]">
          Act with confidence. Verify only when the regret is high.
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--text)]">
          RegretGate
        </h1>
        <p className="mt-3 text-[var(--muted)] max-w-2xl text-sm leading-relaxed">
          Pre-commit AI control plane. Scores every pending action by Expected
          Regret — P(failure) × Impact × Irreversibility — then routes through a
          regret-priced intervention ladder. Responsibility risks hard-block.
        </p>
        <div className="mt-5">
          <LadderStrip />
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="panel p-5 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
            <h2 className="font-semibold text-sm">Pending AI action</h2>
            <select
              className="field max-w-[200px]"
              defaultValue=""
              onChange={(e) => e.target.value && loadQuick(e.target.value)}
            >
              <option value="" disabled>
                Load sample…
              </option>
              {SCENARIOS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            className="field leading-relaxed resize-y min-h-[160px]"
            placeholder="Paste model output / pending action…"
          />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Use case">
              <select
                value={useCase}
                onChange={(e) => setUseCase(e.target.value as UseCaseId)}
                className="field"
              >
                {USE_CASE_OPTIONS.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Policy pack">
              <select
                value={policyPack}
                onChange={(e) => setPolicyPack(e.target.value as PolicyPackId)}
                className="field"
              >
                {POLICY_OPTIONS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Action type">
              <select
                value={actionType}
                onChange={(e) =>
                  setActionType(e.target.value as ActionType | "auto")
                }
                className="field"
              >
                <option value="auto">Auto-detect</option>
                {ACTION_TYPES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Amount USD">
              <input
                type="number"
                min={0}
                value={amountUsd}
                onChange={(e) => setAmountUsd(Number(e.target.value))}
                className="field"
              />
            </Field>
            <Field label="Tokens">
              <input
                type="number"
                min={0}
                value={tokens}
                onChange={(e) => setTokens(Number(e.target.value))}
                className="field"
              />
            </Field>
            <Field label="Tool calls">
              <input
                type="number"
                min={0}
                value={toolCalls}
                onChange={(e) => setToolCalls(Number(e.target.value))}
                className="field"
              />
            </Field>
            <Field label="Retries">
              <input
                type="number"
                min={0}
                value={retries}
                onChange={(e) => setRetries(Number(e.target.value))}
                className="field"
              />
            </Field>
            <Field label="Sources">
              <label className="flex items-center gap-2 text-sm h-[38px]">
                <input
                  type="checkbox"
                  checked={sourcesAttached}
                  onChange={(e) => setSourcesAttached(e.target.checked)}
                />
                Grounding available
              </label>
            </Field>
          </div>

          <button
            onClick={evaluate}
            disabled={loading || !text.trim()}
            className="btn btn-primary w-full"
          >
            {loading ? "Evaluating…" : "Evaluate at gate"}
          </button>
          {error && (
            <p className="text-sm text-[var(--critical)]">{error}</p>
          )}
        </div>

        <div>
          {decision ? (
            <DecisionPanel decision={decision} />
          ) : (
            <div className="panel-muted p-8 h-full min-h-[420px] flex items-center justify-center text-center">
              <div>
                <p className="text-base font-medium text-[var(--text)]">
                  Waiting for a pending action
                </p>
                <p className="mt-2 text-sm max-w-sm mx-auto text-[var(--muted)]">
                  Expected Regret = P(failure) × Impact × Irreversibility.
                  Lightweight triage first; deeper verification only when regret
                  is high.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="label-caps">{label}</span>
      {children}
    </label>
  );
}
