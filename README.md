# RegretGate — ControlPlane Checker

**Act with confidence. Verify only when the regret is high.**

RegretGate is an action-aware AI **control plane** for Accenture Innovation Challenge Round 2 (Problem Track 1: ControlPlane.ai). It shifts oversight from post-hoc detection to **pre-commit risk control**: every pending AI action is scored by Expected Regret, responsibility risks hard-block, and verification effort follows a regret-priced intervention ladder.

```
Expected Regret = P(failure) × Impact × Irreversibility
```

## Why it exists

Enterprises discover AI failures too late across three silent modes:

| Mode | Signal |
|------|--------|
| Confidently wrong | grounding / confidence / consistency |
| Quietly expensive | tokens / tool calls / retries / thrash |
| Subtly unsafe | policy / safety / leakage |

Oversight is usually fragmented (quality evals, cost dashboards, safety filters). RegretGate unifies them at the **pending-action gate**.

## Prototype surfaces

1. **Control Plane** (`/`) — paste or load a pending action; live regret gauge, responsibility check, ladder decision, receipts, soft rewrite
2. **Scenarios** (`/scenarios`) — Customer Support · Internal Copilot · Decision Support, including overlap, compounding, and EU vs US policy variants
3. **Ops** (`/ops`) — HITL queue, audit trail, FP/FN proxies, feedback recalibration, policy tighten/loosen

No API keys required. Engines are deterministic heuristics for a clear demo of the **core mechanism**.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test      # engine unit tests
npm run build # production build
```

## Demo walkthrough (3 minutes)

1. Control Plane → load **Safe FAQ reply** → Evaluate → near-zero fast pass  
2. Scenarios → **Quietly expensive tool thrash** → thrash tag + elevated regret  
3. Scenarios → **Subtly unsafe PII send** → HARD BLOCK override  
4. Scenarios → **Compounding approve spend** → hold at gate → Ops → Approve/Reject → watch feedback offsets move  
5. Scenarios → **Policy variant EU refund** → compare US vs EU packs  

See [`docs/DEMO_VIDEO_NOTES.md`](docs/DEMO_VIDEO_NOTES.md) for a recording storyboard.

**Demo video:** _add public link here after recording_

## Architecture (short)

- **Placement:** pre-commit middleware on AI output / pending actions (I/O layer — works with foundation models consumed via API)
- **Parallel checks:** responsibility + cost + performance signals, then merge into Expected Regret → ladder
- **Ladder:** Near-zero pass → Low receipt → Medium soft rewrite → High hold/HITL → Critical hard block
- **Governance:** per-use-case thresholds, geo/industry policy packs, full audit receipts
- **Feedback:** human resolutions recalibrate score / P(failure) biases

Details: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · Business case: [`docs/BUSINESS_PROPOSAL.md`](docs/BUSINESS_PROPOSAL.md)

## Assumptions (stated)

- Illustrative enterprise with ~tens of thousands of AI interactions/week across three use cases
- Mix of well- and loosely-governed internal sources (simulated via `sourcesAttached` / grounding fields)
- Heuristic detectors — not production ML/PII classifiers
- No proprietary customer data; in-memory audit/HITL store (resets on server restart)
- No reliable real-time ground truth assumed — verification uses receipts, holds, and human escalation

## Team

RegretGate — Accenture Innovation Challenge Round 2 · ControlPlane.ai track

## License

Prototype code provided for challenge evaluation.
