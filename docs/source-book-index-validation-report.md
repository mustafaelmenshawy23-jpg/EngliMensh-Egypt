# Source Book Index — Structural Validation Report

- Index: `data/curriculum/source-book-index.draft.json`
- Schema: `data/curriculum/source-book-index.schema.json`
- Validation date: 2026-11-06
- Pathways: 6
- Book records: 15
- Unique book IDs: 15
- Unique pathway IDs: 6
- Records with status other than `needs_review`: 0
- Structural validation errors: 0

## Checks performed

- JSON parsed successfully.
- Required top-level collections are present.
- Book IDs are unique.
- Pathway IDs are unique.
- Every book points to an existing pathway.
- Every book has a source filename.
- Every unit has an integer unit number and a title.
- Known PDF page references are positive 1-based integers.
- All book records remain `needs_review`.

## Outcome

No structural errors were found by the checks listed above.

This is a structural validation pass, not a claim that an external JSON Schema validator was run, nor that curriculum content was academically verified.

## Classification correction

Commercial El-Moasser Connect Plus and Hello Plus books are now assigned to the separate `commercial-reference-guides` category. They are not automatically classified as the official MOE Advanced pathway merely because the commercial guide title contains “Plus”.

## Release restriction

Do not connect this draft index to production curriculum navigation or generate questions from it until source-page review is complete. Keep official MOE books, Baccalaureate materials, commercial guides, assessment books, and readers as distinct document types.
