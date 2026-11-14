# EngliMensh-Egypt — Repository Curriculum Inventory & Progress Audit

**Source extraction snapshot:** 13 November 2026, 06:58 UTC (latest reusable extraction artifact)  
**Latest generation snapshot:** 14 November 2026, 07:19 UTC (run 43570517411; next batch is still running)  
**Repository:** [mustafaelmenshawy23-jpg/EngliMensh-Egypt](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt)  
**Working branch:** `main` only. No other repository or product variant is part of this audit.

## 1. Repository inventory

| Measure | Verified count |
|---|---:|
| PDF entries indexed in the repository | 34 |
| PDF objects extracted successfully in the reusable Actions cache | 33 |
| PDF still represented by an unhydrated Git LFS pointer | 1 |
| Pages across the 33 extracted PDFs | 5,626 |
| OCR-processed pages | 5,626 |
| Pages with usable OCR text | 3,906 |
| OCR pages flagged unreliable | 132 |
| OCR pages with no usable text | 73 |
| OCR execution errors | 0 |
| Pages in the visual-review queue | 205 |
| Indexed books/documents | 34 |
| Student books | 15 |
| Commercial supplements | 9 |
| Assessment books | 9 |
| Readers | 1 |
| Unit records indexed | 125 |
| Books with unit boundaries | 23 |
| Documents without unit boundaries | 11 |

The current 205-page visual-review queue is the actionable set (132 OCR-unreliable + 73 OCR-empty pages). All OCR output remains `needs_review`; OCR extraction is not academic approval. The 288-page Hello Plus Prep 2 supplement currently contains repeated `t.me/G5_Y5` watermark text rather than usable curriculum text. The next cache-v3 generation run is configured to detect those watermark-only pages, re-hydrate that original PDF, and retry OCR.

**Unhydrated source:** `public/books/Performance Tasks Prep 2-OnlineMaterials.PDF`. Its LFS object was not available to the extraction job, so it remains explicitly blocked; the original pointer file was not modified.

## 2. Unit distribution

| Stage | Indexed units |
|---|---:|
| Primary (student books + Connect Plus supplements) | 64 |
| Preparatory (student books + Hello Plus supplements) | 30 |
| Secondary | 18 |
| Egyptian Baccalaureate | 13 |
| **Total** | **125** |

The 125 unit records span 23 books: 15 student books and 8 of the 9 commercial supplements. Eleven indexed documents do not currently have unit boundaries: nine assessment books, one reader, and one supplementary Prep 2 document. These must be handled as book/term assessment or reader content rather than by inventing unit numbers.

## 3. Latest generation snapshot

The last persisted batch snapshot (14 November 2026, 07:19 UTC) reports:

| Generation status | Units |
|---|---:|
| Structurally valid drafts with all nine sections (`needs_review`) | 52 |
| Blocked by source-quality review | 53 |
| Failed / awaiting retry | 20 |
| Approved and published | 0 |

Section coverage across the 52 draft units: vocabulary 288 items; vocabulary questions 160; grammar 84; grammar questions 159; reading 115; listening 109; speaking 52; games 107; comprehensive tests 520 questions. These are validated draft counts, not published content. The per-book/per-unit status source is [`artifacts/unit-drafts/progress.json`](../artifacts/unit-drafts/progress.json). Run 43570679945 is still processing the next ten eligible/retry candidates; no result from that run is included in these persisted counts.

## 4. All indexed PDFs and unit map

Unit start pages below are the indexed PDF page numbers. A unit end page is derived from the next verified unit start page minus one, or from the extracted PDF page count for the final unit. Documents with no unit records remain listed; they are not silently omitted. **The detailed status labels in the table are the 13 November 06:24 UTC inventory snapshot; use the live `progress.json` link above for the latest per-unit status.**

