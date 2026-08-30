# RegretGate — ControlPlane Checker

**Act with confidence. Verify only when the regret is high.**

Public repo: [github.com/harshalDharpure/controlplane-regretgate](https://github.com/harshalDharpure/controlplane-regretgate)

---

## Round 2 submission uploads

Ready-to-upload files are in [`submission/`](submission/):

| Form field | File |
|------------|------|
| README document (PDF) | [`submission/RegretGate_README.pdf`](submission/RegretGate_README.pdf) |
| Business Proposal (PDF) | [`submission/RegretGate_Business_Proposal.pdf`](submission/RegretGate_Business_Proposal.pdf) |
| Business Proposal (PPTX) | [`submission/RegretGate_Business_Proposal.pptx`](submission/RegretGate_Business_Proposal.pptx) |
| Public GitHub link | `https://github.com/harshalDharpure/controlplane-regretgate` |
| Prototype video (mp4/mov) | **Record locally** using [`docs/DEMO_VIDEO_NOTES.md`](docs/DEMO_VIDEO_NOTES.md) |

Regenerate docs anytime:

```bash
python scripts/generate_submission_docs.py
```

---

## What this project is about

**RegretGate** is an action-aware AI **control plane** built for the Accenture Innovation Challenge Round 2 (**Problem Track 1: ControlPlane.ai**).

Enterprises use generative AI across chatbots, internal copilots, and regulated decision tools. Failures often appear only **after** the model has already acted — wrong answers, wasted compute, or privacy/policy breaches.

RegretGate sits **before commit** (before reply / send / refund / approve / execute). For every pending AI action it:

1. Identifies **intent** (what the model is trying to do)
2. Estimates **Expected Regret**
3. Runs a **responsibility** check (PII, secrets, unsafe content, policy)
4. Routes the action through a **regret-priced intervention ladder**
5. Logs an **audit receipt** and can escalate to a **human**

### Core formula

```
Expected Regret = P(failure) × Impact × Irreversibility
```

Score is calibrated to **0–100**. Low regret → move fast. High regret → verify, rewrite, or hold. Responsibility risks can **hard-block** regardless of score.

### Three silent failure modes it addresses

| Failure mode | Meaning | Example signal |
|--------------|---------|----------------|
| **Confidently wrong** | Hallucinations / poor decisions delivered with certainty | Low grounding, absolute language |
| **Quietly expensive** | Excess tokens, tool calls, retries, agent thrash | 3+ retries/tools with little new information |
| **Subtly unsafe** | Bias, leakage, policy violations | PII, secrets, unsafe content, geo policy breach |

---

## How it is helpful

| Who benefits | How RegretGate helps |
|--------------|----------------------|
| **Business / process owners** | Dangerous or irreversible actions (refunds, approvals) are held for proof or human review instead of executing silently |
| **Risk, privacy & compliance** | Hard blocks for leakage/secrets; policy packs (US / EU-GDPR / APAC); full audit trail per decision |
| **AI / platform teams** | One gate across many use cases with different latency and risk appetites — not one blunt filter for everything |
| **Finance / FinOps** | Thrash detection surfaces quietly expensive agent loops before cost compounds |
| **Human reviewers** | HITL queue only when regret is high — reduces alert fatigue vs flagging everything |

**In short:** faster where it is safe, stricter where consequences matter — shifting AI safety from post-hoc postmortems to **pre-commit control**.

---

## What’s in this prototype

| Page | URL | Purpose |
|------|-----|---------|
| **Control Plane** | `/` | Paste or load a pending AI action → see score, ladder, hard block, rewrite, receipts |
| **Scenarios** | `/scenarios` | One-click demos for support, internal copilot, decision support (incl. overlap & policy variants) |
| **Ops** | `/ops` | HITL queue, audit log, metrics, feedback recalibration, policy tighten/loosen |

**Tech stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS · Vitest  

**No API keys required.** Scoring uses deterministic heuristics so judges can run the full demo offline.

---

## Prerequisites

Install these before running:

1. **Node.js** 20 or newer ([nodejs.org](https://nodejs.org/))
2. **npm** (comes with Node.js)
3. **Git** (to clone the repo)

Check versions:

```bash
node -v
npm -v
```

---

## How to run the complete application

### Step 1 — Clone the repository

```bash
git clone https://github.com/harshalDharpure/controlplane-regretgate.git
cd controlplane-regretgate
```

If you already have the folder locally:

```bash
cd path/to/controlplane-regretgate
```

### Step 2 — Install dependencies

```bash
npm install
```

This installs Next.js, React, Tailwind, Vitest, and related packages.

### Step 3 — Start the development server

```bash
npm run dev
```

You should see something like:

```text
▲ Next.js … Ready
- Local: http://localhost:3000
```

### Step 4 — Open the app in your browser

| Surface | Link |
|---------|------|
| Control Plane (home) | [http://localhost:3000](http://localhost:3000) |
| Scenarios | [http://localhost:3000/scenarios](http://localhost:3000/scenarios) |
| Ops dashboard | [http://localhost:3000/ops](http://localhost:3000/ops) |

### Step 5 — Stop the server when finished

In the terminal where `npm run dev` is running, press:

```text
Ctrl + C
```

---

## Optional: production build

Run a production build and serve it locally:

```bash
npm run build
npm start
```

Then open [http://localhost:3000](http://localhost:3000).

---

## Optional: run tests

Unit tests cover regret bands, hard-block override, thrash detection, ladder mapping, and feedback:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

---

## Suggested demo walkthrough (3–5 minutes)

Follow these steps after `npm run dev` is running:

1. **Safe path**  
   Go to **Control Plane** → **Load sample…** → **Safe FAQ reply** → **Evaluate at gate**  
   Expect near-zero regret and **Pass instantly**.

2. **Quietly expensive**  
   Open **Scenarios** → run **Quietly expensive tool thrash**  
   Expect thrash / cost signals and elevated regret.

3. **Subtly unsafe**  
   Run **Subtly unsafe PII send**  
   Expect **HARD BLOCK** (responsibility override).

4. **High regret + human**  
   Run **Compounding: bad reply → approve spend**  
   Expect **Hold at gate** → open **Ops** → Approve / Reject / Escalate  
   Watch **feedback offsets** update.

5. **Policy difference**  
   Run **Policy variant: EU automated refund**  
   Compare **US Internal** vs **EU / GDPR** outcomes.

Recording script: [`docs/DEMO_VIDEO_NOTES.md`](docs/DEMO_VIDEO_NOTES.md)

**Demo video:** _add public link here after recording_

---

## Intervention ladder (how decisions work)

| Level | Action | Meaning |
|-------|--------|---------|
| Near-zero | Pass instantly | Low risk — minimal latency |
| Low | Attach receipt | Proceed with audit documentation |
| Medium | Soft rewrite | Light verification / safer wording |
| High | Hold at gate | Human review or proof required |
| Critical | Hard block | Responsibility override — stop the action |

---

## Project structure (high level)

```text
controlplane-regretgate/
├── docs/
│   ├── ARCHITECTURE.md          # Pipeline & design
│   ├── BUSINESS_PROPOSAL.md     # Round 2 business proposal
│   └── DEMO_VIDEO_NOTES.md      # Demo recording storyboard
├── src/
│   ├── app/                     # Pages + API routes
│   │   ├── page.tsx             # Control Plane UI
│   │   ├── scenarios/           # Scenario simulator
│   │   ├── ops/                 # Ops / governance UI
│   │   └── api/                 # evaluate, audit, hitl, metrics, policies
│   ├── components/              # UI components
│   ├── data/scenarios.ts        # Sample enterprise scenarios
│   └── lib/regretgate/          # Core scoring & ladder engine
├── package.json
└── README.md
```

---

## Useful npm scripts

| Command | What it does |
|---------|----------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start app at http://localhost:3000 |
| `npm run build` | Create production build |
| `npm start` | Run production server (after build) |
| `npm test` | Run engine unit tests |
| `npm run lint` | Run ESLint |

---

## Assumptions (prototype scope)

- Illustrative enterprise traffic (~tens of thousands of interactions/week across three use cases)
- Mix of well- and loosely-governed data sources (simulated)
- Heuristic detectors — **not** production ML / commercial PII services
- In-memory audit & HITL store (resets when the server restarts)
- No proprietary customer data; no foundation-model API keys needed for the demo

More detail: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · [`docs/BUSINESS_PROPOSAL.md`](docs/BUSINESS_PROPOSAL.md)

---

## Troubleshooting

| Problem | What to try |
|---------|-------------|
| `npm` / `node` not found | Install Node.js 20+ and restart the terminal |
| Port 3000 already in use | Stop the other process, or run `npx next dev -p 3001` and open http://localhost:3001 |
| Blank / old UI after pull | Hard refresh the browser (`Ctrl+Shift+R`) and restart `npm run dev` |
| `npm install` fails | Delete `node_modules` and `package-lock.json`, then run `npm install` again |
| HITL queue empty on Ops | First run a **high-regret** or **hold** scenario from Scenarios |

---

## Team

RegretGate — Accenture Innovation Challenge Round 2 · ControlPlane.ai track

## License

Prototype code provided for challenge evaluation.
