# Repository-wide inventory and pipeline audit — 7 November 2026

> **Historical snapshot — superseded on 8 November 2026.** The counts and inventory below describe the 7 November audit and should not be used as the current totals. The current verified inventory is 34 indexed books, 34 PDF files, and 118 indexed units (78 official student-book units and 40 commercial-supplement units). See [the current coverage report](CURRICULUM_COVERAGE_STATUS_2026-11-08.md) and [the live unit scaffold index](../src/data/lessons/unit-modules.draft.json) for the reconciled status.

**Repository scope:** `mustafaelmenshawy23-jpg/EngliMensh-Egypt` only.  
**Default branch:** `main`.  
**Audit baseline before this commit:** `993bda1b0697b01cf769b2fbea2782c474de752d`.  
No other EngliMensh repository was opened or modified.

## 1. Source inventory

| Measure | Verified snapshot |
|---|---:|
| PDF files in `public/books/` Git tree | 34 |
| Books in `data/curriculum/source-book-index.draft.json` | 33 |
| Student books | 15 |
| Student-book unit records | 81 |
| Commercial supplements | 9 |
| Commercial-supplement unit records | 40 |
| Assessment PDFs | 8 (no unit records; book-level assessment sources) |
| Reader PDFs | 1 (no chapter/unit records yet) |
| **Total indexed unit records after this audit** | **121** |
| Units with a start page | 102 |
| Units missing a verified start page | 19 |
| Safely delimited unit candidates | 97 |
| Units with ambiguous next-unit boundaries | 5 |
| Teacher-approved units | 0 |