| Grade/stage | Document type | Original PDF filename | Units | Current unit status | Unit inventory |
|---|---|---|---:|---|---|
| Preparatory 1 | Student book | `English_Prep1_T1 (1).pdf` | 6 | Generation/API failed: 5; Blocked — source review: 1 | U1 Life in a Digital World (PDF p.13; Generation/API failed)<br>U2 Learning to Learn (PDF p.27; Generation/API failed)<br>U3 Role Models (PDF p.41; Generation/API failed)<br>U4 Smart Choices (PDF p.59; Blocked — source review)<br>U5 Future Dreams (PDF p.73; Generation/API failed)<br>U6 Global Citizens (PDF p.87; Generation/API failed) |
| Preparatory 2 | Student book | `English_language_prep2_t1 (1).pdf` | 6 | Generation/API failed: 4; Blocked — source review: 1; Draft — teacher review: 1 | U1 Gen Alpha (PDF p.13; Generation/API failed)<br>U2 My Digital Footprint (PDF p.27; Generation/API failed)<br>U3 Facing Challenges (PDF p.41; Generation/API failed)<br>U4 Expression (PDF p.58; Blocked — source review)<br>U5 Around the World (PDF p.72; Generation/API failed)<br>U6 Young Innovators (PDF p.87; Draft — teacher review) |
| Preparatory 3 | Student book | `English_language_prep3_t1 (1).pdf` | 6 | Blocked — source review: 2; Failed validation: 1; Draft — teacher review: 3 | U1 Personal Identity (PDF p.13; Blocked — source review)<br>U2 Communication with Family and Friends (PDF p.27; Failed validation)<br>U3 Artificial Intelligence (PDF p.41; Draft — teacher review)<br>U4 Screen Time (PDF p.59; Draft — teacher review)<br>U5 Design Thinking (PDF p.72; Draft — teacher review)<br>U6 Why Do We Like Stories? (PDF p.85; Blocked — source review) |
| Secondary 1 | Student book | `English_1sec_t1 (1).pdf` | 6 | Draft — teacher review: 5; Blocked — source review: 1 | U1 Egypt’s Heritage (PDF p.11; Draft — teacher review)<br>U2 Hands Help, Hearts Care (PDF p.24; Draft — teacher review)<br>U3 Truth Vs. Lies (PDF p.36; Draft — teacher review)<br>U4 Save and Shine (PDF p.57; Draft — teacher review)<br>U5 Using Technology at Schools (PDF p.69; Draft — teacher review)<br>U6 Job Hunting (PDF p.80; Blocked — source review) |
| Secondary 2 | Student book | `English_language_2sec_t1 (1).pdf` | 6 | Draft — teacher review: 3; Failed validation: 1; Blocked — source review: 2 | U1 Egypt–Africa Cooperation (PDF p.6; Draft — teacher review)<br>U2 Startups & Young Entrepreneurs (PDF p.18; Draft — teacher review)<br>U3 Sustainable Development Goals (SDG) (PDF p.30; Failed validation)<br>U4 Natural Disasters (PDF p.48; Blocked — source review)<br>U5 Media Manipulation (PDF p.60; Draft — teacher review)<br>U6 Soft Skills Vs. Hard Skills (PDF p.72; Blocked — source review) |
| Secondary 3 | Student book | `English_language_Sec3_tr1 (1).pdf` | 6 | Draft — teacher review: 5; Blocked — source review: 1 | U1 Inside the World of Care (PDF p.12; Draft — teacher review)<br>U2 The Power of Machines (PDF p.24; Draft — teacher review)<br>U3 Protect Nature, Protect Future (PDF p.36; Draft — teacher review)<br>U4 Marine Life (PDF p.55; Draft — teacher review)<br>U5 From Muscles to Mindset (PDF p.68; Draft — teacher review)<br>U6 Let’s Hang Out! (PDF p.82; Blocked — source review) |
| Baccalaureate Year 2 | Student book | `Eng-L1-EB-Part1 (1).pdf` | 5 | Blocked — source review: 2; Draft — teacher review: 3 | U1 Living Well in a Complex World (PDF p.12; Blocked — source review)<br>U2 Leisure Time (PDF p.39; Draft — teacher review)<br>U3 Echoes of the Past (PDF p.74; Draft — teacher review)<br>U4 The Power of Choice (PDF p.102; Draft — teacher review)<br>U5 The Greenhouse Effect (PDF p.140; Blocked — source review) |
| Baccalaureate Year 2 | Student book | `Eng-L1-EB-Part2 (1).pdf` | 5 | Blocked — source review: 3; Draft — teacher review: 1; Failed validation: 1 | U6 A World for All (PDF p.6; Blocked — source review)<br>U7 Discovering Your Passion (PDF p.40; Draft — teacher review)<br>U8 Pathways to Progress (PDF p.67; Blocked — source review)<br>U9 Circles of Belonging (PDF p.101; Failed validation)<br>U10 Behind the Buy (PDF p.126; Blocked — source review) |
| Primary 1 | Commercial supplement | `المعاصر_كونكت_بلس_1_ابتدائي_ترم_1_ذاكرولي1.pdf` | 6 | Draft — teacher review: 4; Generation/API failed: 1; Blocked — source review: 1 | U1 This is me (PDF p.10; Draft — teacher review)<br>U2 Meet my family (PDF p.43; Draft — teacher review)<br>U3 In my community (PDF p.70; Generation/API failed)<br>U4 On the farm (PDF p.109; Draft — teacher review)<br>U5 Transportation (PDF p.146; Draft — teacher review)<br>U6 The world around us (PDF p.179; Blocked — source review) |
| Primary 2 | Commercial supplement | `المعاصر_كونكت_بلس_2_ابتدائي_ترم_1_ذاكرولي.pdf` | 6 | Draft — teacher review: 3; Failed validation: 1; Blocked — source review: 2 | U1 Ready, get set, go! (PDF p.11; Draft — teacher review)<br>U2 Let’s get fit! (PDF p.56; Draft — teacher review)<br>U3 A day in my life (PDF p.87; Draft — teacher review)<br>U4 Into space (PDF p.128; Failed validation)<br>U5 A boat trip (PDF p.158; Blocked — source review)<br>U6 Monuments (PDF p.207; Blocked — source review) |
| Primary 3 | Commercial supplement | `المعاصر_كونكت_بلس_3_ابتدائي_ترم_1_ذاكرولي.pdf` | 6 | Blocked — source review: 6 | U1 At the track (PDF p.12; Blocked — source review)<br>U2 Body matters (PDF p.58; Blocked — source review)<br>U3 What’s on your plate? (PDF p.90; Blocked — source review)<br>U4 In the wild (PDF p.129; Blocked — source review)<br>U5 All about water (PDF p.167; Blocked — source review)<br>U6 What is a flood? (PDF p.204; Blocked — source review) |
| Primary 4 | Commercial supplement | `المعاصر_كونكت_بلس_4_ابتدائي_ترم_1_ذاكرولي.pdf` | 6 | Generation/API failed: 2; Failed validation: 3; Blocked — source review: 1 | U1 What do I do? (PDF p.15; Generation/API failed)<br>U2 Plants and animals (PDF p.49; Failed validation)<br>U3 My world (PDF p.85; Failed validation)<br>U4 City and country (PDF p.124; Failed validation)<br>U5 Resources in our world (PDF p.166; Generation/API failed)<br>U6 Let’s work (PDF p.190; Blocked — source review) |
| Primary 5 | Commercial supplement | `المعاصر_كونكت_بلس_5_ابتدائي_ترم_1_ذاكرولي.pdf` | 4 | Failed validation: 1; Blocked — source review: 2; Generation/API failed: 1 | U1 Life in my world (PDF p.8; Failed validation)<br>U2 Look around you (PDF p.46; Blocked — source review)<br>U3 How we use our world (PDF p.89; Generation/API failed)<br>U4 We're on the move (PDF p.130; Blocked — source review) |
| Primary 6 | Commercial supplement | `المعاصر_كونكت_بلس_6_ابتدائي_ترم_1_ذاكرولي.pdf` | 4 | Failed validation: 2; Generation/API failed: 1; Blocked — source review: 1 | U1 Express yourself! (PDF p.13; Failed validation)<br>U2 Home is where the heart is (PDF p.50; Generation/API failed)<br>U3 School time! (PDF p.93; Failed validation)<br>U4 We can make a difference! (PDF p.132; Blocked — source review) |
| Preparatory 1 | Commercial supplement | `المعاصر_هالو_بلس_1_اعدادي_ترم_1_ذاكرولي.pdf` | 6 | Blocked — source review: 5; Generation/API failed: 1 | U1 Friends matter (PDF p.8; Blocked — source review)<br>U2 The world of work (PDF p.48; Blocked — source review)<br>U3 Activities (PDF p.91; Blocked — source review)<br>U4 Shopping well (PDF p.160; Blocked — source review)<br>U5 Feeling well (PDF p.196; Generation/API failed)<br>U6 Literature: The Prince and the Pauper — Part A (PDF p.251; Blocked — source review) |
| Primary 1 | Student book | `English_language_prim1_t1.pdf` | 6 | Failed validation: 1; Draft — teacher review: 5 | U1 Welcome to My School (PDF p.7; Failed validation)<br>U2 The Garden of Colors and Shapes (PDF p.25; Draft — teacher review)<br>U3 I Love My Family (PDF p.42; Draft — teacher review)<br>U4 My Body and My Senses (PDF p.65; Draft — teacher review)<br>U5 On the Farm (PDF p.84; Draft — teacher review)<br>U6 Animals Around Me (PDF p.103; Draft — teacher review) |
| Primary 2 | Student book | `English_language_prim2_t1 (1).pdf` | 4 | Draft — teacher review: 2; Blocked — source review: 2 | U1 Let’s Get Started! (PDF p.7; Draft — teacher review)<br>U2 Colors, Shapes, and Numbers 1–20 (PDF p.19; Draft — teacher review)<br>U3 Classroom Actions & Routines (PDF p.31; Blocked — source review)<br>U4 Everyday Life (PDF p.51; Blocked — source review) |
| Primary 3 | Student book | `English_language_prim3_t1 (1).pdf` | 4 | Blocked — source review: 3; Generation/API failed: 1 | U1 Let’s Learn Together! (PDF p.13; Blocked — source review)<br>U2 My Family (PDF p.29; Blocked — source review)<br>U3 New Adventures (PDF p.43; Generation/API failed)<br>U4 Let’s Tell Stories! (PDF p.71; Blocked — source review) |
| Primary 4 | Student book | `English_language_prim4_t1 (1).pdf` | 6 | Failed validation: 3; Generation/API failed: 2; Blocked — source review: 1 | U1 The Five Senses (PDF p.8; Failed validation)<br>U2 My Community (PDF p.24; Generation/API failed)<br>U3 Animals in Our World (PDF p.40; Failed validation)<br>U4 Egypt – My Homeland (PDF p.62; Failed validation)<br>U5 A Day at Work (PDF p.80; Blocked — source review)<br>U6 The Hundred Dresses (PDF p.96; Generation/API failed) |
| Primary 5 | Student book | `English_language_prim5_t1 (1).pdf` | 6 | Blocked — source review: 6 | U1 Food, Nature, and Culture (PDF p.8; Blocked — source review)<br>U2 My Healthy Body (PDF p.26; Blocked — source review)<br>U3 When Nature Changes (PDF p.41; Blocked — source review)<br>U4 My Community (PDF p.61; Blocked — source review)<br>U5 Our World, Our Resources (PDF p.77; Blocked — source review)<br>U6 The Talking Earth (PDF p.92; Blocked — source review) |
| Primary 6 | Student book | `English_Primary6_T1 (1).pdf` | 6 | Blocked — source review: 4; Generation/API failed: 1; Failed validation: 1 | U1 Amazing Places in Egypt (PDF p.7; Blocked — source review)<br>U2 How’s the Weather in Your City? (PDF p.24; Blocked — source review)<br>U3 Jobs that Help the Community (PDF p.37; Generation/API failed)<br>U4 Resources Around Us (PDF p.54; Failed validation)<br>U5 Made in Egypt (PDF p.70; Blocked — source review)<br>U6 Wise Savers (PDF p.85; Blocked — source review) |
| Baccalaureate Year 2 | Student book | `Eng-L2-EB-Part1 (1).pdf` | 3 | Blocked — source review: 3 | U1 People & Friends (PDF p.6; Blocked — source review)<br>U2 Places & Directions in My Town (PDF p.40; Blocked — source review)<br>U3 Daily Routine & Technology Use (PDF p.64; Blocked — source review) |
| Baccalaureate Year 1 | Reader | `Story-En-EB-L1 (1).pdf` | 0 | No unit records | — |
| Primary 1 | Assessment | `English_prim1_t1_Assmt (1).pdf` | 0 | No unit records | — |
| Primary 2 | Assessment | `English_prim2_t1_Assmt (1).pdf` | 0 | No unit records | — |
| Primary 3 | Assessment | `كتاب تقييمات الصف الثالث 2026.pdf` | 0 | No unit records | — |
| Primary 4 | Assessment | `English_prim4_t1_Assmt (1).pdf` | 0 | No unit records | — |
| Primary 5 | Assessment | `English_prim5_t1_Assmt (1).pdf` | 0 | No unit records | — |
| Primary 6 | Assessment | `English_prim6_t1_Assmt (1).pdf` | 0 | No unit records | — |
| Preparatory 1 | Assessment | `English 1prep-1تقييمات اولى عYasser Salah .pdf` | 0 | No unit records | — |
| Preparatory 3 | Assessment | `كتاب_تقيمات_الصف_الثالث_الاعدادي_2026.pdf` | 0 | No unit records | — |
| Preparatory 2 | Commercial supplement | `المعاصر_هالو_بلس_تانية_إعدادي_كتاب_الشرح_1.pdf` | 0 | No unit records | — |
| Preparatory 3 | Commercial supplement | `Hello plus prep 3 كامل(1).pdf` | 6 | Blocked — source review: 6 | U1 My World (PDF p.3; Blocked — source review)<br>U2 Changes (PDF p.66; Blocked — source review)<br>U3 Ambitions (PDF p.106; Blocked — source review)<br>U4 Traditional Stories (PDF p.157; Blocked — source review)<br>U5 News and Media (PDF p.205; Blocked — source review)<br>U6 Literature — The Prisoner of Zenda (PDF p.254; Blocked — source review) |
| Preparatory 2 | Assessment | `Performance Tasks Prep 2-OnlineMaterials.PDF` | 0 | No unit records | — |

