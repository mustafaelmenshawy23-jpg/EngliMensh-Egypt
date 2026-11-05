# OCR Manual Review Queue

Generated from workflow run #9 artifact `englimensh-extracted-books`. This is technical triage, not academic validation.

- Total flagged pages: **73**
- Text empty after trimming: **41**
- Text non-empty but still flagged: **32**
- All records remain `needs_review`. Inspect the original PDF page image before deciding whether to retry OCR or confirm a blank/graphic-only page.

| Source PDF | Flagged PDF pages | Empty text pages | Non-empty but flagged |
|---|---:|---|---|
| `Eng-L1-EB-Part1 (1).pdf` | 5 | 2, 170 | 39, 74, 102 |
| `Eng-L1-EB-Part2 (1).pdf` | 3 | 2, 162 | 6 |
| `Eng-L2-EB-Part1 (1).pdf` | 3 | 37, 62, 96 | — |
| `English_1sec_t1 (1).pdf` | 4 | 101, 104 | 128, 134 |
| `English_language_2sec_t1 (1).pdf` | 2 | 59, 92 | — |
| `English_language_prep2_t1 (1).pdf` | 1 | 3 | — |
| `English_language_prep3_t1 (1).pdf` | 1 | 3 | — |
| `English_language_prim1_t1.pdf` | 1 | — | 1 |
| `English_language_prim2_t1 (1).pdf` | 2 | 1 | 32 |
| `English_language_prim3_t1 (1).pdf` | 3 | 1 | 45, 69 |
| `English_language_prim4_t1 (1).pdf` | 4 | 1, 117, 118, 119 | — |
| `English_language_prim5_t1 (1).pdf` | 1 | 1 | — |
| `English_language_Sec3_tr1 (1).pdf` | 10 | 108, 153, 254, 285 | 114, 122, 136, 281, 282, 283 |
| `English_Prep1_T1 (1).pdf` | 1 | 3 | — |
| `English_prim1_t1_Assmt (1).pdf` | 2 | 74 | 42 |
| `English_prim4_t1_Assmt (1).pdf` | 1 | 66 | — |
| `English_prim5_t1_Assmt (1).pdf` | 3 | 3, 74 | 1 |
| `English_Primary6_T1 (1).pdf` | 5 | 2, 83, 84 | 1, 86 |
| `المعاصر_كونكت_بلس_1_ابتدائي_ترم_1_ذاكرولي1.pdf` | 6 | 4, 216, 270 | 42, 86, 103 |
| `المعاصر_كونكت_بلس_2_ابتدائي_ترم_1_ذاكرولي.pdf` | 5 | 4 | 1, 121, 229, 290 |
| `المعاصر_كونكت_بلس_4_ابتدائي_ترم_1_ذاكرولي.pdf` | 3 | 222 | 8, 117 |
| `المعاصر_كونكت_بلس_5_ابتدائي_ترم_1_ذاكرولي.pdf` | 1 | — | 7 |
| `المعاصر_كونكت_بلس_6_ابتدائي_ترم_1_ذاكرولي.pdf` | 3 | 175 | 92, 227 |
| `المعاصر_هالو_بلس_1_اعدادي_ترم_1_ذاكرولي.pdf` | 3 | 1, 292, 370 | — |

## Processing rule

Do not delete flagged records or fabricate replacement text. If a page is blank, retain its provenance and mark it blank only after visual confirmation. If it contains readable content, retry OCR with a suitable language, DPI, and segmentation profile while retaining the original PDF filename and 1-based page number.


## Visual spot-check — locally available Primary PDFs

A first visual sample of 15 flagged pages across six locally available Primary PDFs was inspected. This is a spot-check only; it does not clear the remaining flagged pages.

