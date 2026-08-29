import type { ReactNode } from "react";
import type { Decision } from "@/lib/regretgate/types";
import { RegretGauge } from "./RegretGauge";
import { LadderStrip } from "./LadderStrip";

export function DecisionPanel({ decision }: { decision: Decision }) {
  return (
    <div className="space-y-4">
      <div className="panel p-5 grid md:grid-cols-[200px_1fr] gap-6 items-start">
        <RegretGauge score={decision.regret.score} level={decision.ladderLevel} />
        <div>
          <div className="label-caps">Decision</div>
          <h2 className="text-xl font-semibold mt-1 capitalize tracking-tight">
            {decision.intervention.replaceAll("_", " ")}
          </h2>
          <p className="text-[var(--muted)] mt-2 text-sm leading-relaxed">
            {decision.explanation}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className="tag">{decision.actionType}</span>
            <span className="tag">{decision.useCase.replaceAll("_", " ")}</span>
            <span className="tag">{decision.policyPack.replaceAll("_", " ")}</span>
            <span className="tag">{decision.latencyEstimateMs}ms path</span>
            {decision.allowed ? (
              <span className="tag tag-pass">Allowed</span>
            ) : (
              <span className="tag tag-critical">Blocked / held</span>
            )}
            {decision.requiresHuman && (
              <span className="tag tag-high">Human review</span>
            )}
          </div>
        </div>
      </div>

      <LadderStrip active={decision.ladderLevel} />

      <div className="grid md:grid-cols-3 gap-3">
        <StatCard title="Regret factors">
          <div className="mono text-sm space-y-1">
            <Row k="P(failure)" v={String(decision.regret.pFailure)} />
            <Row k="Impact" v={String(decision.regret.impact)} />
            <Row k="Irreversibility" v={String(decision.regret.irreversibility)} />
            <Row k="Raw product" v={String(decision.regret.rawProduct)} muted />
          </div>
        </StatCard>
        <StatCard title="Responsibility check">
          <div className="text-sm space-y-2">
            <div
              className={`font-semibold ${
                decision.responsibility.hardBlock
                  ? "text-[var(--critical)]"
                  : "text-[var(--pass)]"
              }`}
            >
              {decision.responsibility.hardBlock
                ? "YES — hard block"
                : decision.responsibility.triggered
                  ? "Triggered (policy-dependent)"
                  : "No override"}
            </div>
            <ul className="text-[var(--muted)] list-disc pl-4 space-y-1">
              {(decision.responsibility.reasons.length
                ? decision.responsibility.reasons
                : ["No PII / secrets / unsafe / policy breach"]
              ).map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </StatCard>
        <StatCard title="Signals">
          <div className="text-sm space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {decision.tags.length === 0 && (
                <span className="text-[var(--muted)]">No elevated tags</span>
              )}
              {decision.tags.map((t) => (
                <span key={t} className="tag">
                  {t.replaceAll("_", " ")}
                </span>
              ))}
            </div>
            <div className="text-[var(--muted)] mono text-xs">
              grounding {Math.round(decision.performance.groundingRatio * 100)}% ·
              waste {Math.round(decision.cost.wasteScore * 100)}%
              {decision.cost.thrash ? " · thrash" : ""}
            </div>
          </div>
        </StatCard>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <StatCard title="Intent">
          <p className="text-sm text-[var(--muted)]">{decision.intentSummary}</p>
        </StatCard>
        <StatCard title="Receipt">
          <div className="text-sm text-[var(--muted)] space-y-1 mono">
            <div>policies: {decision.receipt.policyIds.join(", ") || "—"}</div>
            <div>tools: {decision.receipt.toolIds.join(", ") || "—"}</div>
            <div>proof: {decision.receipt.dataProof.join(", ") || "—"}</div>
            <div>notes: {decision.receipt.notes.join(" · ") || "—"}</div>
          </div>
        </StatCard>
      </div>

      {decision.rewrittenText && (
        <StatCard title="Soft rewrite preview">
          <pre className="text-sm whitespace-pre-wrap text-[var(--text)] bg-[var(--bg-muted)] p-3 border border-[var(--line)] mono">
            {decision.rewrittenText}
          </pre>
        </StatCard>
      )}
    </div>
  );
}

function StatCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="panel p-4">
      <div className="label-caps mb-2">{title}</div>
      {children}
    </div>
  );
}

function Row({
  k,
  v,
  muted,
}: {
  k: string;
  v: string;
  muted?: boolean;
}) {
  return (
    <div className={`flex justify-between gap-3 ${muted ? "text-[var(--muted)]" : ""}`}>
      <span>{k}</span>
      <span>{v}</span>
    </div>
  );
}
