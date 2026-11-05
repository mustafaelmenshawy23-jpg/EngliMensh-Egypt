# Pass 14 — OCR quality anomaly shortlist

## Scope
A second heuristic triage pass selected 20 additional OCR pages from the existing 5,626-page extraction artifact. It emphasizes short or fragmentary OCR, dictation grids, skill-assessment layouts, phonics/vocabulary pages, and unit-opener headings. The shortlist spans 8 source books and does not repeat the Pass 13 candidate page set.

This is a triage list, not a conclusion that every page is incorrectly extracted. Number grids, RTL markers, answer spaces, and sparse illustrated pages can be legitimate. Compare each rendered page with the original before recovering any text.

## Candidate manifest
See `src/data/extracted/ocr-quality-audit-pass14.jsonl` for exact source filename, 1-based physical PDF page, anomaly type, and reason.

## Preservation rules
- Keep machine extraction unchanged.
- Do not infer answers, missing words, or text hidden in illustrations.
- Record only clearly visible printed content; describe image prompts separately.
- Keep every candidate at `needs_review`.
- `Performance Tasks Prep 2-OnlineMaterials.PDF` remains postponed.

## Rendering
Run `.github/workflows/render-pass14-quality-audit.yml` manually at 240 DPI. The artifact contains 20 rendered pages and a manifest for visual review.