The 34th PDF is `Performance Tasks Prep 2-OnlineMaterials.PDF`. It is present as a Git LFS pointer but was reported as unavailable during the last extraction audit and is not indexed. The prior catalog records 33 successfully processed PDFs and 5,626 page records in extraction artifact run [#42090067057](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/42090067057). That artifact contains `pages.jsonl` and `manifest.json`; those generated extraction files are not tracked on `main`.

## 2. Complete indexed book/unit inventory

- **prep1-student-term1** — Preparatory 1 · student book · `English_Prep1_T1 (1).pdf` — 6 unit(s): U1 Life in a Digital World (p13); U2 Learning to Learn (p27); U3 Role Models (p41); U4 Smart Choices (p59); U5 Future Dreams (p73); U6 Global Citizens (p87)
- **prep2-student-term1** — Preparatory 2 · student book · `English_language_prep2_t1 (1).pdf` — 6 unit(s): U1 Gen Alpha (p13); U2 My Digital Footprint (p27); U3 Facing Challenges (p41); U4 Expression (p58); U5 Around the World (p72); U6 Young Innovators (p87)
- **prep3-student-term1** — Preparatory 3 · student book · `English_language_prep3_t1 (1).pdf` — 6 unit(s): U1 Personal Identity (p13); U2 Communication with Family and Friends (p27); U3 Artificial Intelligence (p41); U4 Screen Time (p59); U5 Design Thinking (p72); U6 Why Do We Like Stories? (p85)
- **secondary1-student-term1** — Secondary 1 · student book · `English_1sec_t1 (1).pdf` — 6 unit(s): U1 Egypt’s Heritage (p11); U2 Hands Help, Hearts Care (p24); U3 Truth Vs. Lies (p36); U4 Save and Shine (p57); U5 Using Technology at Schools (p69); U6 Job Hunting (p80)
- **secondary2-student-term1** — Secondary 2 · student book · `English_language_2sec_t1 (1).pdf` — 6 unit(s): U1 Egypt–Africa Cooperation (pstart missing); U2 Startups & Young Entrepreneurs (pstart missing); U3 Sustainable Development Goals (SDG) (pstart missing); U4 Natural Disasters (pstart missing); U5 Media Manipulation (pstart missing); U6 Soft Skills Vs. Hard Skills (pstart missing)
- **secondary3-student-term1** — Secondary 3 · student book · `English_language_Sec3_tr1 (1).pdf` — 6 unit(s): U1 Inside the World of Care (p12); U2 The Power of Machines (p24); U3 Protect Nature, Protect Future (p36); U4 Marine Life (p55); U5 From Muscles to Mindset (p68); U6 Let’s Hang Out! (p82)
- **baccalaureate-y2-first-language-part1** — Baccalaureate Year 2 · student book · `Eng-L1-EB-Part1 (1).pdf` — 5 unit(s): U1 Living Well in a Complex World (p12); U2 Leisure Time (pstart missing); U3 Echoes of the Past (pstart missing); U4 The Power of Choice (p102); U5 The Greenhouse Effect (p140)
- **baccalaureate-y2-first-language-part2** — Baccalaureate Year 2 · student book · `Eng-L1-EB-Part2 (1).pdf` — 5 unit(s): U6 A World for All (p6); U7 Discovering Your Passion (pstart missing); U8 Pathways to Progress (pstart missing); U9 Circles of Belonging (p101); U10 Behind the Buy (p126)
- **connectplus-primary1-supplement** — Primary 1 · commercial supplement · `المعاصر_كونكت_بلس_1_ابتدائي_ترم_1_ذاكرولي1.pdf` — 6 unit(s): U1 This is me (p10); U2 Meet my family (p43); U3 In my community (p70); U4 On the farm (p109); U5 Transportation (p146); U6 The world around us (p179)
- **connectplus-primary2-supplement** — Primary 2 · commercial supplement · `المعاصر_كونكت_بلس_2_ابتدائي_ترم_1_ذاكرولي.pdf` — 6 unit(s): U1 Ready, get set, go! (p11); U2 Let’s get fit! (p56); U3 A day in my life (p87); U4 Into space (p128); U5 A boat trip (p158); U6 Monuments (p207)
- **connectplus-primary3-supplement** — Primary 3 · commercial supplement · `المعاصر_كونكت_بلس_3_ابتدائي_ترم_1_ذاكرولي.pdf` — 6 unit(s): U1 At the track (p12); U2 Body matters (p58); U3 What’s on your plate? (p90); U4 In the wild (p129); U5 All about water (p167); U6 What is a flood? (p204)
- **connectplus-primary4-supplement** — Primary 4 · commercial supplement · `المعاصر_كونكت_بلس_4_ابتدائي_ترم_1_ذاكرولي.pdf` — 6 unit(s): U1 What do I do? (p15); U2 Plants and animals (p49); U3 My world (p85); U4 City and country (p124); U5 Resources in our world (p166); U6 Let’s work (p190)
- **connectplus-primary5-supplement** — Primary 5 · commercial supplement · `المعاصر_كونكت_بلس_5_ابتدائي_ترم_1_ذاكرولي.pdf` — 0 unit(s): No unit records indexed — book-level or contents-page review required
- **connectplus-primary6-supplement** — Primary 6 · commercial supplement · `المعاصر_كونكت_بلس_6_ابتدائي_ترم_1_ذاكرولي.pdf` — 4 unit(s): U1 Express yourself! (p13); U2 Home is where the heart is (p50); U3 School time! (p93); U4 We can make a difference! (p132)
- **helloplus-prep1-supplement** — Preparatory 1 · commercial supplement · `المعاصر_هالو_بلس_1_اعدادي_ترم_1_ذاكرولي.pdf` — 6 unit(s): U1 Friends matter (p8); U2 The world of work (p48); U3 Activities (p91); U4 Shopping well (p160); U5 Feeling well (p196); U6 Literature: The Prince and the Pauper — Part A (p251)
- **primary1-student-term1** — Primary 1 · student book · `English_language_prim1_t1.pdf` — 6 unit(s): U1 Welcome to My School (p7); U2 The Garden of Colors and Shapes (p25); U3 I Love My Family (p42); U4 My Body and My Senses (p65); U5 On the Farm (p84); U6 Animals Around Me (p103)
- **primary2-student-term1** — Primary 2 · student book · `English_language_prim2_t1 (1).pdf` — 4 unit(s): U1 Let’s Get Started! (p7); U2 Colors, Shapes, and Numbers 1–20 (p19); U3 Classroom Actions & Routines (p31); U4 Everyday Life (p51)
- **primary3-student-term1** — Primary 3 · student book · `English_language_prim3_t1 (1).pdf` — 4 unit(s): U1 Let’s Learn Together! (p13); U2 My Family (p29); U3 New Adventures (pstart missing); U4 Let’s Tell Stories! (p71)
- **primary4-student-term1** — Primary 4 · student book · `English_language_prim4_t1 (1).pdf` — 6 unit(s): U1 The Five Senses (p8); U2 My Community (p24); U3 Animals in Our World (p40); U4 Egypt – My Homeland (p62); U5 A Day at Work (p80); U6 The Hundred Dresses (p96)
- **primary5-student-term1** — Primary 5 · student book · `English_language_prim5_t1 (1).pdf` — 6 unit(s): U1 Food, Nature, and Culture (p8); U2 My Healthy Body (p26); U3 When Nature Changes (p41); U4 My Community (p61); U5 Our World, Our Resources (p77); U6 The Talking Earth (p92)
- **primary6-student-term1** — Primary 6 · student book · `English_Primary6_T1 (1).pdf` — 6 unit(s): U1 Amazing Places in Egypt (p7); U2 How’s the Weather in Your City? (p24); U3 Jobs that Help the Community (p37); U4 Resources Around Us (pstart missing); U5 Made in Egypt (p70); U6 Wise Savers (pstart missing)
- **baccalaureate-y2-second-language-part1** — Baccalaureate Year 2 · student book · `Eng-L2-EB-Part1 (1).pdf` — 3 unit(s): U1 People & Friends (p6); U2 Places & Directions in My Town (p40); U3 Daily Routine & Technology Use (p64)
- **baccalaureate-y1-lost-world-reader** — Baccalaureate Year 1 · reader · `Story-En-EB-L1 (1).pdf` — 0 unit(s): No unit records indexed — book-level or contents-page review required
- **primary1-assessment-term1** — Primary 1 · assessment · `English_prim1_t1_Assmt (1).pdf` — 0 unit(s): No unit records indexed — book-level or contents-page review required
- **primary2-assessment-term1** — Primary 2 · assessment · `English_prim2_t1_Assmt (1).pdf` — 0 unit(s): No unit records indexed — book-level or contents-page review required
- **primary3-assessment-term1** — Primary 3 · assessment · `كتاب تقييمات الصف الثالث 2026.pdf` — 0 unit(s): No unit records indexed — book-level or contents-page review required
- **primary4-assessment-term1** — Primary 4 · assessment · `English_prim4_t1_Assmt (1).pdf` — 0 unit(s): No unit records indexed — book-level or contents-page review required
- **primary5-assessment-term1** — Primary 5 · assessment · `English_prim5_t1_Assmt (1).pdf` — 0 unit(s): No unit records indexed — book-level or contents-page review required
- **primary6-assessment-term1** — Primary 6 · assessment · `English_prim6_t1_Assmt (1).pdf` — 0 unit(s): No unit records indexed — book-level or contents-page review required
- **prep1-assessment-term1** — Preparatory 1 · assessment · `English 1prep-1تقييمات اولى عYasser Salah .pdf` — 0 unit(s): No unit records indexed — book-level or contents-page review required
- **prep3-assessment-term1** — Preparatory 3 · assessment · `كتاب_تقيمات_الصف_الثالث_الاعدادي_2026.pdf` — 0 unit(s): No unit records indexed — book-level or contents-page review required
- **helloplus-prep2-supplement** — Preparatory 2 · commercial supplement · `المعاصر_هالو_بلس_تانية_إعدادي_كتاب_الشرح_1.pdf` — 0 unit(s): No unit records indexed — book-level or contents-page review required
- **helloplus-prep3-supplement** — Preparatory 3 · commercial supplement · `Hello plus prep 3 كامل(1).pdf` — 6 unit(s): U1 My World (pstart missing); U2 Changes (pstart missing); U3 Ambitions (pstart missing); U4 Traditional Stories (pstart missing); U5 News and Media (pstart missing); U6 Literature — The Prisoner of Zenda (pstart missing)

## 3. Primary 1 source-page correction applied in this audit

The earlier GitHub index represented only three Primary 1 units and placed Unit 2 at PDF page 26 and Unit 3 at page 45. Page-level text in extraction artifact run #42090067057 shows the following actual unit openings:

| Unit | Title | Physical PDF page |
|---:|---|---:|
| 1 | Welcome to My School | 7 |
| 2 | The Garden of Colors and Shapes | 25 |
| 3 | I Love My Family | 42 |
| 4 | My Body and My Senses | 65 |
| 5 | On the Farm | 84 |
| 6 | Animals Around Me | 103 |

The same source identifies Review 1 at page 61 and Review 2 at page 122. The source index and module scaffolds have been corrected/expanded accordingly. This is a page-index correction only: all six units and both review sections remain `needs_review`; OCR/extracted text is not academic approval.

The AI Studio-specific Primary 1 extraction files previously reported in chat (the P1 Unit 1 Python script, 300-DPI renders, and P1 manifest/review document) are not present in the current GitHub `main` tree. Do not count those local AI Studio artifacts as synchronized repository work.

## 4. Unresolved unit boundaries

The following 19 unit entries still have no verified start page:

- **Secondary 2 — English_language_2sec_t1 (1).pdf:** U1 Egypt–Africa Cooperation; U2 Startups & Young Entrepreneurs; U3 Sustainable Development Goals (SDG); U4 Natural Disasters; U5 Media Manipulation; U6 Soft Skills Vs. Hard Skills.
- **Baccalaureate Year 2 First Language Part 1 — Eng-L1-EB-Part1 (1).pdf:** U2 Leisure Time; U3 Echoes of the Past.
- **Baccalaureate Year 2 First Language Part 2 — Eng-L1-EB-Part2 (1).pdf:** U7 Discovering Your Passion; U8 Pathways to Progress.
- **Primary 3 — English_language_prim3_t1 (1).pdf:** U3 New Adventures.
- **Primary 6 — English_Primary6_T1 (1).pdf:** U4 Resources Around Us; U6 Wise Savers.
- **Preparatory 3 Hello Plus supplement — Hello plus prep 3 كامل(1).pdf:** U1 My World; U2 Changes; U3 Ambitions; U4 Traditional Stories; U5 News and Media; U6 Literature — The Prisoner of Zenda.

Five otherwise-started units cannot be safely delimited because the next unit's start page is missing:

- Baccalaureate Year 2 First Language Part 1 — Unit 1 (next Unit 2 start missing).
- Baccalaureate Year 2 First Language Part 2 — Unit 6 (next Unit 7 start missing).
- Primary 3 — Unit 2 (next Unit 3 start missing).
- Primary 6 — Unit 3 (next Unit 4 start missing).
- Primary 6 — Unit 5 (next Unit 6 start missing).

Do not generate these 24 blocked/ambiguous units until the missing starts and boundaries are verified against the original PDFs.

Two commercial guides have no unit records yet: Connect Plus Primary 5 and Hello Plus Preparatory 2. The eight assessment PDFs and the Baccalaureate reader also have no unit/chapter records. They need separate book-level assessment-bank and reader/chapter indexing workflows; they must not silently disappear from the all-books scope.

## 5. Existing content and approval state

- `src/data/lessons/unit-modules.draft.json`: now 121 unit scaffolds × 9 modules = 1,089 module placeholders; all remain empty and `not_populated`.
- `src/data/lessons/lessons.draft.json`: 26 lesson records, 149 content items, all lesson records remain `needs_review`. No lesson is approved.
- Existing item distribution: vocabulary 92; vocabulary questions 4; grammar 3; grammar questions 1; reading 2; listening 2; speaking 1; phonics 14; exercises 30; games 0.
- `artifacts/unit-drafts/baccalaureate-y2-first-language-part1-unit-4.json` is an incomplete draft with one vocabulary item and no complete nine-module learning set. It is not a completed unit.
- The current progress JSON was written by an earlier run and still contains the old 118-unit inventory snapshot. The next batch run must rebuild per-unit states from the current source index; do not treat the stale count as current.

## 6. Application integration and runtime audit

The current application reads `src/data/lessons/lessons.draft.json` and `src/data/lessons/unit-modules.draft.json`. Its learner module renderer uses approved lesson records; the 26 unapproved lesson records therefore do not become learner-ready content. The generator writes unit JSON files under `artifacts/unit-drafts/`, but the app does not import that directory. There is no verified approval-to-app integration step yet.

The UI has nine unit module entry points, but empty scaffolds are placeholders, not functional curriculum. Current limitations observed in `src/main.js`:

- TTS uses the browser/WebView SpeechSynthesis API. Gender auto-detection relies on voice-name/URI text containing labels such as male/female; unknown platform voices require manual selection and preview. Voice preferences are in runtime state and are not persisted.
- No audio asset files (`mp3/wav/ogg/m4a/aac/flac`) are tracked in the repository.
- Listening can show a generated TTS script preview, explicitly not an original book recording.
- No real Android/WebView device playback test is evidenced by CI.
- The games renderer currently displays question-style game cards; there is no evidence of a complete set of varied game mechanics.
- The comprehensive-test view can display and mark individual MCQs with answer keys, but no full exam submission/scoring workflow was found.
- No active microphone capture path was found in the current `src/main.js`; simultaneous microphone/TTS contention has not been device-tested.

## 7. Batch pipeline and execution status

- `.github/workflows/generate-interactive-unit.yml` is configured for daily `06:00 UTC` (09:00 Asia/Riyadh) and uses resumable `AUTO_RESUME=true` batches of two units.
- The workflow's last main-branch update was after the 7 November 06:00 UTC schedule slot, so the next scheduled opportunity is **8 November 2026 at 09:00 Asia/Riyadh**.
- The batch generator now orders candidates Primary → Preparatory → Secondary → Baccalaureate, with official student books before same-grade commercial supplements. This preserves the previously agreed Primary-first sequence.
- The workflow persists progress/drafts after each unit and stops on quota, timeout, or validation failures. It does not rotate API keys to bypass quota exhaustion.
- Assessment PDFs and readers are tracked as book-level review items, not unit-generation candidates.

### GitHub Actions evidence

- Latest validation: [run #42352285170](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/42352285170) — success. All 13 validation/build steps completed, including LFS checkout, source index, review candidates, visual recoveries, lesson content, unit scaffolds, tests, syntax, Vite build, and artifact upload.
- Latest generation attempt: [run #42344993034](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/42344993034) — failure. It ran against an older commit and did not produce a complete approved unit. Its Unit 4 draft remains incomplete.
- Extraction source artifact: [run #42090067057](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/42090067057) — 33 processed PDFs and page-level text/manifest artifact.

## 8. Next work queue

1. Run the new Primary-first queue beginning with Primary 1 Unit 1, then Unit 2, and continue in order.
2. Complete all nine modules per unit only where the source supports them; keep supplementary content explicitly labelled.
3. Verify all 19 missing unit starts and five ambiguous boundaries from original PDF contents/opening pages.
4. Index the two commercial guides with no unit records.
5. Build a separate extraction and assessment-bank process for the eight assessment PDFs; index the Baccalaureate reader's chapters/sections.
6. Add a tested approval-to-app integration path that imports only teacher-approved content.
7. Test TTS, gender-matched voice assignment, listening playback, games, and complete exam scoring on actual Android/WebView devices.
8. Recover the missing LFS object for `Performance Tasks Prep 2-OnlineMaterials.PDF`, or request that PDF again if it cannot be restored.

**Release decision: NOT COMPLETE.** No unit is teacher-approved and no generated curriculum has been proven fully integrated and working in the learner application.
