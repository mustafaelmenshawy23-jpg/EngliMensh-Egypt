# High-resolution blank-OCR candidate review — Pass 9

## Scope and provenance

- GitHub Actions workflow: `Render blank-page candidates at high resolution`
- Run: [42119862008](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/42119862008)
- Result: successful; render job and all steps completed.
- Artifact: `englimensh-blank-candidates-240dpi` (41 rendered pages; 240 DPI).
- Source PDFs were hydrated from Git LFS before rendering.
- Physical PDF page numbers below are 1-based.
- This is a visual triage pass, not an academic approval or a replacement for searchable text.

## Visual findings

### Pages with substantive visual content that must not be discarded as blank

| Source filename | PDF page | Visual finding |
|---|---:|---|
| `Eng-L2-EB-Part1 (1).pdf` | 62 | Full-page lifestyle photograph with study, exercise, family/friends, and sleep activities |
| `English_Primary6_T1 (1).pdf` | 83 | Museum interior photograph |
| `English_Primary6_T1 (1).pdf` | 84 | “The Water Savers” project poster; also indexed in pass 8 |
| `English_language_2sec_t1 (1).pdf` | 59 | Helicopter/firefighting illustration; already indexed in pass 8 |
| `English_language_prim2_t1 (1).pdf` | 1 | Official Primary 2 cover |
| `English_language_prim3_t1 (1).pdf` | 1 | Official Primary 3 cover |
| `English_language_prim4_t1 (1).pdf` | 1 | Official Primary 4 cover |
| `English_language_prim5_t1 (1).pdf` | 1 | Official Primary 5 cover |
| `المعاصر_كونكت_بلس_1_ابتدائي_ترم_1_ذاكرولي1.pdf` | 4 | Theme 1 opener: “Who am I?” |
| Same Connect Plus Primary 1 source | 216 | El-Moasser Homework Interactive illustrated cover |
| Same Connect Plus Primary 1 source | 270 | Illustrated Units 1–6 phonics reference chart |
| `المعاصر_كونكت_بلس_2_ابتدائي_ترم_1_ذاكرولي.pdf` | 4 | Theme 1 opener: “Who am I?” |
| `المعاصر_كونكت_بلس_4_ابتدائي_ترم_1_ذاكرولي.pdf` | 222 | “Khayameya Summer” reader title page; already indexed in pass 8 |
| `المعاصر_كونكت_بلس_6_ابتدائي_ترم_1_ذاكرولي.pdf` | 175 | “A Wonderful Surprise” reader title page; already indexed in pass 8 |
| `المعاصر_هالو_بلس_1_اعدادي_ترم_1_ذاكرولي.pdf` | 1 | El-Moasser Hello Plus First Preparatory cover |

The newly indexed pass-9 records are in `src/data/extracted/visual-assets-pass9.jsonl`. They retain `needs_review`; visual recognition alone does not approve curriculum content.

### Structural or low-content pages

- `English_language_prim4_t1 (1).pdf`, PDF pp.117–119: ruled Notes pages, not a lesson titled “My Story”.
- Several other 240-DPI renders are visually uniform/solid-color or front/back matter with no readable instructional content at the displayed scale. They remain candidates; do not convert them to confirmed blank pages based only on this pass.

## Important limitations

1. The 240-DPI render is a visual check, not a fresh OCR extraction. No OCR text has been invented from the images.
2. No source page is marked academically approved by this report.
3. The 41-page high-resolution artifact is not the full 73-page earlier visual-review set; it covers only the empty-OCR candidates selected by the workflow.
4. The deferred file `Performance Tasks Prep 2-OnlineMaterials.PDF` remains postponed and was not included in this pass.


## 240-DPI OCR spot-check

A local Tesseract English OCR pass (page segmentation mode 6, followed by targeted mode 11 checks) was run against all 41 rendered images. It produced a nonzero token count on 18 pages and little/no text on 23 pages. **A nonzero OCR count is not proof of usable text**: several pages are photographs, covers, ruled notes, or illustrations, and their OCR output is noise.

