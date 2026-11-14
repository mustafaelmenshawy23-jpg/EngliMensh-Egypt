# Source-linked lesson content model

Every indexed unit has nine independent learning sections:

1. Vocabulary
2. Vocabulary questions
3. Grammar
4. Grammar questions
5. Reading
6. Listening
7. Speaking
8. Games
9. Comprehensive unit test

A section may remain empty when the source book does not contain that kind of material. Empty means **not populated**, not that the source was checked and found to contain nothing. Games and newly written practice must be labelled supplementary; they are never textbook quotations.

## Files

- `src/data/lessons/lessons.draft.json`: source-linked lesson drafts; all current records remain `needs_review`.
- `src/data/lessons/unit-modules.draft.json`: one nine-section scaffold for each of the 125 indexed units.
- `schemas/lesson-content.schema.json`: content contract for lesson and module structures.
- `scripts/validate-lesson-content.mjs`: repository-aware checks against the source index.
- `scripts/validate-unit-modules.mjs`: verifies one scaffold per indexed unit and all nine section slots.

## Source and review requirements

Every unit identifies its exact indexed book, pathway, grade, unit, title, and physical 1-based PDF page range where the boundary is known. Every source item must carry its exact `sourcePdfPage` and `origin: "source"`. Generated practice must use `origin: "supplementary"` and must not be represented as printed textbook content.

- OCR/manual transcription remains `needs_review` until checked against the original PDF.
- A lesson can be marked `approved` only with a reviewer, ISO timestamp, and at least one item.
- Every item inside an approved lesson must also be approved.
- Unreviewed content must not be promoted into the published learner content bank.
- Listening scripts generated from an audio-only activity are supplementary unless a matching printed transcript is present in the source.
- Dialogue turns carry `speakerGender: "male" | "female" | "unknown"`. This is metadata only: it does not prove that the platform has a matching TTS voice. Device voice selection and playback must be tested separately.
- If a source scan is unreadable or a unit boundary is uncertain, preserve the blocker and do not invent text, page references, or unit boundaries.

## Current review state

As of 2026-11-14, the source index contains 34 indexed books and 125 unit records. All 125 records in `unit-modules.draft.json` remain empty scaffolds with `needs_review`; the 9-section structure is a checklist, not evidence that the content exists. A separate resumable staging area, `artifacts/unit-drafts/`, contains 52 structurally validated unit drafts in the last persisted batch snapshot. All 52 remain `needs_review`, zero are approved, and none are published into the learner content bank. The same snapshot records 53 units blocked by source-quality review and 20 failed/retry candidates. These counts are a dated snapshot; `artifacts/unit-drafts/progress.json` is the live progress source.

Eleven indexed PDFs do not yet have unit records for the unit-generation workflow: nine assessment documents, the Baccalaureate Year 1 reader (its ten chapter starts are separately indexed in `reader-chapter-index.draft.json`), and the Hello Plus Prep 2 commercial supplement. That supplement currently extracts as repeated watermark-only text and needs watermark repair/OCR before unit boundaries can be trusted. One assessment PDF (`Performance Tasks Prep 2-OnlineMaterials.PDF`) remains an undownloaded Git LFS pointer. These documents require separate assessment/reader processing or source recovery; they must not be silently treated as completed units.
