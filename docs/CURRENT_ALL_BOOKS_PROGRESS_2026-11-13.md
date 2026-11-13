# All-books curriculum inventory and progress — 2026-11-13

> **Status: IN PROGRESS — not a completed curriculum.** This audit is limited to `mustafaelmenshawy23-jpg/EngliMensh-Egypt`, branch `feature/primary-connect-connect-plus-2026-2027`. No other repository was inspected or changed.

## Executive inventory

| Measure | Current repository state |
|---|---:|
| PDF files in `public/books/` | 34 |
| PDFs mapped in `data/curriculum/source-book-index.draft.json` | 33 |
| Unindexed PDFs | 1 |
| Indexed books | 33 |
| Indexed student-book units | 78 |
| Indexed commercial-supplement units | 40 |
| Total indexed unit records | 118 |
| Unit records without a verified `startPdfPage` | 19 |
| Unit-module scaffolds | 118 × 9 modules = 1,062 empty module slots |
| Source-linked lesson draft records | 26; all `needs_review` |
| Primary HTML bundle units | 75; all `needs_review`, with no PDF page references |

The 118 indexed unit records are **not** proof that all PDF units have been indexed. Two indexed commercial supplements currently have zero unit entries, 19 unit records have no verified starting page, and one PDF is not mapped to the source index.

## PDF inventory

| PDF in `public/books/` | Source-index ID | Type | Indexed units |
|---|---|---|---:|
| `Eng-L1-EB-Part1 (1).pdf` | `baccalaureate-y2-first-language-part1` | student_book | 5 |
| `Eng-L1-EB-Part2 (1).pdf` | `baccalaureate-y2-first-language-part2` | student_book | 5 |
| `Eng-L2-EB-Part1 (1).pdf` | `baccalaureate-y2-second-language-part1` | student_book | 3 |
| `English 1prep-1تقييمات اولى عYasser Salah .pdf` | `prep1-assessment-term1` | assessment | 0 |
| `English_1sec_t1 (1).pdf` | `secondary1-student-term1` | student_book | 6 |
| `English_Prep1_T1 (1).pdf` | `prep1-student-term1` | student_book | 6 |
| `English_Primary6_T1 (1).pdf` | `primary6-student-term1` | student_book | 6 |
| `English_language_2sec_t1 (1).pdf` | `secondary2-student-term1` | student_book | 6 |
| `English_language_Sec3_tr1 (1).pdf` | `secondary3-student-term1` | student_book | 6 |
| `English_language_prep2_t1 (1).pdf` | `prep2-student-term1` | student_book | 6 |
| `English_language_prep3_t1 (1).pdf` | `prep3-student-term1` | student_book | 6 |
| `English_language_prim1_t1.pdf` | `primary1-student-term1` | student_book | 3 |
| `English_language_prim2_t1 (1).pdf` | `primary2-student-term1` | student_book | 4 |
| `English_language_prim3_t1 (1).pdf` | `primary3-student-term1` | student_book | 4 |
| `English_language_prim4_t1 (1).pdf` | `primary4-student-term1` | student_book | 6 |
| `English_language_prim5_t1 (1).pdf` | `primary5-student-term1` | student_book | 6 |
| `English_prim1_t1_Assmt (1).pdf` | `primary1-assessment-term1` | assessment | 0 |
| `English_prim2_t1_Assmt (1).pdf` | `primary2-assessment-term1` | assessment | 0 |
| `English_prim4_t1_Assmt (1).pdf` | `primary4-assessment-term1` | assessment | 0 |
| `English_prim5_t1_Assmt (1).pdf` | `primary5-assessment-term1` | assessment | 0 |
| `English_prim6_t1_Assmt (1).pdf` | `primary6-assessment-term1` | assessment | 0 |
| `Hello plus prep 3 كامل(1).pdf` | `helloplus-prep3-supplement` | commercial_supplement | 6 |
| `Performance Tasks Prep 2-OnlineMaterials.PDF` | **UNINDEXED** | not yet classified | — |
| `Story-En-EB-L1 (1).pdf` | `baccalaureate-y1-lost-world-reader` | reader | 0 |
| `المعاصر_كونكت_بلس_1_ابتدائي_ترم_1_ذاكرولي1.pdf` | `connectplus-primary1-supplement` | commercial_supplement | 6 |
| `المعاصر_كونكت_بلس_2_ابتدائي_ترم_1_ذاكرولي.pdf` | `connectplus-primary2-supplement` | commercial_supplement | 6 |
| `المعاصر_كونكت_بلس_3_ابتدائي_ترم_1_ذاكرولي.pdf` | `connectplus-primary3-supplement` | commercial_supplement | 6 |
| `المعاصر_كونكت_بلس_4_ابتدائي_ترم_1_ذاكرولي.pdf` | `connectplus-primary4-supplement` | commercial_supplement | 6 |
| `المعاصر_كونكت_بلس_5_ابتدائي_ترم_1_ذاكرولي.pdf` | `connectplus-primary5-supplement` | commercial_supplement | 0 |
| `المعاصر_كونكت_بلس_6_ابتدائي_ترم_1_ذاكرولي.pdf` | `connectplus-primary6-supplement` | commercial_supplement | 4 |
| `المعاصر_هالو_بلس_1_اعدادي_ترم_1_ذاكرولي.pdf` | `helloplus-prep1-supplement` | commercial_supplement | 6 |
| `المعاصر_هالو_بلس_تانية_إعدادي_كتاب_الشرح_1.pdf` | `helloplus-prep2-supplement` | commercial_supplement | 0 |
| `كتاب تقييمات الصف الثالث 2026.pdf` | `primary3-assessment-term1` | assessment | 0 |
| `كتاب_تقيمات_الصف_الثالث_الاعدادي_2026.pdf` | `prep3-assessment-term1` | assessment | 0 |

