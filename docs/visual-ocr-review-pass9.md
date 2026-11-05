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
| `English_language_prep3_t1 (1).pdf` | 3 | Official Preparatory 3 cover |
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
