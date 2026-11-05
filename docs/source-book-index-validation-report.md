# Source Book Index — Structural Validation Report

**Validation date:** 2026-11-06  
**Index:** `data/curriculum/source-book-index.draft.json`  
**Schema:** `data/curriculum/source-book-index.schema.json`

## Latest structural check

- JSON parsing: passed.
- Book/document records: 33.
- Pathway records: 7.
- Unique record IDs: passed.
- Pathway references: passed.
- Review-state policy: passed.
- Unit record shape and PDF page values: passed.
- Structural errors: 0.

## Latest source-content refinement

Primary 5 official Student’s Book:
- Transcribed all six scope-and-sequence unit titles from physical PDF pages 3–5.
- Added language focus and integrated activity labels where visible.
- Kept unit start pages null because those pages do not establish exact starts.

Primary 6 official Student’s Book:
- Expanded to six unit records using the scope-and-sequence on physical PDF page 4 and learning outcomes on page 5.
- Added available language-focus labels.
- Unit 2 heading is OCR-damaged ("Out Natare"); it is explicitly flagged for visual verification and has not been silently corrected.
- Unit start pages remain null.

## Remaining data-quality work

- Confirm OCR-damaged headings and spellings against rendered PDF page images.
- Confirm exact unit start pages for Primary 1–6.
- Primary 6 Unit 1 exact title is recorded as Time Management; remaining details should be visually checked.
- Commercial Primary 5 unit structure and Hello Plus Prep 2 contents remain unresolved.
- The missing Prep 2 Performance Tasks PDF remains deferred until the 33 available source books are completed.

## Limitations

- Structural validation is not academic approval.
- All records remain `needs_review`; OCR is not approval.
- No question-bank content was imported into the app.
- The index remains a draft and is not connected to runtime curriculum navigation.
- No external JSON Schema validator was run in this check.
