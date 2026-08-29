"use client";

import { useState } from "react";
import { DecisionPanel } from "@/components/DecisionPanel";
import { SCENARIOS } from "@/data/scenarios";
import type { Decision } from "@/lib/regretgate/types";

const MODE_LABEL: Record<string, string> = {
  confidently_wrong: "Confidently wrong",
  quietly_expensive: "Quietly expensive",
  subtly_unsafe: "Subtly unsafe",
  overlap: "Overlap risk",
  compounding: "Compounding",
  safe_pass: "Safe pass",
  policy_variant: "Policy variant",
};

export default function ScenariosPage() {
  const [activeId, setActiveId] = useState(SCENARIOS[0].id);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(false);
  const [compare, setCompare] = useState<{
    us?: Decision;
    eu?: Decision;
  } | null>(null);

  const active = SCENARIOS.find((s) => s.id === activeId) ?? SCENARIOS[0];

  async function run(id: string) {
    const scenario = SCENARIOS.find((s) => s.id === id);
    if (!scenario) return;
    setActiveId(id);
    setLoading(true);
    setCompare(null);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scenario.action),
      });
      const data = await res.json();
      setDecision(data.decision);

      if (scenario.failureMode === "policy_variant") {
        const [usRes, euRes] = await Promise.all([
          fetch("/api/evaluate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...scenario.action,
              policyPack: "us_internal",
              persist: false,
            }),
          }),
          fetch("/api/evaluate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...scenario.action,
              policyPack: "eu_gdpr",
              persist: false,
            }),
          }),
        ]);
        const us = await usRes.json();
        const eu = await euRes.json();
        setCompare({ us: us.decision, eu: eu.decision });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="pt-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Multi-use-case simulator
        </h1>
        <p className="text-[var(--muted)] mt-2 max-w-2xl text-sm leading-relaxed">
          Three enterprise profiles with different latency budgets and risk
          appetites. Run curated failures — including overlap, compounding, and
          geo policy packs — to see RegretGate allocate verification effort.
        </p>
      </header>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        <div className="space-y-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => run(s.id)}
              className={`w-full text-left panel p-4 transition hover:border-[var(--brand)]/50 ${
                activeId === s.id ? "ring-1 ring-[var(--brand)]" : ""
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider text-[var(--brand)]">
                {MODE_LABEL[s.failureMode]}
              </div>
              <div className="font-medium mt-1">{s.title}</div>
              <div className="text-xs text-[var(--muted)] mt-1">{s.blurb}</div>
              <div className="text-[11px] mono text-[var(--muted)] mt-2">
                {s.action.useCase.replaceAll("_", " ")} · expect{" "}
                {s.expectedHighlight}
              </div>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="panel p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs uppercase tracking-widest text-[var(--muted)]">
                  Active scenario
                </div>
                <div className="font-semibold text-lg">{active.title}</div>
              </div>
              <button
                onClick={() => run(active.id)}
                disabled={loading}
                className="rounded-lg bg-[var(--brand)] text-[#042f2e] font-semibold px-4 py-2 text-sm disabled:opacity-50"
              >
                {loading ? "Running…" : "Run scenario"}
              </button>
            </div>
            <pre className="mt-3 text-xs whitespace-pre-wrap bg-[var(--bg)]/60 border border-[var(--line)] rounded-lg p-3 text-[var(--muted)]">
              {active.action.text}
            </pre>
          </div>

          {compare && (
            <div className="grid sm:grid-cols-2 gap-3">
              <CompareCard label="US Internal" decision={compare.us} />
              <CompareCard label="EU / GDPR" decision={compare.eu} />
            </div>
          )}

          {decision ? (
            <DecisionPanel decision={decision} />
          ) : (
            <div className="panel p-10 text-center text-[var(--muted)]">
              Select a scenario and run it through the gate.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CompareCard({
  label,
  decision,
}: {
  label: string;
  decision?: Decision;
}) {
  if (!decision) return null;
  return (
    <div className="panel p-4">
      <div className="text-xs text-[var(--muted)] uppercase tracking-wider">
        {label}
      </div>
      <div className="mt-1 font-semibold capitalize">
        {decision.intervention.replaceAll("_", " ")}
      </div>
      <div className="mono text-sm text-[var(--brand)] mt-1">
        regret {decision.regret.score}
      </div>
    </div>
  );
}