## Unit-index gaps requiring PDF verification

The following 19 indexed unit records currently have no verified starting page:

- `secondary2-student-term1`: Units 1–6 — Egypt–Africa Cooperation; Startups & Young Entrepreneurs; Sustainable Development Goals (SDG); Natural Disasters; Media Manipulation; Soft Skills Vs. Hard Skills.
- `baccalaureate-y2-first-language-part1`: Unit 2 Leisure Time; Unit 3 Echoes of the Past.
- `baccalaureate-y2-first-language-part2`: Unit 7 Discovering Your Passion; Unit 8 Pathways to Progress.
- `primary3-student-term1`: Unit 3 New Adventures.
- `primary6-student-term1`: Unit 4 Resources Around Us; Unit 6 Wise Savers.
- `helloplus-prep3-supplement`: Units 1–6 — My World; Changes; Ambitions; Traditional Stories; News and Media; Literature — The Prisoner of Zenda.

Two indexed supplements currently have **zero unit entries** and need their actual PDF contents inspected before units can be added:

- `connectplus-primary5-supplement`
- `helloplus-prep2-supplement`

The Primary 1 student PDF currently has only 3 units in the source index. Older repository notes describe a larger outline; this discrepancy must be resolved from the PDF itself, not by copying the older count. The 75-unit Primary HTML bundle is a separate source and is not evidence of PDF unit boundaries.

## Existing extracted and generated data

- The committed `src/data/extracted/manifest.json` is dated 2026-11-07 and reports 34 books but zero processed pages. The committed `pages.jsonl` contains 56 page records only: 38 from `Eng-L1-EB-Part1 (1).pdf` and 18 from `English_language_prim1_t1.pdf`. These two tracked files are inconsistent and are not a current all-book extraction.
- `src/data/lessons/lessons.draft.json` contains 26 source-linked records; all 26 remain `needs_review`.
- `artifacts/unit-drafts/` currently contains four unit drafts:
  - Primary 1 Unit 1: 18 source pages; nine sections, but only four games and no verified speaker-gender metadata in the existing draft.
  - Primary 1 Unit 2: 17 source pages; six populated sections; listening, speaking and games are absent.
  - Primary 1 Unit 3: 19 source pages; six populated sections; listening, speaking and games are absent.
  - Baccalaureate Year 2 First Language Part 1 Unit 4: 38 source pages; eight populated sections; games are absent and the comprehensive test has only two items.
- None of these drafts is academically approved. The old `artifacts/unit-drafts/progress.json` is dated 2026-11-06 and records five source-review blocks; it is not a current completion report.
- The separate Primary HTML bundle contains 75 units (39 General + 36 Advanced), but its provenance is `user_supplied_html_bundle`, it has no PDF page references, and its root and unit review statuses are `needs_review`. It must not be treated as PDF-derived or approved content.

