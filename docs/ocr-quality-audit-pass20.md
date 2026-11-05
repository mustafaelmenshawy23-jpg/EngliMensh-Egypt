# Pass 20 — OCR quality review preparation

- Candidate set: 20 new source pages across 14 source books.
- Checked against all indexed Pass 7–19 page records: zero duplicate source-page pairs.
- Candidates were selected from pages with empty, short, fragmented, title-only, or otherwise low-context machine extraction.
- The postponed `Performance Tasks Prep 2-OnlineMaterials.PDF` remains excluded for its final dedicated review.
- Original PDFs and `pages.jsonl` remain unchanged.
- All candidates remain `needs_review`; no academic approval is implied.
- Page numbers are 1-based physical PDF pages.

## Candidate pages

1. `Eng-L1-EB-Part1 (1).pdf` — PDF p.172 (ocr_extracted_needs_review)
2. `Eng-L1-EB-Part2 (1).pdf` — PDF p.164 (ocr_extracted_needs_review)
3. `English_1sec_t1 (1).pdf` — PDF p.102 (extracted_needs_review)
4. `English_1sec_t1 (1).pdf` — PDF p.103 (extracted_needs_review)
5. `English_1sec_t1 (1).pdf` — PDF p.108 (extracted_needs_review)
6. `English_language_2sec_t1 (1).pdf` — PDF p.93 (extracted_needs_review)
7. `English_language_prim2_t1 (1).pdf` — PDF p.83 (ocr_extracted_needs_review)
8. `English_language_Sec3_tr1 (1).pdf` — PDF p.106 (extracted_needs_review)
9. `English_language_Sec3_tr1 (1).pdf` — PDF p.110 (extracted_needs_review)
10. `English_language_Sec3_tr1 (1).pdf` — PDF p.113 (extracted_needs_review)
11. `English_language_Sec3_tr1 (1).pdf` — PDF p.1 (extracted_needs_review)
12. `English_prim4_t1_Assmt (1).pdf` — PDF p.2 (ocr_extracted_needs_review)
13. `English_prim6_t1_Assmt (1).pdf` — PDF p.1 (ocr_extracted_needs_review)
14. `English_Primary6_T1 (1).pdf` — PDF p.10 (ocr_extracted_needs_review)
15. `Story-En-EB-L1 (1).pdf` — PDF p.78 (ocr_extracted_needs_review)
16. `المعاصر_كونكت_بلس_3_ابتدائي_ترم_1_ذاكرولي.pdf` — PDF p.1 (ocr_extracted_needs_review)
17. `المعاصر_كونكت_بلس_3_ابتدائي_ترم_1_ذاكرولي.pdf` — PDF p.7 (ocr_extracted_needs_review)
18. `المعاصر_كونكت_بلس_4_ابتدائي_ترم_1_ذاكرولي.pdf` — PDF p.298 (ocr_extracted_needs_review)
19. `المعاصر_كونكت_بلس_5_ابتدائي_ترم_1_ذاكرولي.pdf` — PDF p.88 (ocr_extracted_needs_review)
20. `المعاصر_هالو_بلس_1_اعدادي_ترم_1_ذاكرولي.pdf` — PDF p.5 (ocr_extracted_needs_review)

## Run instructions

Open [Render Pass 20 OCR quality candidates](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/workflows/render-pass20-quality-audit.yml), select 240 DPI, and run the workflow. The workflow hydrates Git LFS PDFs, renders these 20 pages, and uploads the visual-review artifact.

## Safeguards

Inspect every rendered page visually. Do not infer obscured text, student answers, or printed page numbers. Covers, copyright/imprint pages, blank pages, and front/back matter must be classified as such, not converted into lesson content. Keep all recovery candidates separate from the machine OCR and app curriculum/question bank pending academic review.
