# OCR recovery note — 9 November 2026

## Newly identified extraction false positive

The extracted page records for `المعاصر_هالو_بلس_تانية_إعدادي_كتاب_الشرح_1.pdf` (288 physical PDF pages) contain the same short Telegram watermark string on every page. The previous extractor counted each page as text-extracted because the watermark exceeded 20 characters. It therefore did not queue the pages for OCR. This is not reliable curriculum extraction and the book correctly remains unindexed at unit level.

## Recovery change prepared

- Detect repeated short text signatures within each PDF (maximum 250 characters, at least 8 repetitions and at least 25% of the book).
- Preserve the original extracted watermark text in `preOcrText` for traceability.
- Clear only the suspect `text` field and re-queue those pages for OCR; do not delete or alter the original PDF.
- Download only the PDF files containing detected watermark-only pages when restoring the previous extraction cache.
- Re-run the existing Tesseract OCR process at 200 DPI. OCR output remains `needs_review`.
- If OCR still cannot recover a page, the source-quality gate will block the affected unit and the page-level report will show the exact page number.

## Safety

The detector is conservative and only flags short, repeated text; full-length lesson pages are not cleared. Automated tests cover repeated watermarks, mixed books, normal unique lesson text, and small repeated sets.

This repair does not itself add Hello Plus Prep 2 units. Unit titles and page boundaries must be read from the recovered source pages and checked before they are added to the index.
