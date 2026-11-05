# Pass 15 — OCR quality anomaly shortlist

## Scope
This pass selects 20 additional short or fragmentary OCR pages from the existing 5,626-page extraction artifact. It spans 14 source books and includes primary-stage lesson/activity pages, assessment material, theme/section openers, and illustrated readers. It does not repeat the candidate pages from Passes 11–14.

This is a triage list only. A short OCR result may represent a cover, title page, illustration, or deliberately sparse activity. Each page must be compared with the original before any recovery.

## Candidate manifest
See `src/data/extracted/ocr-quality-audit-pass15.jsonl` for exact source filename, 1-based physical PDF page, machine OCR snippet, and reason for selection.

## Preservation rules
- Keep machine extraction unchanged.
- Do not infer answers, missing words, or text hidden in illustrations.
- Record only clearly visible printed content; describe image prompts separately.
- Keep every candidate at `needs_review`.
- `Performance Tasks Prep 2-OnlineMaterials.PDF` remains postponed.

## Rendering
Run `.github/workflows/render-pass15-quality-audit.yml` manually at 240 DPI. The artifact contains 20 rendered pages and a manifest for visual review.
