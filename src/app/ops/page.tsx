"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  AuditEvent,
  FeedbackOffsets,
  HitlItem,
  MetricsSnapshot,
  UseCasePolicy,
  PolicyPack,
} from "@/lib/regretgate/types";

export default function OpsPage() {
  const [metrics, setMetrics] = useState<MetricsSnapshot | null>(null);
  const [feedback, setFeedback] = useState<FeedbackOffsets | null>(null);
  const [hitl, setHitl] = useState<HitlItem[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [useCases, setUseCases] = useState<UseCasePolicy[]>([]);
  const [packs, setPacks] = useState<PolicyPack[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [m, h, a, p] = await Promise.all([
      fetch("/api/metrics").then((r) => r.json()),
      fetch("/api/hitl?status=pending").then((r) => r.json()),
      fetch("/api/audit?limit=30").then((r) => r.json()),
      fetch("/api/policies").then((r) => r.json()),
    ]);
    setMetrics(m.metrics);
    setFeedback(m.feedback);
    setHitl(h.items);
    setAudit(a.events);
    setUseCases(p.useCases);
    setPacks(p.policyPacks);
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 4000);
    return () => clearInterval(t);
  }, [refresh]);

  async function resolve(
    id: string,
    status: "approved" | "edited" | "rejected" | "escalated",
  ) {
    setBusy(id);
    try {
      await fetch("/api/hitl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status,
          note: `Resolved as ${status} from Ops demo`,
          editedText:
            status === "edited"
              ? "Human-edited safer version of the pending action."
              : undefined,
        }),
      });
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  async function tighten(useCase: UseCasePolicy["id"]) {
    const current = useCases.find((u) => u.id === useCase);
    if (!current) return;
    await fetch("/api/policies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        useCase,
        thresholds: {
          mediumMax: Math.max(40, current.thresholds.mediumMax - 5),
          lowMax: Math.max(15, current.thresholds.lowMax - 2),
        },
      }),
    });
    await refresh();
  }

  async function loosen(useCase: UseCasePolicy["id"]) {
    const current = useCases.find((u) => u.id === useCase);
    if (!current) return;
    await fetch("/api/policies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        useCase,
        thresholds: {
          mediumMax: Math.min(85, current.thresholds.mediumMax + 5),
          lowMax: Math.min(40, current.thresholds.lowMax + 2),
        },
      }),
    });
    await refresh();
  }

  return (
    <div className="space-y-6">
      <header className="pt-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Ops & governance
        </h1>
        <p className="text-[var(--muted)] mt-2 max-w-2xl text-sm leading-relaxed">
          HITL queue, audit receipts, feedback recalibration, and deliberate
          over/under-flag tuning. Metrics are illustrative for stakeholder
          trust conversations — not production telemetry.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric
          label="Actions scored"
          value={String(metrics?.actionsScored ?? 0)}
        />
        <Metric
          label="Avg regret"
          value={String(metrics?.avgRegret ?? 0)}
        />
        <Metric
          label="Hard blocks"
          value={String(metrics?.hardBlocks ?? 0)}
        />
        <Metric label="Holds" value={String(metrics?.holds ?? 0)} />
        <Metric
          label="Thrash catches"
          value={String(metrics?.thrashDetections ?? 0)}
        />
        <Metric
          label="Sim FP rate"
          value={`${Math.round((metrics?.simulatedFalsePositiveRate ?? 0) * 100)}%`}
        />
        <Metric
          label="Sim FN rate"
          value={`${Math.round((metrics?.simulatedFalseNegativeRate ?? 0) * 100)}%`}
        />
        <Metric
          label="Alert fatigue proxy"
          value={`${Math.round((metrics?.alertFatigueProxy ?? 0) * 100)}%`}
        />
      </div>

      {feedback && (
        <div className="panel p-4 flex flex-wrap gap-4 items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-[var(--muted)]">
              Feedback offsets
            </div>
            <div className="mono text-sm mt-1">
              scoreBias={feedback.scoreBias} · pFailureBias=
              {feedback.pFailureBias} · updates={feedback.updates}
            </div>
          </div>
          <p className="text-xs text-[var(--muted)] max-w-md">
            Human decisions recalibrate thresholds — rejected/escalated raises
            caution; approved eases it. This is how over/under-flagging is tuned
            rather than “solved away.”
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="panel p-4 space-y-3">
          <h2 className="font-semibold">HITL queue</h2>
          {hitl.length === 0 && (
            <p className="text-sm text-[var(--muted)]">
              No pending holds. Run a high-regret scenario first.
            </p>
          )}
          {hitl.map((item) => (
            <div
              key={item.id}
              className="border border-[var(--line)] rounded-xl p-3 space-y-2"
            >
              <div className="flex justify-between gap-2 text-sm">
                <span className="font-medium capitalize">
                  {item.decision.intervention.replaceAll("_", " ")} · regret{" "}
                  {item.decision.regret.score}
                </span>
                <span className="text-[var(--muted)] mono text-xs">
                  {item.id}
                </span>
              </div>
              <p className="text-xs text-[var(--muted)] line-clamp-2">
                {item.decision.intentSummary}
              </p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    "approved",
                    "edited",
                    "rejected",
                    "escalated",
                  ] as const
                ).map((s) => (
                  <button
                    key={s}
                    disabled={busy === item.id}
                    onClick={() => resolve(item.id, s)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-[var(--line)] hover:border-[var(--brand)] capitalize disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="panel p-4 space-y-3">
          <h2 className="font-semibold">Audit receipts</h2>
          <div className="max-h-[420px] overflow-auto space-y-2">
            {audit.length === 0 && (
              <p className="text-sm text-[var(--muted)]">
                Audit log empty — evaluate actions to populate.
              </p>
            )}
            {audit.map((e) => (
              <div
                key={e.id}
                className="text-xs border-b border-[var(--line)] pb-2"
              >
                <div className="flex justify-between gap-2">
                  <span className="text-[var(--brand)] mono">{e.kind}</span>
                  <span className="text-[var(--muted)] mono">
                    {new Date(e.at).toLocaleTimeString()}
                  </span>
                </div>
                <div className="mt-0.5 text-[var(--muted)]">{e.summary}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel p-4 space-y-4">
        <h2 className="font-semibold">Policy layer</h2>
        <div className="grid md:grid-cols-3 gap-3">
          {useCases.map((u) => (
            <div
              key={u.id}
              className="border border-[var(--line)] rounded-xl p-3 space-y-2"
            >
              <div className="font-medium text-sm">{u.label}</div>
              <div className="text-[11px] text-[var(--muted)]">
                latency ≤ {u.latencyBudgetMs}ms · appetite {u.riskAppetite}
              </div>
              <div className="mono text-[11px] text-[var(--muted)]">
                bands: {u.thresholds.nearZeroMax}/{u.thresholds.lowMax}/
                {u.thresholds.mediumMax}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => tighten(u.id)}
                  className="text-xs px-2 py-1 rounded-lg border border-[var(--line)]"
                >
                  Tighten
                </button>
                <button
                  onClick={() => loosen(u.id)}
                  className="text-xs px-2 py-1 rounded-lg border border-[var(--line)]"
                >
                  Loosen
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {packs.map((p) => (
            <div
              key={p.id}
              className="border border-[var(--line)] rounded-xl p-3"
            >
              <div className="font-medium text-sm">{p.label}</div>
              <div className="text-[11px] text-[var(--muted)]">{p.region}</div>
              <ul className="mt-2 text-[11px] text-[var(--muted)] list-disc pl-4 space-y-1">
                {p.rules.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel p-3">
      <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
        {label}
      </div>
      <div className="mono text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}
