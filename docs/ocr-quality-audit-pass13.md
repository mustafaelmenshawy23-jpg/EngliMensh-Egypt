# Pass 13 — OCR quality anomaly shortlist

## Scope
A heuristic scan of the 5,626-page extraction artifact from the 33 available source books identified 20 pages for visual comparison. The shortlist includes:
- 3 direct PDF text-layer pages with repeated Unicode replacement characters (U+FFFD).
- 17 OCR pages with mixed-script fragments, suspicious reading order, or incomplete question text.

This is a triage list, not a finding that all 20 pages are wrong. Arabic/English mixed content, dotted answer spaces, and RTL markers can be legitimate. Each page must be compared with its original image before any transcription or correction.

## Candidate manifest
See `src/data/extracted/ocr-quality-audit-pass13.jsonl` for the exact source filename, 1-based physical PDF page, machine extraction status, anomaly type, and reason for selection.

## Preservation rules
- Do not overwrite `pages.jsonl` machine text.
- Do not auto-correct answer choices, grammar items, names, or Arabic text.
- Keep all candidates at `needs_review`.
- Recover only visible printed content; describe image-only prompts separately.
- The postponed `Performance Tasks Prep 2-OnlineMaterials.PDF` remains excluded.

## Next step
Run the manual workflow `.github/workflows/render-pass13-quality-audit.yml` at 240 DPI. The artifact will contain the 20 page images and a manifest for visual comparison.