| Source PDF | PDF page | Visual finding | Handling |
|---|---:|---|---|
| `English_language_prim3_t1 (1).pdf` | 1 | Primary 3, Term 1 cover | Preserve cover metadata; OCR not required for body text |
| same | 45 | Illustrated listening/matching exercise | Content-bearing page; OCR retry or manual transcription required |
| same | 69 | Vocabulary/emotions exercise and pair dialogue | Content-bearing page; OCR retry or manual transcription required |
| `English_language_prim4_t1 (1).pdf` | 1 | Primary 4, Term 1 cover | Preserve cover metadata |
| same | 117–119 | Ruled writing/practice pages, including a “My Story” prompt | Do not classify as missing book content; retain page references and identify as student-writing templates |
| `English_language_prim2_t1 (1).pdf` | 1 | Primary 2, Term 1 cover | Preserve cover metadata |
| same | 32 | Lesson 1 classroom-actions vocabulary with pictures | Content-bearing page; OCR retry or manual transcription required |
| `English_language_prim1_t1.pdf` | 1 | Primary 1, Term 1 cover | Preserve cover metadata |
| `English_prim1_t1_Assmt (1).pdf` | 42 | Weekly assessment worksheet with picture-based prompts | Content-bearing assessment page; OCR retry or manual transcription required |
| same | 74 | Decorative closing/back page | No lesson text expected; retain provenance |
| `English_prim5_t1_Assmt (1).pdf` | 1 | Primary 5 English Language Performance Tasks and Assessment cover | Preserve title/grade/term metadata |
| same | 3 | Appears visually blank in the inspected rendering | Confirm against original before marking blank |
| same | 74 | Decorative closing/back page | No lesson text expected; retain provenance |

### What this changes

- A flagged page is not automatically a missing-content defect.
- Covers and decorative end pages should be represented as document metadata/structural pages, not forced into lesson text.
- Student-writing templates should remain available as page assets, even when they contain little extractable text.
- Illustrated vocabulary, listening, dialogue, and assessment pages are priority candidates for targeted OCR/manual capture.
- No page was promoted to academically verified content during this visual spot-check.


## Second visual inspection pass — nine additional page renderings

The original PDFs were rendered locally and inspected at page level. This pass confirms the following:

| Source PDF | PDF page | Finding | Recommended disposition |
|---|---:|---|---|
| `English_language_prim3_t1 (1).pdf` | 45 | Unit exercise: picture-based listening/matching (transport/buildings) | Recover the exercise prompt and labels; retain image references |
| same | 69 | Vocabulary for feelings plus pair dialogue | Recover vocabulary and dialogue; high priority |
| `English_language_prim2_t1 (1).pdf` | 32 | “Classroom Actions” vocabulary with photo prompts | Recover labels/instructions; high priority |
| `English_prim1_t1_Assmt (1).pdf` | 42 | Weekly assessment: unscramble and reorder tasks with picture cues | Recover assessment text and preserve picture-to-item mapping |
| `English_prim5_t1_Assmt (1).pdf` | 1 | Primary 5 English Language Performance Tasks and Assessment cover, First Term | Extract metadata from cover; do not treat as lesson body |
| same | 3 | Rendered page appears blank | Mark as probable blank only after full-resolution/original check |
| `English_language_prim4_t1 (1).pdf` | 117 | “Notes” ruled writing page | Structural writing template; no OCR retry needed |
| same | 118–119 | Ruled writing pages | Structural writing templates; retain page sequence and provenance |

### Corrected triage conclusion

The initial 73-page queue remains intact. This pass visually confirmed that several low-text pages are intentional document structure, while at least four sampled pages contain real instructional or assessment material that OCR failed to capture adequately. The machine output is not overwritten in this pass. These pages remain `needs_review` until a verified manual transcription or improved OCR record is added with the same source filename and PDF page number.

**Next targeted work:** inspect the remaining flagged pages in the secondary/preparatory PDFs and remaining commercial guides; prioritize content-bearing pages over covers, blank writing templates, and decorative end pages.

## Render the review pages without re-uploading books

The repository now includes a dedicated GitHub Actions workflow:
`.github/workflows/render-ocr-review-pages.yml`.

Run **Actions → Render OCR review pages → Run workflow**. It uses the original PDFs already stored in `public/books/`, renders only the 73 queued pages, and uploads an `englimensh-ocr-review-pages` artifact containing page images plus a manifest. This does not rerun OCR and does not require uploading the books again.

The rendered images are evidence for visual triage only. They do not automatically change any page's `needs_review` status or approve curriculum content.

