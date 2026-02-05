# AI Skill Gap → Job Readiness Mapper (Scaler)

A functional, deployable tool that helps software job seekers see how ready they are for Backend, Full Stack, or Data Engineering roles and what skills to learn next. Built for lead conversion into Scaler’s career consultation and programs.

## Run it

**Recommended** (serves the site and job-readiness API):

```bash
node server.js
```

Then open `http://localhost:3456`.

## Deploy (easiest: GitHub Pages)

**No server, no build.** The app runs 100% in the browser.

1. Open your repo: **[github.com/DJ1505/scaler-funnel](https://github.com/DJ1505/scaler-funnel)**
2. **Settings** → **Pages** → **Source**: *Deploy from a branch* → **Branch**: `main` → **Save**
3. In ~1 minute the site is live at: **https://dj1505.github.io/scaler-funnel/**

See **[DEPLOY.md](DEPLOY.md)** for the same steps. Optional: deploy to [Netlify](https://app.netlify.com/teams/dj1505/projects) instead (Import from Git → choose repo → Deploy).

- **index.html** — Landing: “Are you actually ready for this software job?”
- **analyzer.html** — Entry: paste/upload resume or job description, pick target role, “Check My Job Readiness”

## What it does

1. **Entry** — User pastes resume (or uploads PDF) or pastes a job description, selects target role (Backend / Full Stack / Data Engineer), clicks “Check My Job Readiness”.
2. **Analysis** — Deterministic skill extraction and comparison against a predefined framework (DSA, System Design, Core Programming, Role Stack, Projects/Experience). Each bucket gets High/Medium/Low; overall score 0–100%. Insight text is rule-based from role and weak areas (no AI).
3. **Results** — Job Readiness Score, skill gap table (Skill Area, Expected Level, Your Level, Status), insight text.
4. **Conversion** — “How to Close These Gaps”: for each weak area, why it matters and how Scaler helps; primary CTA “Book a Free 15-Minute Career Consultation”, secondary “Explore Relevant Scaler Programs”.

## Tech

- **skill-framework.js** — Role-specific keyword buckets and deterministic scoring (no AI for scores).
- **server.js** — `POST /api/job-readiness` (body: `{ text, role }`). Validates input length and role; returns score, skillAreas, weakAreas, insight. No AI: insight is deterministic from role and weak areas.
- **analyzer.js** — Tabs (Resume vs Job Description), resume paste/PDF upload, role dropdown, results rendering and “How to close these gaps” cards with Scaler mapping.

## No AI required

The job-readiness flow uses no AI or external APIs. Scoring and insight text are fully deterministic (keyword-based framework + rule-based insight from role and weak areas).

## Guardrails

- Minimum input length (80 characters) with clear error messages.
- No job guarantees or salary promises in copy.
- Invalid role or body returns 400 with a clear error message.

## Funnel tracking

`localStorage` key `job_readiness_funnel` stores: landed, analyzer_viewed, analyzed, consult_clicked, programs_clicked.

## Copy

Copy is direct and conversion-focused: clarity on gaps, why they matter in interviews, and how Scaler helps close them — without over-promising.
