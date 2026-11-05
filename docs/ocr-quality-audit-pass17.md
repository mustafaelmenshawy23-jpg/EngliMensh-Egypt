# Pass 17 — OCR quality review preparation

- Candidate set: 20 pages across 10 source books.
- Source: the existing page-level extraction output; no source PDF or extracted page text is modified.
- All candidates remain `needs_review`; this pass prepares high-resolution visual inspection and does not approve extracted text.
- The postponed `Performance Tasks Prep 2-OnlineMaterials.PDF` remains excluded for the final dedicated step.
- Page references are 1-based physical PDF pages.

## Candidate pages

1. `Eng-L1-EB-Part1 (1).pdf` — PDF p.39: Leisure Time
2. `Eng-L1-EB-Part1 (1).pdf` — PDF p.74: Echoes of the Past
3. `Eng-L1-EB-Part1 (1).pdf` — PDF p.102: The Power of Choice
4. `Eng-L1-EB-Part2 (1).pdf` — PDF p.6: The Space We Share
5. `Eng-L1-EB-Part2 (1).pdf` — PDF p.162: OCR empty
6. `Eng-L2-EB-Part1 (1).pdf` — PDF p.4: UNIT PEOPLE & FRIENDS
7. `Eng-L2-EB-Part1 (1).pdf` — PDF p.37: OCR empty
8. `Eng-L2-EB-Part1 (1).pdf` — PDF p.62: OCR empty
9. `English_1sec_t1 (1).pdf` — PDF p.121: The Big Fish Bites
10. `English_1sec_t1 (1).pdf` — PDF p.134: Chapter 5
11. `English_language_Sec3_tr1 (1).pdf` — PDF p.114: Chapter 1
12. `English_language_Sec3_tr1 (1).pdf` — PDF p.119: A Treacherous Plot
13. `English_language_Sec3_tr1 (1).pdf` — PDF p.129: Betrayal and Arrest
14. `English_language_Sec3_tr1 (1).pdf` — PDF p.133: The Prison of Château d’If
15. `English_language_Sec3_tr1 (1).pdf` — PDF p.136: Chapter 4
16. `English_Primary6_T1 (1).pdf` — PDF p.27: The Wonderful Nile River
17. `English_language_prep2_t1 (1).pdf` — PDF p.3: OCR empty
18. `English_language_prep3_t1 (1).pdf` — PDF p.3: OCR empty
19. `المعاصر_كونكت_بلس_1_ابتدائي_ترم_1_ذاكرولي1.pdf` — PDF p.69: pencil case
20. `المعاصر_كونكت_بلس_2_ابتدائي_ترم_1_ذاكرولي.pdf` — PDF p.222: dolphin, phone, whale

## Run instructions

Open [Render Pass 17 OCR quality candidates](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/workflows/render-pass17-quality-audit.yml), select 240 DPI, and run the workflow. It hydrates Git LFS PDFs, renders only these 20 pages, and uploads a review artifact. No extraction text is overwritten.

## Review safeguards

The rendered pages must be visually inspected before any recovery record is created. Do not infer obscured words, student answers, or printed page numbers. Keep every candidate academically unverified until separately checked.