## Code and pipeline changes made in this run

1. Added the missing `speaking` module to every one of the 118 unit scaffolds. The scaffold now has nine independent module types: vocabulary, vocabulary questions, grammar, grammar questions, reading, listening, speaking, games, comprehensive test.
2. Strengthened unit validation:
   - all nine sections must exist and be populated;
   - speaking dialogue turns require `speakerGender: male|female`, speaker and text;
   - each game requires name, type, skill, difficulty, description and source provenance;
   - the five requested game skills must all be represented;
   - reading and listening require their text/script and comprehension questions;
   - vocabulary and grammar require examples;
   - multiple-choice questions are restricted to 3–4 distinct options with a checked answer and explanation.
3. Updated the generator schema and prompt for gender-tagged speaking turns, five skill-varied games and separate reading/listening comprehension questions. Gemini credential rotation now includes the primary key and three backup secrets. The unrelated offline Unit 4 fallback was removed so it cannot be reused for another unit.
4. Reworked the batch generator so it skips a prior draft only when all nine modules are populated, source-page coverage is complete, the source gate is not blocked, and the current quality validator passes. It now scans past completed or source-blocked units to find the next incomplete, source-eligible batch.
5. Made the generation workflow branch-safe: it rebases and pushes to the checked-out branch instead of hard-coding `main`; partial LFS hydration no longer immediately stops extraction.
6. Made the extraction workflow inventory all PDFs, attempt LFS hydration without failing the entire run for one unavailable object, continue with hydrated PDFs, checkpoint OCR and upload partial results even if later validation fails.
7. Updated the app to expose nine separate unit-section cards and to label all indexed units as review-pending. Unapproved Primary 1 draft artifacts and the unapproved Primary HTML bundle are now held back from student display. The original PDFs remain unchanged.

## Verification and active runs

- Validation run **43384233236** passed: source index checks, review-candidate checks, visual-recovery checks, lesson-content validation, nine-module scaffold validation, generator syntax checks, automated tests and production build.
  - https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/43384233236
- The later app/UI validation run **43384325714** was started for the review-gating and nine-section UI commit; its result must be checked before treating that UI change as verified.
  - https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/43384325714
- Full source extraction/OCR run **43382237895** successfully completed checkout, dependency installation, LFS hydration attempt, page-text extraction and OCR setup. It was still processing scanned pages when this report was written; no final extraction totals or artifact are available yet.
  - https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/43382237895

## Known limitations and next work

- **No all-book OCR result yet:** wait for run 43382237895, inspect its artifact, compare extracted page totals against all 34 PDFs, and record every missing/failed page.
- **Index reconciliation:** classify the unindexed Performance Tasks PDF; resolve the two zero-unit supplements; verify Primary 1's unit count; fill the 19 missing page starts only from PDF evidence.
- **Batch generation has not yet run against the refreshed all-book OCR output.** After extraction is available, run the resumable batch in small groups, retain failures and incomplete drafts, and do not promote unapproved content.
- **Assessment coverage:** the eight assessment PDFs (plus the unindexed Performance Tasks PDF after classification) still need a source-backed exam-blueprint audit before unit/book comprehensive tests can be called ministry-aligned.
- **App integration:** the review hold is in place, but a general renderer/promotion path for approved drafts and interactive per-unit games still needs implementation and testing. The app currently does not prove that every generated module works as a learner activity.
- **Speaking audio:** the current `speakText` path calls native TTS with language/rate/pitch/volume only and uses the browser's default speech voice as fallback. No male/female voice selection or verified voice-ID mapping is implemented, and no on-device voice test has been performed. The app's current `main.js` has no active microphone-capture path. Gender metadata is now validated in generated dialogue, but gender-matched playback remains unverified and must not be claimed as working.
- **Approval:** all generated records remain drafts until an explicit academic review/approval path records who approved them and when. A successful JSON generation, validation or build is not proof of curriculum completion.

**Completion rule:** do not mark any book or unit complete until all nine modules are source-linked or clearly labelled supplementary, the questions and answer keys pass validation, page coverage is complete, academic approval is recorded, and the approved content is actually rendered and tested in the app.
