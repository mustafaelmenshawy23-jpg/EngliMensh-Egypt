# Source Book Index — Structural Validation Report

**Validation date:** 2026-11-06  
**Index:** `data/curriculum/source-book-index.draft.json`  
**Schema:** `data/curriculum/source-book-index.schema.json`

## Latest structural check

- JSON parsing: passed.
- Book/document records: 33.
- Pathway records: 7.
- Unique record IDs: passed.
- Every record references an existing pathway: passed.
- Every record has a source filename: passed.
- Unit record shape and positive/null PDF page references: passed.
- All records remain `needs_review`: passed.
- Structural errors: 0.

## Coverage added in the latest pass

- Added official Primary 1–6 Term 1 Student’s Book records.
- Added available assessment records for Primary 1–6, Preparatory 1 and Preparatory 3.
- Added the Baccalaureate Year 1 *The Lost World* reader as a separate reader document.
- Added the Baccalaureate Year 2 English as a Second Foreign Language book under its own separate pathway, not merged with first-language Baccalaureate or General Secondary.
- Added the remaining available commercial Hello Plus Prep 2 and Prep 3 guides under the commercial-reference pathway.

## Known incomplete fields

- Primary 6 official Student’s Book has no structured units yet because the available contents excerpt did not establish reliable unit numbering and exact titles.
- Several primary official book contents have titles but no confirmed unit start pages.
- Assessment documents are catalogued as assessment documents; no unverified question or unit mapping has been added.
- Commercial Hello Plus Prep 2 contents remain unresolved because OCR was dominated by watermark text.
- The missing Prep 2 Performance Tasks PDF remains deferred until the 33 available source books are completed.

## Important limitations

- This is structural validation, not academic approval.
- OCR output and extracted contents are not treated as verified curriculum approval.
- No external JSON Schema validator was run in this check.
- No question bank content was imported into the application.
- The index remains a draft and is not connected to runtime curriculum navigation.
