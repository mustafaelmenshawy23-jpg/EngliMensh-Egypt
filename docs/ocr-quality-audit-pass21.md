# Pass 21 — OCR quality review preparation

- Candidate set: 20 source-page pairs across 14 source PDFs.
- Selection used the local 5,626-page extraction index and excluded the Pass 7–20 page pairs indexed during candidate selection; a final visual review is still required.
- Three pages have empty machine extraction; the remaining candidates have short or fragmented extraction.
- The deferred `Performance Tasks Prep 2-OnlineMaterials.PDF` remains excluded for its dedicated final review.
- Original PDFs and `pages.jsonl` are unchanged.
- Every candidate remains `needs_review`; this is not academic approval.
- All page numbers are 1-based physical PDF pages.

## Candidate pages

1. `Eng-L2-EB-Part1 (1).pdf` — PDF p.96 (ocr_empty_needs_manual_review)
2. `English_prim4_t1_Assmt (1).pdf` — PDF p.66 (ocr_empty_needs_manual_review)
3. `English_prim5_t1_Assmt (1).pdf` — PDF p.74 (ocr_empty_needs_manual_review)
4. `English_language_prim5_t1 (1).pdf` — PDF p.20 (extracted_needs_review)
5. `English_language_prim1_t1.pdf` — PDF p.61 (extracted_needs_review)
6. `English_language_prim1_t1.pdf` — PDF p.105 (extracted_needs_review)
7. `Eng-L2-EB-Part1 (1).pdf` — PDF p.68 (extracted_needs_review)
8. `المعاصر_هالو_بلس_تانية_إعدادي_كتاب_الشرح_1.pdf` — PDF p.1 (extracted_needs_review)
9. `المعاصر_هالو_بلس_تانية_إعدادي_كتاب_الشرح_1.pdf` — PDF p.2 (extracted_needs_review)
10. `كتاب_تقيمات_الصف_الثالث_الاعدادي_2026.pdf` — PDF p.1 (extracted_needs_review)
11. `Hello plus prep 3 كامل(1).pdf` — PDF p.1 (ocr_extracted_needs_review)
12. `المعاصر_كونكت_بلس_1_ابتدائي_ترم_1_ذاكرولي1.pdf` — PDF p.246 (ocr_extracted_needs_review)
13. `المعاصر_كونكت_بلس_5_ابتدائي_ترم_1_ذاكرولي.pdf` — PDF p.237 (ocr_extracted_needs_review)
14. `English_language_prim3_t1 (1).pdf` — PDF p.9 (ocr_extracted_needs_review)
15. `المعاصر_كونكت_بلس_6_ابتدائي_ترم_1_ذاكرولي.pdf` — PDF p.244 (ocr_extracted_needs_review)
16. `المعاصر_كونكت_بلس_6_ابتدائي_ترم_1_ذاكرولي.pdf` — PDF p.1 (ocr_extracted_needs_review)
17. `كتاب تقييمات الصف الثالث 2026.pdf` — PDF p.1 (ocr_extracted_needs_review)
18. `English_language_prim3_t1 (1).pdf` — PDF p.57 (ocr_extracted_needs_review)
19. `المعاصر_كونكت_بلس_1_ابتدائي_ترم_1_ذاكرولي1.pdf` — PDF p.146 (ocr_extracted_needs_review)
20. `English_prim4_t1_Assmt (1).pdf` — PDF p.3 (ocr_extracted_needs_review)

## Run

Open [Render Pass 21 OCR quality candidates](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/workflows/render-pass21-quality-audit.yml), select 240 DPI, and click **Run workflow**. The workflow hydrates Git LFS source PDFs, renders 20 pages, and uploads the artifact `englimensh-pass21-quality-240dpi`.

## Safeguards

Inspect the original page images. Do not infer obscured words, answers, or printed page numbers. Keep visual observations separate from machine OCR; do not modify `pages.jsonl` or app curriculum/question-bank data.
