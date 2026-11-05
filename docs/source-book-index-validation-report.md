# Source Book Index — Structural Validation Report

**Validation date:** 2026-11-06

- JSON parsing: passed.
- Book/document records: 33.
- Pathway records: 7.
- Unit records: 118.
- Unique IDs, pathway references, unit numbers/titles and positive-or-null PDF page references: passed.
- All records remain `needs_review`.
- Structural errors: 0.

## Primary 1–6 unit-opening page-reference pass

Additional physical PDF page references were added from extracted page text where a unit heading/opening was identifiable:
- Primary 1: Unit 1 p7; Unit 2 p26; Unit 3 p45.
- Primary 2: Unit 1 p7; Unit 2 p19; Unit 4 p51. Other unit starts remain unconfirmed.
- Primary 3: Unit 1 p13; Unit 2 p29; Unit 4 p71. Other unit starts remain unconfirmed.
- Primary 4: Unit 1 p8; Unit 2 p24; Unit 3 p40; Unit 4 p62; Unit 5 p80; Unit 6 p96.
- Primary 5: Unit 1 p8; Unit 2 p26; Unit 3 p41; Unit 4 p61; Unit 5 p77; Unit 6 p92.
- Primary 6: Unit 1 p7; Unit 2 p24; Unit 3 p37; Unit 5 p70.

Page numbers are 1-based physical PDF pages. These are extraction-based references, not yet a completed visual verification. Any unclear or absent start remains null rather than being guessed.

## Primary 6 title correction

The earlier draft confused a scope/skill label with the Unit 1 title and retained an OCR-damaged Unit 2 title. The draft now uses extracted headings:
- Unit 1: Amazing Places in Egypt — PDF p7.
- Unit 2: How’s the Weather in Your City? — PDF p24.
- Unit 3: Jobs that Help the Community — PDF p37.
- Unit 5: Made in Egypt — PDF p70.
Unit 4 (Resources Around Us) and Unit 6 (Wise Savers) retain scope-and-sequence titles; exact opening pages remain null.

## Limitations and next review

- Extracted text remains `needs_review`; visual confirmation is required before academic release.
- Primary 2 and Primary 3 still have incomplete unit page references.
- Commercial Primary 5 and Hello Plus Prep 2 contents remain incomplete.
- No question-bank content has been imported; this draft index is not connected to runtime curriculum navigation.
- The missing Prep 2 Performance Tasks PDF remains deferred until the 33 available books are completed.
- This is structural validation, not academic approval; no external JSON Schema validator was run.
