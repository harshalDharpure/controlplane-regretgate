# RegretGate - ControlPlane Checker

Act with confidence. Verify only when the regret is high.

---

## What we built

RegretGate is our Round 2 prototype for **Accenture Innovation Challenge - Problem Track 1 (ControlPlane.ai)**.

Companies are already using generative AI in support chat, internal copilots, and decision tools. The painful part is that mistakes often show up only after something has already been sent, approved, or executed.

RegretGate sits in front of that commit step. Before reply / send / refund / approve / execute, it:

1. Figures out what action is pending
2. Scores **Expected Regret** = P(failure) x Impact x Irreversibility (0-100)
3. Checks responsibility risks (PII, secrets, unsafe content, policy)
4. Picks an intervention: pass, attach receipt, soft rewrite, hold for a human, or hard block
5. Writes an audit receipt

Low regret moves fast. High regret gets verified. Responsibility issues can hard-block even if the score looks okay.

### Failure modes we care about

- **Confidently wrong** - wrong or ungrounded answer delivered with certainty
- **Quietly expensive** - token burn, retries, tool thrash
- **Subtly unsafe** - leakage, bias, policy breach

### Who it helps

- Process owners: irreversible actions get held instead of auto-running
- Risk / privacy: hard blocks + geo policy packs + audit trail
- Platform teams: one gate across use cases with different risk/latency needs
- FinOps: thrash shows up before cost piles up
- Reviewers: humans only see high-regret cases, not every message

---

## Prototype pages


| Page          | URL                                                                | What it does                                                  |
| ------------- | ------------------------------------------------------------------ | ------------------------------------------------------------- |
| Control Plane | [http://localhost:3000](http://localhost:3000)                     | Paste or load an action, see score / ladder / block / rewrite |
| Scenarios     | [http://localhost:3000/scenarios](http://localhost:3000/scenarios) | One-click demos across support, copilot, decision support     |
| Ops           | [http://localhost:3000/ops](http://localhost:3000/ops)             | HITL queue, audit log, metrics, policy tighten/loosen         |


Stack: Next.js 16, React 19, TypeScript, Tailwind, Vitest.

No API keys. Scoring is heuristic so judges can run the demo offline.

---

## How to run

Need Node.js 20+ and npm.

```bash
git clone https://github.com/harshalDharpure/controlplane-regretgate.git
cd controlplane-regretgate
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Useful extras:

```bash
npm test
npm run build
npm start
```

If port 3000 is busy: `npx next dev -p 3001`

---

## Quick demo path 

1. Control Plane -> Load **Safe FAQ reply** -> Evaluate. Should pass instantly.
2. Scenarios -> **Quietly expensive tool thrash**. Look for thrash / elevated regret.
3. Scenarios -> **Subtly unsafe PII send**. Should hard block.
4. Scenarios -> **Compounding: bad reply -> approve spend**. Hold, then resolve in Ops.
5. Scenarios -> **Policy variant: EU automated refund**. Compare US vs EU packs.

Video storyboard notes are in `docs/DEMO_VIDEO_NOTES.md`.

Demo video: *add link after recording*

---

## Intervention ladder


| Level     | Action                       |
| --------- | ---------------------------- |
| Near-zero | Pass instantly               |
| Low       | Attach receipt               |
| Medium    | Soft rewrite                 |
| High      | Hold at gate (human / proof) |
| Critical  | Hard block                   |


---

## Submission files


| Upload field           | File                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| README PDF             | `submission/RegretGate_README.pdf`                                                                                       |
| Business Proposal PDF  | `submission/RegretGate_Business_Proposal.pdf`                                                                            |
| Business Proposal PPTX | `submission/RegretGate_Business_Proposal.pptx`                                                                           |
| GitHub                 | [https://github.com/harshalDharpure/controlplane-regretgate](https://github.com/harshalDharpure/controlplane-regretgate) |
| Prototype video        | record using `docs/DEMO_VIDEO_NOTES.md`                                                                                  |


---

## Scope notes

This is a prototype, not a production control plane.

- Sample multi-use-case traffic (support, copilot, decision support)
- Heuristic detectors, not commercial PII / ML services
- In-memory audit and HITL (resets on server restart)
- No customer data, no model API keys required for the demo

More detail if needed: `docs/ARCHITECTURE.md`, `docs/BUSINESS_PROPOSAL.md`

---

## Team

RegretGate - Accenture Innovation Challenge Round 2 - ControlPlane.ai

Harshal Dharpure, Siddharth Srivastava, Riha Sanjay Kokode  
Indian Institute of Technology Patna
