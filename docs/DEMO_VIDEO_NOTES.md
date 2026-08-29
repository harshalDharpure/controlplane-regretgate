# Demo video notes (2–3 minutes)

Record the local app at `http://localhost:3000`. Speak to the philosophy once:  
**“Act with confidence. Verify only when the regret is high.”**

## Suggested storyboard

| Time | Screen | Narration / action |
|------|--------|--------------------|
| 0:00–0:20 | Control Plane hero | Introduce RegretGate as a pre-commit control plane. Show the intervention ladder. Mention Expected Regret formula. |
| 0:20–0:40 | Control Plane | Load **Safe FAQ reply** → Evaluate. Show near-zero score, pass instantly, low latency path. *“Fast where safe.”* |
| 0:40–1:05 | Scenarios | Run **Quietly expensive tool thrash**. Point to thrash tag, waste score, elevated regret. *“Cost is regret of waste.”* |
| 1:05–1:30 | Scenarios | Run **Subtly unsafe PII send**. Show Responsibility YES → HARD BLOCK override. *“Safety is not a soft score.”* |
| 1:30–1:55 | Scenarios | Run **Overlap: fabricated personal detail**. Highlight `overlap_hallucination_privacy`. *“Risks aren’t clean buckets.”* |
| 1:55–2:25 | Scenarios → Ops | Run **Compounding approve spend** → Hold. Switch to Ops HITL → Reject or Escalate. Show feedback offsets update. |
| 2:25–2:50 | Ops | Show audit receipts, sim FP/FN, alert fatigue proxy, tighten/loosen policy. *“Tradeoff is tuned, not wished away.”* |
| 2:50–3:00 | Scenarios policy variant | Optional: EU vs US compare cards. Close on roadmap / GitHub. |

## Recording tips

- Use 1080p; zoom browser to 110% if needed for gauge readability  
- Click slowly on ladder and hard-block chips so they read on camera  
- End card: repo URL + “RegretGate — ControlPlane.ai Round 2”

## After recording

1. Upload to YouTube/Loom (unlisted or public)  
2. Paste the link into `README.md` under **Demo video**  
3. Commit the README update to the public GitHub repo
