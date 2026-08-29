import type { ReactNode } from "react";
import type { Decision } from "@/lib/regretgate/types";
import { RegretGauge } from "./RegretGauge";
import { LadderStrip } from "./LadderStrip";

export function DecisionPanel({ decision }: { decision: Decision }) {
  return (
    <div className="space-y-4 animate-rise">
      <div className="panel p-5 grid md:grid-cols-[180px_1fr] gap-6 items-center">
        <RegretGauge score={decision.regret.score} level={decision.ladderLevel} />
        <div>
          <div className="text-xs uppercase tracking-widest text-[var(--muted)]">
            Decision
          </div>
          <h2 className="text-2xl font-semibold mt-1 capitalize">
            {decision.intervention.replaceAll("_", " ")}
          </h2>
          <p className="text-[var(--muted)] mt-2 text-sm leading-relaxed">
            {decision.explanation}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Chip label={decision.actionType} />
            <Chip label={decision.useCase.replaceAll("_", " ")} />
            <Chip label={decision.policyPack.replaceAll("_", " ")} />
            <Chip label={`${decision.latencyEstimateMs}ms path`} />
            {decision.allowed ? (
              <Chip label="allowed" tone="pass" />
            ) : (
              <Chip label="blocked / held" tone="critical" />
            )}
            {decision.requiresHuman && <Chip label="HITL" tone="high" />}
          </div>
        </div>
      </div>

      <LadderStrip active={decision.ladderLevel} />

      <div className="grid md:grid-cols-3 gap-4">
        <StatCard
          title="P(failure) × Impact × Irreversibility"
          body={
            <div className="mono text-sm space-y-1">
              <div>P(f) = {decision.regret.pFailure}</div>
              <div>Impact = {decision.regret.impact}</div>
              <div>Irrev. = {decision.regret.irreversibility}</div>
              <div className="text-[var(--muted)] pt-1">
                raw = {decision.regret.rawProduct}
              </div>
            </div>
          }
        />
        <StatCard
          title="Responsibility check"
          body={
            <div className="text-sm space-y-2">
              <div
                className={
                  decision.responsibility.hardBlock
                    ? "text-[var(--critical)] font-semibold"
                    : "text-[var(--pass)]"
                }
              >
                {decision.responsibility.hardBlock
                  ? "YES → HARD BLOCK"
                  : decision.responsibility.triggered
                    ? "Triggered (policy-dependent)"
                    : "NO override"}
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
          }
        />
        <StatCard
          title="Signals"
          body={
            <div className="text-sm space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {decision.tags.length === 0 && (
                  <span className="text-[var(--muted)]">No elevated tags</span>
                )}
                {decision.tags.map((t) => (
                  <Chip key={t} label={t.replaceAll("_", " ")} />
                ))}
              </div>
              <div className="text-[var(--muted)]">
                grounding {Math.round(decision.performance.groundingRatio * 100)}% ·
                waste {Math.round(decision.cost.wasteScore * 100)}%
                {decision.cost.thrash ? " · thrash" : ""}
              </div>
            </div>
          }
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <StatCard
          title="Intent"
          body={<p className="text-sm text-[var(--muted)]">{decision.intentSummary}</p>}
        />
        <StatCard
          title="Receipt"
          body={
            <div className="text-sm text-[var(--muted)] space-y-1 mono">
              <div>policies: {decision.receipt.policyIds.join(", ") || "—"}</div>
              <div>tools: {decision.receipt.toolIds.join(", ") || "—"}</div>
              <div>proof: {decision.receipt.dataProof.join(", ") || "—"}</div>
              <div>notes: {decision.receipt.notes.join(" · ") || "—"}</div>
            </div>
          }
        />
      </div>

      {decision.rewrittenText && (
        <StatCard
          title="Soft rewrite preview"
          body={
            <pre className="text-sm whitespace-pre-wrap text-[var(--text)] bg-[var(--bg)]/50 rounded-lg p-3 border border-[var(--line)]">
              {decision.rewrittenText}
            </pre>
          }
        />
      )}
    </div>
  );
}

function StatCard({
  title,
  body,
}: {
  title: string;
  body: ReactNode;
}) {
  return (
    <div className="panel p-4">
      <div className="text-xs uppercase tracking-widest text-[var(--muted)] mb-2">
        {title}
      </div>
      {body}
    </div>
  );
}

function Chip({
  label,
  tone,
}: {
  label: string;
  tone?: "pass" | "high" | "critical";
}) {
  const color =
    tone === "pass"
      ? "border-emerald-400/40 text-emerald-300"
      : tone === "high"
        ? "border-orange-400/40 text-orange-300"
        : tone === "critical"
          ? "border-red-400/40 text-red-300"
          : "border-[var(--line)] text-[var(--muted)]";
  return (
    <span
      className={`inline-flex text-[11px] px-2 py-0.5 rounded-full border capitalize ${color}`}
    >
      {label}
    </span>
  );
}
