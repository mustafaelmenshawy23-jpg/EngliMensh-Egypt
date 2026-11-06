# Pass 22 — High-resolution visual confirmation

- Candidate set: 19 source-page pairs across 9 source PDFs.
- Purpose: re-render selected pages from the original 73-page manual-review queue at 300 DPI after their earlier 120-DPI triage, focusing on small visual text, illustrations, theme openers, reader title pages, and structural pages.
- These are targeted high-resolution confirmations, not 19 new OCR failures and not a fresh OCR pass.
- Candidate pairs were checked against the indexed Pass 11 and Pass 13–21 audit manifests; zero duplicate source-page pairs were found.
- The deferred `Performance Tasks Prep 2-OnlineMaterials.PDF` remains excluded.
- Original PDFs and machine extraction remain unchanged.
- All candidates remain `needs_review`; no academic approval is implied.
- Page numbers are 1-based physical PDF pages.

## Candidate pages

1. `English_1sec_t1 (1).pdf` — PDF p.128: Chapter 4 story illustration; preserve visual with adjacent story context.
2. `English_language_Sec3_tr1 (1).pdf` — PDF p.122: Chapter 2 story illustration; preserve as linked visual asset.
3. `English_language_Sec3_tr1 (1).pdf` — PDF p.153: Chapter 5 story illustration; preserve as linked visual asset.
4. `English_language_Sec3_tr1 (1).pdf` — PDF p.281: Ruled Notes page; verify structural layout at high resolution.
5. `English_language_Sec3_tr1 (1).pdf` — PDF p.282: Ruled Notes page; verify structural layout at high resolution.
6. `English_language_Sec3_tr1 (1).pdf` — PDF p.283: Ruled Notes page; verify structural layout at high resolution.
7. `English_Primary6_T1 (1).pdf` — PDF p.83: Museum/interior photograph; inspect any embedded labels or captions.
8. `English_Primary6_T1 (1).pdf` — PDF p.84: The Water Savers illustrated project poster; inspect embedded small text.
9. `المعاصر_كونكت_بلس_1_ابتدائي_ترم_1_ذاكرولي1.pdf` — PDF p.4: Theme 1 opener; retain title and illustrations as structural metadata.
10. `المعاصر_كونكت_بلس_1_ابتدائي_ترم_1_ذاكرولي1.pdf` — PDF p.216: Interactive Homework section opener; inspect page design and labels.
11. `المعاصر_كونكت_بلس_2_ابتدائي_ترم_1_ذاكرولي.pdf` — PDF p.4: Theme 1 opener; retain title and illustrations as structural metadata.
12. `المعاصر_كونكت_بلس_4_ابتدائي_ترم_1_ذاكرولي.pdf` — PDF p.8: Theme 1 opener; retain title and illustrations as structural metadata.
13. `المعاصر_كونكت_بلس_4_ابتدائي_ترم_1_ذاكرولي.pdf` — PDF p.117: Theme 2 opener; retain title and illustrations as structural metadata.
14. `المعاصر_كونكت_بلس_4_ابتدائي_ترم_1_ذاكرولي.pdf` — PDF p.222: Khayameya Summer reader title page; preserve title and illustration.
15. `المعاصر_كونكت_بلس_5_ابتدائي_ترم_1_ذاكرولي.pdf` — PDF p.7: Theme 1 opener; retain title and illustrations as structural metadata.
16. `المعاصر_كونكت_بلس_6_ابتدائي_ترم_1_ذاكرولي.pdf` — PDF p.92: Theme 2 opener; retain title and illustrations as structural metadata.
17. `المعاصر_كونكت_بلس_6_ابتدائي_ترم_1_ذاكرولي.pdf` — PDF p.175: A Wonderful Surprise reader title page; preserve title and illustration.
18. `المعاصر_هالو_بلس_1_اعدادي_ترم_1_ذاكرولي.pdf` — PDF p.292: Hello Plus structural cover/section page; preserve metadata.
19. `المعاصر_هالو_بلس_1_اعدادي_ترم_1_ذاكرولي.pdf` — PDF p.370: Hello Plus skills-branded structural page; preserve metadata.

## Run

Open [Render Pass 22 high-resolution visual confirmations](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/workflows/render-pass22-quality-audit.yml), select **300 DPI**, and click **Run workflow**. The workflow hydrates Git LFS source PDFs, renders 19 pages, and uploads `englimensh-pass22-quality-300dpi`.

## Safeguards

Inspect the original page images. Do not infer obscured words, answers, or printed page numbers. Keep visual observations separate from machine OCR; do not modify `pages.jsonl` or app curriculum/question-bank data. A high-resolution visual observation remains a candidate until separate academic approval.