## 5. Historical interactive-unit draft coverage (before run 43379629520)

The saved batch state contained 125 candidate unit records:

| Status | Units |
|---|---:|
| Complete draft awaiting teacher review | 26 |
| Newly generated draft awaiting teacher review | 9 |
| Blocked by source-quality gate | 56 |
| Generation/API failures | 19 |
| Failed content validation | 15 |
| **Total** | **125** |

Thus, 35/125 units (28%) had a nine-section draft at this snapshot. These are drafts only; none is approved for student delivery.

### Section coverage across those 35 drafts

| Section | Units with items | Items |
|---|---:|---:|
| Vocabulary | 35 | 197 |
| Vocabulary questions | 35 | 105 |
| Grammar | 35 | 55 |
| Grammar questions | 35 | 105 |
| Reading (passages/dialogues and questions) | 35 | 73 |
| Listening (scripts and questions) | 35 | 72 |
| Speaking | 35 | 35 |
| Games | 35 | 71 |
| Comprehensive unit tests | 35 | 350 |

The section counts prove structural coverage only. They do not prove that every OCR transcription is visually correct, every reading passage is complete, every answer is pedagogically correct, or every generated activity has been teacher-approved.

## 6. Source/provenance safeguards

- Source text is marked `origin=source` only when it is present in the extracted PDF text; newly written explanations, questions, scripts, role-plays, and games are marked `origin=supplementary`.
- Listening scripts without a printed transcript are supplementary, not represented as original recordings or textbook transcripts.
- Every generated item carries a PDF page reference; the approval process recomputes the source fingerprint and checks the source range.
- Original PDFs are not edited or deleted.
- The app imports only JSON files from `src/data/approved-unit-drafts/` that have approved status, a named reviewer, a timestamp, a matching source fingerprint, and explicit visual-review confirmation. The 35 generated drafts are not bundled into the student app until this review process is completed.

