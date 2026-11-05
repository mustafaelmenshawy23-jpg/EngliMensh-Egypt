# EngliMensh

An independent English-learning application for the Egyptian national curriculum.

## Project boundaries
- This repository is standalone and is not connected to, copied from, or dependent on any older EngliMensh application repository.
- Curriculum content must be derived from source books uploaded to `public/books/`.
- No units, lessons, vocabulary, grammar notes, reading passages, or questions may be invented.
- Every extracted curriculum item must retain its source PDF filename and page reference.
- Content remains marked `needs_review` until it has been checked against the source book.

## Curriculum map
- Primary: Grades 1–6
  - General: Connect
  - Advanced: Connect Plus
- Preparatory: Grades 1–3
  - General: New Hello
  - Advanced: reserved and empty until source books are supplied
- Secondary: Grades 1–3
  - General: General Secondary
  - Advanced: reserved and empty until source books are supplied
- Egyptian Baccalaureate: separate standalone pathway, reserved and empty until source books are supplied

## Source books
The repository's `public/books/` folder contains the uploaded PDF source set. Original filenames are preserved. Do not assume a filename alone proves grade, term, or official curriculum alignment; verify those details from the book itself.

## Extract and validate books
The local extraction pipeline indexes text page by page without inventing missing content:

```bash
npm install
npm run extract:books
npm run validate:extraction
```

See [the extraction workflow](docs/BOOK_EXTRACTION_WORKFLOW.md) for Git LFS hydration, output fields, OCR flags, and academic review rules.

## Repository layout
- `public/books/` — source PDF books
- `src/data/curriculum/` — curriculum pathway definitions
- `src/data/extracted/` — generated page-level text and manifest
- `src/data/review/` — candidate structures awaiting academic verification
- `scripts/` — extraction and validation utilities
- `docs/` — upload, extraction, and content-governance documentation

## Current status
The source PDF set is present in the repository. The extraction pipeline is ready to run locally; extracted content is not yet generated or academically approved.
