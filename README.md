# SatQuery AI — Frontend (P3)

Interactive vision-language frontend for multimodal remote-sensing analysis.
Ask a question about satellite imagery in plain language and get an answer
**measured from the pixels**, shown on a map, and traceable step by step.

Built for the ISRO / SAC *SatQuery AI* problem statement. This is a
demonstration frontend, not an official government product.

## What this is

`web/satquery-ai.html` is a self-contained frontend (P3 scope: `web/`). It
runs entirely in the browser and needs no build step. Open the file directly,
or serve the folder:

```bash
cd web && python3 -m http.server 8080
# then open http://localhost:8080/satquery-ai.html
```

The only external dependency is `jsPDF` (loaded on demand from cdnjs) for the
PDF report export; a blob-download fallback is used if it is unavailable.

## Design system

A light, institutional, scientific palette — paper-white surfaces, restrained
navy / blue / earth-green / ochre used only for state and data, `Noto Sans`
for UI and `IBM Plex Mono` for technical metadata. No dark backgrounds, neon,
glassmorphism, or oversized rounded cards (radii are 4–6px). Satellite imagery
carries the colour of the product.

## Screens

- **Language selection** (first visit): English / हिंदी; the choice persists and
  drives the UI and the generated PDF report.
- **Landing**: editorial hero, capability sections, a nine-domain application
  showcase (unnumbered image cards), a scroll-driven **Method** pipeline, and a
  single-purpose-tool comparison.
- **Login**: minimal, no category selection.
- **Analysis Workspace** (renamed from "Mission Console"): GeoTIFF/TIFF-only
  upload, a plain-language question, no user-facing "mode" control.
- **Result**: **answer first**, then fused **confidence** (bar fills to the real
  percentage — process progress and model confidence are kept separate),
  measured evidence vs. model description ("measure, don't guess"), the
  **count-off** and **adapter A/B** demo moments, a landscape **map** with layers,
  a "what the system found" table, and the **audit trace**.
- **History / Tool registry / Trace**: institutional tables and a technical
  audit view exposing parsed query, sensor profile, plan, tools, model IDs,
  parameters, skipped steps and the adapter id.

## Functional invariants (do not break)

- Numerical claims trace to the **detector** boxes or a **measured** tool value —
  never to the RS-VLM sentence. The model description is shown separately.
- Full model IDs are shown, including the adapter, e.g.
  `earthdial-4b-rgb-4bit+lora-v1` vs `earthdial-4b-rgb-4bit`.
- Clickable numbers open a provenance "receipt" (source, model, output, settings,
  trace step).
- Conflicts are flagged for review, never hidden; confidence is capped at 50%
  while sources disagree.
- Synthetic demonstration scenes are labelled synthetic.
- The browser receives rendered imagery, overlays, GeoJSON and result data —
  never raw GeoTIFFs.

## Live preview

Published artifact: https://claude.ai/artifact/8sFEb1DKpaC7ekB9kHstvq
(private to the owner).
