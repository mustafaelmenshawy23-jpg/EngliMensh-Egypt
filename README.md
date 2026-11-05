# EngliMensh

An independent English-learning application for the Egyptian national curriculum.

## Project boundaries
- This repository is standalone and is not connected to, copied from, or dependent on any older EngliMensh application repository.
- Curriculum content must be derived from source books uploaded to `public/books/`.
- No units, lessons, vocabulary, grammar notes, reading passages, or questions may be invented.
- Every extracted curriculum item must retain its source PDF filename and printed/PDF page reference.
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

## Upload books
Upload the original PDF books into `public/books/`. Keep the original filenames whenever possible. Add one book at a time or upload a ZIP containing the PDFs. Do not upload answer keys or external materials as curriculum sources unless they are part of the official source set.

After the books are uploaded, the extraction workflow will index each PDF page and preserve source references. Scanned pages will be OCR-processed where possible and flagged for review.

## Repository layout
- `public/books/` — source PDF books
- `src/data/curriculum/` — curriculum pathway definitions
- `src/data/extracted/` — page-level text extracted from source PDFs
- `src/data/review/` — candidate structures awaiting academic verification
- `scripts/` — extraction and validation utilities
- `docs/` — upload and content-governance documentation

## Current status
The repository is initialized. No curriculum books have been uploaded and no curriculum content has been populated yet.
