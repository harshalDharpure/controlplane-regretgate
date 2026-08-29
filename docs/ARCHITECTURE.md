# Architecture

## Placement in the enterprise AI pipeline

RegretGate sits as **pre-commit middleware** between the model/orchestrator and side-effecting tools (send, refund, approve, execute):

```
User / Agent loop → Model output (pending action)
        → RegretGate evaluate (parallel signals)
        → Allow / Rewrite / Hold / Block
        → Tool / Channel / Human queue
        → Audit + feedback
```

This matches how enterprises consume foundation models **via API**: the checker inspects inputs/outputs and action metadata, not model weights.

## Parallel check design

To protect latency budgets:

1. **Responsibility** (PII, secrets, unsafe, policy)  
2. **Performance** (grounding, confidence, consistency proxies)  
3. **Cost** (tokens, tools, retries, thrash)  

Branches are independent, then merged into Expected Regret and the ladder. Responsibility **hard block** short-circuits the normal band path.

## Scoring

```
Expected Regret = P(failure) × Impact × Irreversibility
→ calibrated to 0–100 with use-case, policy pack, and feedback biases
```

| Band (typical) | Intervention |
|----------------|--------------|
| Near-zero | Pass instantly |
| Low | Attach receipt |
| Medium | Soft rewrite |
| High | Hold at gate (HITL) |
| Critical | Hard block |

Exact numeric cutovers are **per use case** (support vs copilot vs decision support).

## Policy & governance

- **Use-case policies:** latency budget, risk appetite, irreversibility by action type  
- **Policy packs:** US Internal, EU/GDPR, APAC General (score bias + hard-block matrix)  
- **Audit events:** every evaluate, HITL resolve, feedback recalibration  
- **Ops tuning:** tighten/loosen thresholds live in the demo to show over/under-flag control  

## Prototype module map

```
src/lib/regretgate/
  pipeline.ts          orchestrator
  intent.ts            action identification
  responsibility.ts    hard-block checks
  costSignals.ts       thrash / waste
  performanceSignals.ts grounding proxies
  regretEngine.ts      Expected Regret
  ladder.ts            intervention mapping
  rewrite.ts           soft rewrite
  receipts.ts          audit artifacts
  policies.ts          use cases + packs + feedback
  store.ts             in-memory audit / HITL / metrics

src/app/api/*/route.ts HTTP surface
src/app/page.tsx       Control Plane UI
src/app/scenarios      Multi-use-case simulator
src/app/ops            Governance dashboard
```

## Non-goals of the PoC

Production PII ML, persistent multi-tenant control plane, live connectors, and perfect automated fact-checking are out of scope. The PoC proves **decision logic and allocation of verification effort**.
