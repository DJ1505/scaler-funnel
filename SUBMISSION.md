# Scaler AI APM Assignment — Submission

## What I Built

A **Resume Check** funnel: a 0→1 tool that gives working professionals real feedback on their resume. The hook is simple — recruiters spend 6 seconds. Most people guess what's wrong. This tells you.

---

## 1. Growth Opportunity Picked

**Convert blog readers / free video viewers into leads** — by giving them a tool they actually need.

Why this: People searching for resume tips, career advice, or "how to improve my resume" are high-intent. They're stuck. They want answers, not another article. A tool that gives instant, specific feedback captures that intent and warms them for Scaler's masterclasses and career consultation.

The tool doubles as something shareable — "check your resume here" spreads through word of mouth.

---

## 2. Funnel Design

| Stage | Touchpoint | What happens | Business outcome |
|-------|------------|--------------|------------------|
| **Cold** | Landing page | Blunt headline, clear value prop, CTA to try tool | Traffic → tool usage |
| **Warm** | Resume analyzer | User pastes resume, gets score + feedback | Engagement, trust, awareness of gaps |
| **Warm** | Email capture | "Want full breakdown?" — optional lead capture | Email list growth |
| **Convert** | CTA block | "Struggling with technical stuff?" → Scaler events | Click-through to masterclass / booking |

**User journey:** Anonymous visitor → tries tool → sees gaps → (optional) gives email → clicks through to Scaler events.

**Where AI helps:** The analyzer uses rule-based logic (keyword checks, structure, length). In production, you'd swap in an LLM for richer, more personalized feedback. The funnel structure stays the same.

---

## 3. Prototype

- **Landing:** `index.html` — hero, how it works, CTA
- **Analyzer:** `analyzer.html` — paste resume, get score + feedback, lead form, conversion CTA

**To run:** Open `index.html` in a browser. No server needed. Works offline.

**Edge cases handled:**
- Empty input → "Paste your resume above and hit Analyze"
- Too short (< 50 chars) → same empty state
- Very long input (> 15k chars) → truncated, no crash
- HTML/script in paste → stripped before analysis
- Malformed email → validation message
- Clear button → resets state

**Adversarial prompts:** The tool analyzes resume-like text. If you paste "ignore previous instructions" or random text, it still runs — it just produces feedback based on structure (word count, bullets, etc.). It doesn't call an LLM, so there's no prompt injection surface. The output stays bounded and predictable.

---

## 4. Tool Stack

| Tool | Use | Why |
|------|-----|-----|
| Cursor | Build, edit, debug | Agentic coding for speed |
| Vanilla HTML/CSS/JS | Frontend | No framework deps, runs anywhere, easy to tweak |
| No backend | Lead form logs to console | For demo; production would use Formspree, Airtable, or a small API |

**Updates (next steps done):**
- **Lead capture:** Built-in. Run `node server.js` — leads save to `leads.json`. Or use Formspree by setting `FORMSPREE_ID` in `config.js`.
- **PDF upload:** Drop or select a PDF; we extract text with pdf.js and run analysis. Scanned PDFs won't work — text must be selectable.
- **Funnel tracking:** localStorage logs landed, analyzer_viewed, analyzed, email_submitted, cta_clicked. Check `resume_check_funnel` in devtools for drop-off.

---

## 5. If I Had 2 More Weeks

1. **Wire lead capture** — Formspree or Supabase to store emails and tag by source.
2. **Add PDF upload** — Use pdf.js to extract text so users don't have to copy-paste.
3. **LLM-backed analysis** — Claude/OpenAI API for deeper, role-specific feedback (e.g. "for a backend role, add more system design keywords").
4. **A/B test headlines** — "6-second test" vs "Get a real read" vs others; measure CTR to analyzer.
5. **Measure:** Tool usage rate, email capture rate, click-through to Scaler events. Track drop-off at each step.

---

## Files

```
scaler-funnel/
├── index.html      # Landing page
├── analyzer.html   # Resume analyzer + lead form + CTA
├── style.css       # Styles
├── analyzer.js     # Analysis logic + form handling
├── SUBMISSION.md   # This doc
└── README.md       # How to run
```

---

## Live Links

Open `index.html` in a browser. Or serve the folder:

```bash
cd scaler-funnel
npx serve .
```

Then visit `http://localhost:3000`.
