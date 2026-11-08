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
  - General: New Hello (owner-supplied HTML import)
  - Advanced: New Hello Plus (owner-supplied HTML import)
- Secondary: Grades 1–3
  - General: General Secondary
  - Advanced: reserved and empty until source books are supplied
- Egyptian Baccalaureate: separate standalone pathway, reserved and empty until source books are supplied

## Source books
The repository's `public/books/` folder contains the uploaded PDF source set. Original filenames are preserved. Preparatory HTML source files supplied by the project owner are stored separately under `content-imports/preparatory/` and are retained unchanged. Do not assume a filename alone proves grade, term, or official curriculum alignment; verify those details from the source itself. Imported HTML content remains pending app integration and academic/answer-key verification until those checks are completed.

## Extract and validate books
The local extraction pipeline indexes text page by page without inventing missing content:

```bash
npm install
npm run extract:books
npm run validate:extraction
```

See [the extraction workflow](docs/BOOK_EXTRACTION_WORKFLOW.md) for Git LFS hydration, output fields, OCR flags, and academic review rules. You can also run the GitHub Actions workflow **Extract source books** manually from the Actions tab; it hydrates Git LFS PDFs, extracts page text, validates source references, and publishes a 14-day artifact. It does not modify the repository or approve extracted content.

## Repository layout
- `public/books/` — original source PDF books (immutable)
- `content-imports/preparatory/` — owner-supplied New Hello and New Hello Plus HTML source files (preserved unchanged)
- `src/data/curriculum/` — curriculum pathway definitions
- `src/data/extracted/` — generated page-level text and manifest
- `src/data/review/` — candidate structures awaiting academic verification
- `scripts/` — extraction and validation utilities
- `docs/` — upload, extraction, and content-governance documentation

## Current status
The original source PDF set is present in the repository and is approved by the project owner as the authoritative curriculum reference set. Original PDFs are immutable and must never be edited, replaced, renamed, or recompressed. Application work now focuses on connecting and organizing curriculum content. OCR output and individual extracted text fields must not be described as individually academically verified unless separately checked.

## Visual OCR review passes
- [Pass 15 visual review](docs/visual-ocr-review-pass15.md) — 20 rendered pages from 14 books.
- [Pass 16 visual review](docs/visual-ocr-review-pass16.md) — 20 rendered pages from 9 books; recovery candidates are preserved separately and remain academically unverified.
- [Pass 17 OCR visual review](docs/visual-ocr-review-pass17.md) — 20 pages from 10 books visually inspected at 240 DPI; four blank renders retained as blank observations. Candidates remain academically unverified.
- [Pass 18 OCR visual review](docs/visual-ocr-review-pass18.md) — 20 pages from 5 books visually inspected at 240 DPI; observations remain recovery candidates and academically unverified.
- [Pass 19 OCR visual review](docs/visual-ocr-review-pass19.md) — 20 pages from 12 books visually inspected at 240 DPI; 11 blank renders and remaining cover/writing/title pages documented without academic approval.
- [Pass 20 OCR visual review](docs/visual-ocr-review-pass20.md) — 20 pages from 14 books visually inspected at 240 DPI; visual observations remain unverified candidates.


## Project decision — source approval and review scope

- The project owner confirms that the supplied books were obtained from the Ministry of Education website, personally reviewed, and are familiar teaching materials.
- Treat the supplied books as approved source references for EngliMensh-Egypt.
- Stop broad visual-review passes. Do not create another pass merely to inspect more pages.
- Preserve every original PDF byte-for-byte; all extraction, indexing, and app changes must be additive and stored separately.
- If a specific mismatch or defect appears in the application, investigate only the affected source PDF and 1-based physical PDF page, then make a targeted correction.
- Source approval does not mean OCR output is infallible. Never invent unreadable words, exercise content, or answer keys; flag only concrete extraction defects when they affect a real app feature.
- Keep each imported lesson, activity, and question linked to its exact source filename and physical PDF page.
