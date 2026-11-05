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
