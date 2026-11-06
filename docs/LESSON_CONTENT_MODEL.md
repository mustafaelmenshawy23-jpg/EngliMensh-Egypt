# Source-linked lesson content model

Each selected unit has its own independent learning workspace. The workspace reserves seven distinct modules: Vocabulary, Vocabulary Questions, Grammar, Grammar Questions, Reading, Listening, and Games. Speaking, Writing, Exercises, and Assessments remain supported content types where the source book provides them.

## Files

- `src/data/lessons/lessons.draft.json`: source-linked lesson drafts; the pilot record is still `needs_review`.
- `schemas/lesson-content.schema.json`: content contract for lesson and module structures.
- `scripts/validate-lesson-content.mjs`: repository-aware checks against the 33-book source index.

## Source and review requirements

Every lesson identifies its exact indexed book, pathway, grade, unit, title, and physical 1-based PDF page. Every content item carries a review status and may carry a more specific source page. Empty modules are intentional placeholders, not evidence that content exists.

- OCR/manual transcription remains `needs_review` until checked against the original PDF.
- A lesson can be marked `approved` only with a reviewer, ISO timestamp, and at least one item.
- Every item inside an approved lesson must also be approved.
- Unreviewed content is excluded from published student question banks and answer keys.
- Generated practice must be stored separately and explicitly labelled generated; it must never be represented as verbatim source material.

## Pilot policy

The current pilot is Primary 2, Unit 3, Lesson 1, “Classroom Actions”, linked to physical PDF page 32. Its vocabulary transcription is a review candidate, not approved academic content. Do not fill missing grammar, reading, listening, questions, or games with invented source material. Empty sections are allowed; fabricated content is not.
