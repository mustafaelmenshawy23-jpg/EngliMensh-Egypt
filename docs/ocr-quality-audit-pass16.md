# Pass 16 — OCR quality anomaly shortlist

## Scope
This pass selects 20 additional short or layout-fragmented extraction pages across 9 source books. It includes official Primary 3–5 lessons and assessment material, official Primary 1–2 assessment pages, and Connect Plus Primary 2–3 vocabulary/dictation pages. All selected source-page pairs are new relative to the reviewed Pass 11–15 sets.

This is a triage list only. A short OCR result may represent an image-led prompt, a deliberately blank response area, or a page whose text is embedded in layout elements. Compare the rendered source before any recovery.

## Candidate manifest
See `src/data/extracted/ocr-quality-audit-pass16.jsonl` for exact source filename, 1-based physical PDF page, extraction snippet, and reason for selection.

## Preservation rules
- Keep machine extraction unchanged.
- Do not infer answers, missing words, or text hidden in illustrations.
- Record only clearly visible printed content; describe image prompts separately.
- Keep every candidate at `needs_review`.
- `Performance Tasks Prep 2-OnlineMaterials.PDF` remains postponed.

## Rendering
Run `.github/workflows/render-pass16-quality-audit.yml` manually at 240 DPI. The artifact contains 20 rendered pages and a manifest for visual review.
