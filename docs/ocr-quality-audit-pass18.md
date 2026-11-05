# Pass 18 — OCR quality review preparation

- Candidate set: 20 new pages across 5 source books.
- Candidate pages were selected from the existing page-level extraction artifact and are not reused from the previously indexed review passes.
- The postponed `Performance Tasks Prep 2-OnlineMaterials.PDF` remains excluded for its final dedicated review.
- Source PDFs and machine-extracted page text remain unchanged.
- All candidates remain `needs_review`; this pass prepares high-resolution visual inspection and does not approve extracted text.
- Page references are 1-based physical PDF pages.

## Candidate pages

1–5. `English_language_prim1_t1.pdf` — PDF pp.14, 18, 24, 29, 120.
6–9. `المعاصر_كونكت_بلس_1_ابتدائي_ترم_1_ذاكرولي1.pdf` — PDF pp.19, 54, 79, 103.
10–13. `المعاصر_كونكت_بلس_2_ابتدائي_ترم_1_ذاكرولي.pdf` — PDF pp.13, 76, 121, 229.
14–17. `English_language_2sec_t1 (1).pdf` — PDF pp.6, 48, 60, 72.
18–20. `Story-En-EB-L1 (1).pdf` — PDF pp.3, 37, 58.

## Run instructions

Open [Render Pass 18 OCR quality candidates](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/workflows/render-pass18-quality-audit.yml), select 240 DPI, and run the workflow. It hydrates Git LFS PDFs, renders only these 20 pages, and uploads a review artifact. No extraction text is overwritten.

## Review safeguards

Inspect each rendered page visually before creating any recovery record. Do not infer obscured words, student answers, or printed page numbers. Keep all candidate records academically unverified until separately checked.
