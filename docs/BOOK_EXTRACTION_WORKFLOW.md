# PDF book extraction workflow

This repository now includes a local, repeatable PDF text extraction pipeline.

## 1. Prepare the source PDFs

- Keep original PDFs in `public/books/`.
- Git LFS files must be hydrated as real PDFs in the local working copy before extraction. A 130-byte Git LFS pointer is not the PDF.
- Never rename a source PDF merely to make its grade or term appear certain.

## 2. Install and extract

From the repository root:

```bash
npm install
npm run extract:books
npm run validate:extraction
```

The extractor uses PDF.js and writes:

- `src/data/extracted/pages.jsonl`: one JSON record per PDF page.
- `src/data/extracted/manifest.json`: book-level counts and extraction status.

Each page record preserves the repository-relative source path, exact original filename, 1-based PDF page index, extracted text, extraction status, and `reviewStatus: needs_review`.

## 3. Interpret the output safely

- `extracted_needs_review`: text was found; it is not academically approved.
- `empty_or_scanned_needs_ocr`: little/no text was extracted. The page may be scanned, image-only, blank, or otherwise difficult to parse. OCR and visual inspection are required.
- `printedPage` stays null unless the printed page number is separately verified. PDF page index and printed page number are not interchangeable.
- `lfs_pointer_not_downloaded`, `not_a_valid_pdf`, and `pdf_read_error` must be resolved before a book can be used.

## 4. Academic review rules

Extraction is not curriculum authoring. Do not automatically infer grade, term, unit, lesson, answers, or missing words from filenames or context. Build those structures only after checking the relevant pages. Keep every candidate item linked to its source filename and PDF page, and leave it in `needs_review` until checked by an academic reviewer.

## 5. OCR

This first pipeline deliberately does not pretend that image-only pages have been OCR-read. Such pages are counted and flagged. OCR should be added as a separate, testable stage with language packs appropriate to the source page (English and Arabic where needed), retaining page-level provenance.
