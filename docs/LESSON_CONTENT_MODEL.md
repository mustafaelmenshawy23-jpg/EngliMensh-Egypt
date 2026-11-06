# Source-linked lesson content model

The lesson dataset is deliberately empty until a source unit has been transcribed and academically reviewed. The schema is a storage contract, not evidence that any lesson has been approved.

## Files

- `src/data/lessons/lessons.draft.json`: draft lesson records; currently empty.
- `schemas/lesson-content.schema.json`: JSON Schema for lesson and section structure.
- `scripts/validate-lesson-content.mjs`: repository-aware checks against the 33-book source index.

## Record requirements

Every lesson must identify its exact indexed book, pathway, grade, unit, title, and physical 1-based PDF page. Sections use only these types: vocabulary, grammar, reading, listening, speaking, writing, exercises, and assessments. Each item carries its own review status and may carry a more specific source page.

## Approval gate

- OCR/manual transcription remains `needs_review`; it is not automatically lesson content.
- A lesson can be marked `approved` only with a reviewer, ISO timestamp, and at least one item.
- Every item inside an approved lesson must also be approved.
- The validator rejects unknown books, mismatched grade/pathway, unknown units, invalid pages, duplicate IDs, and approval-state leakage.
- Generated practice must be stored separately and explicitly labelled generated; it must never be represented as verbatim source material.

## Pilot policy

Select one unit only after its exact pages are available for focused source verification. Do not fill missing sections with invented material. Empty sections are allowed; fabricated content is not.
