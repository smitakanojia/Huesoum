# SatQuery AI

Interactive vision-language assistant for **multimodal remote sensing**. Ask a
question about satellite imagery in plain language and get an answer **measured from
the pixels**, shown on a map, with a full, auditable execution trace.

Built for the ISRO / SAC *SatQuery AI* problem statement (Smart India Hackathon).
This is a prototype, **not** an official ISRO product.

---

## Repository structure (per the P3 handover)

```
web/                 React + Vite + TypeScript + Tailwind + MapLibre frontend  ← main app
  src/
    core/            engine ported from the prototype (imagery, controller, fusion, report) + view constants
    api/             HTTP client + generated-types placeholder
    state/           reactive store over the engine
    components/      Header/Footer, LanguageGate, Pipeline, MapView, ResultView, Chat, Receipt …
    pages/           Home, Login, Workspace, History, Registry, Trace
    styles/          app.css (ported design system) + react.css
server/              FastAPI API (Master F3.6), wired to run_job + satquery.render
satquery/render/     display layers, styles.json, report/GeoJSON (P3)
demo/                curated scenes (scene.json) + reference/ (the single-file prototype)
tests/p3/            server tests (upload→poll→result, traversal, bad-extension)
assets/MANIFEST.md   imagery sources and how to swap them
```

Ownership follows the handover: this repo only touches `web/`, `server/`,
`satquery/render/`, `demo/`, `tests/p3/`. It never edits `satquery/contracts/`,
`satquery/common/`, P1/P2 folders, `tests/contract/`, `tests/e2e/` or `pyproject.toml`.

## Run the frontend

```bash
cd web
npm install
npm run dev          # http://localhost:5173  (demonstration mode — synthetic scenes)
npm run build        # production build to web/dist
```

The app runs fully offline in **demonstration mode**: all imagery and results are
synthetic (fixture F3.7), computed in the browser, and labelled synthetic. To use a
real analysis core, run the server and set `VITE_API_BASE`:

```bash
cd server && pip install -r requirements.txt && uvicorn app:app --port 8000
cd ../web && echo "VITE_API_BASE=http://localhost:8000" > .env && npm run dev
```

## What the app does

- **Language gate** on first visit (English / हिंदी); the choice persists and drives
  the UI and the generated PDF report.
- **Editorial landing page** — hero, capability sections, an unnumbered nine-domain
  showcase, and scroll-driven agentic-orchestration and methodology animations.
- **Analysis Workspace** — GeoTIFF/TIFF-only upload, plain-language question, no
  user-facing "mode" control. Inputs: single image, before/after pair,
  **multi-temporal time series (3+ dates)**, or an optical + SAR pair.
- **Signature loading pipeline** — a visual representation of the *real* execution
  trace (input → sensor → query → plan → specialist tools → fusion → answer), not a
  spinner.
- **Answer-first result** — answer, then confidence (the bar fills to the true
  percentage; process progress and model confidence are never conflated), then
  evidence, then a landscape **MapLibre** map, then execution summary, audit trace and
  downloads.
- **Measure, don't guess** — counts come from the detector, not the language model;
  the model's sentence is shown separately as the *model description*. Full model IDs
  (including the LoRA adapter) are always shown. Every number in the answer opens a
  provenance **receipt** (source, model, output, settings, trace step).
- **Continue-the-same-chat** — ask follow-ups about the same imagery; the object and
  place carry over from the previous turn when omitted, and the carry-over is recorded
  in the trace (`resolved_from_turn`).
- **History / Tool registry / Audit trace** — institutional tables and a full
  technical trace (parsed query, sensor profile, plan, model IDs, parameters, skipped
  steps, adapter, versions).

## New in this build

- Full **React + Vite + MapLibre** app (the frontend was previously a single HTML
  file, kept at `demo/reference/` for provenance).
- **Multi-temporal** time-series input with a trend summary across intervals.
- **Continue-the-same-chat** multi-turn follow-ups.

## Tests

```bash
pip install -r server/requirements.txt httpx pytest && pytest tests/p3
cd web && npm run build   # typecheck + production build
```
