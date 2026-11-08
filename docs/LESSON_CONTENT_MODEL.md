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
- `src/data/lessons/unit-modules.draft.json`: one nine-section scaffold for each of the 118 indexed units.
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

The source index currently contains 33 indexed books and 118 unit records. All 118 unit scaffolds remain empty and `needs_review`; the 9-section structure is a checklist, not evidence that the content exists. Assessment PDFs and the reader require separate treatment because they are not yet represented as unit records.