## 7. TTS, speaking, and microphone audit

Current implementation findings:

- Native Android voice discovery calls `TextToSpeech.getSupportedVoices()`; browser mode uses `speechSynthesis.getVoices()`.
- Male/female classification currently relies on voice names/URIs containing explicit gender labels. A neutral voice name is correctly classified as unknown; the app does not prove gender from a voice's sound.
- Users can select separate male/female voices when the platform exposes a matching voice. If none is exposed, the UI warns that the system default may be used and gender matching is unverified.
- `playDialogue()` uses each turn's `speakerGender`; many saved turns are currently `unknown`, so those turns do not receive a gender-matched voice.
- Listening scripts currently render as one text string and do not consistently carry per-speaker voice metadata.
- Speaking practice calls `stopAudio()` before microphone recognition. This verifies the intended code path, not actual device behavior.

**Not yet verified:** no physical Android device test has been performed in this audit. The actual voices exposed by the user's installed TTS engine, their audible gender, voice switching, and microphone/TTS interaction must be tested on-device. A successful JavaScript test or APK build is not proof of audible voice matching.

## 8. Current run and reproducible evidence

- [All-book extraction run 43382237895](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/43382237895) — successful; [artifact 14018499295](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/43382237895/artifacts/14018499295) contains the extracted page records and manifest for 33 of 34 PDFs (5,626 pages). One LFS pointer remains blocked.
- [Completed generation batch 43570517411](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/43570517411) — successful; [artifact 14105055036](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/43570517411/artifacts/14105055036) contains the latest persisted draft set, batch state, and progress report. It added nine structurally valid unit drafts; one selected unit failed validation and remains retryable.
- [Current generation batch 43570679945](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/43570679945) — still in progress at the time of this snapshot. It successfully downloaded the latest extraction artifact and is processing the next ten eligible/retry candidates; no result is counted until its persistence step completes.
- [Next generation batch 43572032428](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/43572032428) — queued behind the current batch. It uses the updated cache-v3 workflow and will repair watermark-only pages before using the reusable cache.
- [Validation run 43572178834](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/43572178834) — successful after the TTS/microphone exclusion change.
- [Android preview build 43572178840](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/43572178840) — successful; [artifact 14104697638](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/43572178840/artifacts/14104697638) contains the 7.25 MB debug APK.
- [Cache-v3 source extraction fix](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/commit/b842342661ed322222df24e71c69a790c1553f32) — avoids overwriting a repaired cache with an older extraction artifact and triggers watermark repair on cache migration.
- [TTS/microphone exclusion fix](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/commit/216b3008ff38f6a7f1bd9b0b1794fa98c771ba5f) and [its regression test](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/commit/910941c2101823cf6a3cdad115a31261087a3bdf) — TTS will not start while speech recognition is active; the lock is released on success or error.