Useful observations:
- `English_Primary6_T1 (1).pdf`, PDF p.84: image inspection confirms the exact prominent strings `THE WATER SAVERS` and `SAVE WATER`. These are now recorded in the pass-9 visual asset JSONL.
- Same source, PDF p.83: the page is a museum interior photograph with the visible heading `Lesson 5`; the large OCR token count is false-positive noise from the photograph and hieroglyphic details.
- Connect Plus Primary 1, PDF p.270: OCR partially detects the phonics chart headings and example words, but is incomplete. The chart must continue to use the manual visual transcription already recorded; OCR output must not overwrite it.
- Primary 4 official book, PDF p.119: OCR detects many ruled-line artifacts, not lesson text. Pages 117–119 remain structural Notes pages.
- Covers, theme openers, and reader title pages produce fragmented OCR. Keep the image and metadata; do not treat fragments as verified curriculum text.

No OCR output from this spot-check has been promoted as academically approved lesson text. The OCR pass is diagnostic only.


## 240-DPI page-by-page disposition — follow-up visual pass

All 41 rendered candidates were checked against the manifest in their original 1-based physical PDF page order. This is a visual disposition only; it does not establish that a page is intentionally blank in the source edition.

### Probable blank / unprinted at 240 DPI

The following pages appear uniformly white in the supplied 240-DPI render, with no readable printed content:
- `Eng-L1-EB-Part1 (1).pdf`: p.2
- `Eng-L1-EB-Part2 (1).pdf`: p.2
- `Eng-L2-EB-Part1 (1).pdf`: p.37
- `English_1sec_t1 (1).pdf`: pp.101, 104
- `English_Prep1_T1 (1).pdf`: p.3
- `English_Primary6_T1 (1).pdf`: p.2
- `English_language_2sec_t1 (1).pdf`: p.92
- `English_language_Sec3_tr1 (1).pdf`: pp.108, 153, 254, 285
- `English_language_prep2_t1 (1).pdf`: p.3
- `English_language_prep3_t1 (1).pdf`: p.3
- `English_prim5_t1_Assmt (1).pdf`: p.3

These are recorded as probable blank/unprinted candidates only. Do not silently delete them or call them confirmed blank without checking the original PDF page and surrounding pagination.

### Branded separator / low-text pages

- `Eng-L2-EB-Part1 (1).pdf`, p.96: solid yellow field with institutional seals near the bottom; no lesson text visible.
- `English_prim1_t1_Assmt (1).pdf`, p.74: the image is a solid yellow branded page with seals, not a plain white page. **Correction:** this candidate is a branded separator, not a blank white page.
- `English_prim4_t1_Assmt (1).pdf`, p.66: solid dark-blue branded page with seals; no lesson text visible.
- `English_prim5_t1_Assmt (1).pdf`, p.74: solid teal branded page with seals; no lesson text visible.

Retain these as structural/front-or-back-matter pages, not curriculum lesson text.

### Confirmed visual structures in this pass

- `English_language_prim4_t1 (1).pdf`, pp.117–119: Notes pages.
- Official Primary 2, 3, 4, and 5 covers: respective source PDFs, p.1.
- Connect Plus Primary 1, p.4 and Connect Plus Primary 2, p.4: illustrated Theme 1 openers (“Who am I?”).
- Connect Plus Primary 1, p.216: Homework Interactive cover.
- Connect Plus Primary 1, p.270: phonics chart; use the separately recorded manual transcription for its graphemes, phonemes, and examples.
- Connect Plus Primary 4, p.222 and Primary 6, p.175: reader title pages.
- El-Moasser Hello Plus Prep 1, p.1: commercial coursebook cover.
- El-Moasser Hello Plus Prep 1, pp.292 and 370: two different workbook/section covers (“A Week is Enough” and “Master Your Skills”).

### Correction to an earlier pass-9 label

The earlier pass-9 report and JSONL incorrectly described `English_language_prep3_t1 (1).pdf`, p.3 as an official cover. The 240-DPI image is uniformly white with no visible cover or readable text. That label has been withdrawn; the page is now classified only as a probable blank/unprinted candidate pending source-PDF verification.

### Scope and quality guardrails

- The 41-page list is the workflow's high-resolution empty-text candidate set, not all pages from the 33 available books.
- White render ≠ proven blank page; solid-color seal pages ≠ lesson content.
- No OCR fragments from these pages are promoted to curriculum text.
- All new/updated records retain `needs_review`; none is academically approved.
- `Performance Tasks Prep 2-OnlineMaterials.PDF` remains postponed and excluded.