The repository default branch remains `feature/primary-connect-connect-plus-2026-2027`; the active work and all edits in this audit are on `main` only. The workflow's automatic dispatch guard therefore remains disabled. A next batch is queued, but further chained batches still need a trigger commit or the repository default branch must be changed to `main` in GitHub settings.

## 9. Remaining work

1. Finish the current generation batch and the queued cache-v3 batch; retry the 20 failed/validation candidates recorded in the last persisted snapshot. Do not count in-progress work as complete.
2. Resolve the 53 units blocked by source-quality review. The current extracted artifact identifies 205 pages needing visual review (132 unreliable OCR pages and 73 empty pages); the Hello Plus Prep 2 supplement has 288 watermark-only pages queued for the cache-v3 OCR repair.
3. Recover the Git LFS object for `Performance Tasks Prep 2-OnlineMaterials.PDF`; it is the only PDF not extracted.
4. Build separate book/term assessment packages for the nine assessment PDFs, process the reader's ten indexed chapters, and recover verified unit boundaries for the Hello Plus Prep 2 supplement. Do not invent unit numbers or boundaries.
5. Review the 52 structurally valid unit drafts against their exact PDF pages. All remain `needs_review`; zero are approved or published. The learner app imports only explicitly approved drafts.
6. Resolve speaker-gender metadata only where the source supports it, and test the actual male/female voices exposed by a real Android device. The app now prevents TTS and microphone recognition from running together, but actual device voice availability has not been verified.
7. Verify every approved section in the running app, including navigation, search, persistence, dialogue replay, games, answer feedback, and comprehensive tests.

**Completion is not declared.** The latest persisted snapshot is partial; the current batch is still running, the next batch is queued, and assessment/reader content plus source-review blockers remain. The app is not complete until reviewed content is approved and verified working in the learner application.
