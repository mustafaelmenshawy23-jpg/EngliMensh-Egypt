# Pass 7 — Direct source-page review of manual recovery candidates

- Workflow run: [42230988574](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/42230988574) — **success**.
- Artifact: `englimensh-manual-recovery-candidates-300dpi` (8 source-page images, 300 DPI; 19,914,671 bytes).
- Visually inspected: 8/8 original source pages from 5 PDFs.
- The original PDFs were hydrated from Git LFS and rendered directly; no PDF source file or machine OCR was changed.
- All transcriptions remain candidates, all records remain `needs_review`, and no answer keys were created.

## Page-by-page findings

1. **Primary 2 — physical PDF p32** (`English_language_prim2_t1 (1).pdf`): The page visibly reads “Lesson 1 — Classroom Actions” and “Listen, repeat, and practice”. The eight labels are read, write, clean, draw, sit, stand, play, and color. No unit number is printed; the Unit 3 link remains a proposal based on the matching indexed title “Classroom Actions & Routines”.
2. **Primary 3 — physical PDF p45** (`English_language_prim3_t1 (1).pdf`): The page has an explicit **UNIT 3** heading. The top reference images are labelled 5 “train station” and 6 “museum”. The lower picture set includes a library (with a preprinted 2), a supermarket aisle, a museum, park benches, a train station, and a house. The remaining listening-number answers cannot be derived from this page alone.
3. **Primary 3 — physical PDF p69** (`English_language_prim3_t1 (1).pdf`): The page has an explicit **UNIT 4** heading, not Unit 3. The visible vocabulary is shy, tired, bored, and scared; the dialogue reads “How do you feel?” / “I feel so happy!” and the follow-up asks “How do you feel when you play with your friends?”. The earlier proposed Unit 3 link has been corrected to a proposed Unit 4 link.
4. **Primary 1 assessment — physical PDF p42** (`English_prim1_t1_Assmt (1).pdf`): The page is “Weekly Assessment (C)”, with “A. Unscramble and write” and “B. Reorder the words to make sentences”. The printed strings are exactly `ocrart`, `mlsle`, and `kace`; the associated pictures do not provide a reliable answer mapping. Preserve the strings and do not invent answers. It remains unassigned to a unit.
5. **Primary 6 — physical PDF p86** (`English_Primary6_T1 (1).pdf`): The page visibly carries a vertical **Unit 6** label and the heading “Vocabulary”. The labels are drip, overflow, puddle, leak, hallway, hose, tap, pipe, and drop. The Unit 6 link is directly supported by the printed label but remains pending academic approval of the transcription.
6. **Connect Plus Primary 1 supplement — physical PDF p42** (`المعاصر_كونكت_بلس_1_ابتدائي_ترم_1_ذاكرولي1.pdf`): “Writing corner” page with the labels grandpa, grandma, dad, mom, brother, sister, baby, tall, and family. The printed page number is 47. It precedes the indexed Unit 2 opener at physical PDF p43; keep it unassigned until adjacent-page context establishes its scope.
7. **Connect Plus Primary 1 supplement — physical PDF p86** (same source PDF): “Lesson 8 — Learn phonics with Busy Bee!” shows OW, OA, and O-E patterns with printed sound /əʊ/ and examples throw/yellow, boat/coat, and rope/nose. No unit number is printed on this page. Unit 3 remains a proposal because the same patterns appear in the Unit 3 column of the shared reference chart at p270; adjacent-page context is still needed.
8. **Connect Plus Primary 1 supplement — physical PDF p270** (same source PDF): “II — Phonics” chart is visibly organized into six columns, Unit 1 through Unit 6. This is a shared cross-unit reference, not a single-unit lesson.

## Changes made

- Corrected `pass7-prim3-p69` from proposed Unit 3 to proposed Unit 4 because the original page visibly prints “UNIT 4”.
- Strengthened the evidence notes for the pages whose unit labels or content could be read directly from the 300-DPI originals.
- Kept ambiguous pages unassigned or pending. No candidate was promoted into runtime curriculum or question-bank content.

## Academic release gate

These are source-page checks, not final academic approval. Before generating questions, a subject editor must separately review spelling, grammar, task intent, and any answer key against the original page and its surrounding lesson context. In particular, do not infer the listening answers on Primary 3 p45 or unscramble answers on the Primary 1 assessment p42.


## Pass 9 — Adjacent-page context review (240 DPI)

- Context-render workflow: [42232027066](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/42232027066) — **success**.
- Context artifact: `englimensh-manual-recovery-context-240dpi` (24 rendered pages: each of 8 candidates plus one physical page before and after; 5 source PDFs; 72,676,640 bytes).
- Visually inspected all 24 contextual page images in four contact sheets. Original PDFs were rendered from hydrated Git LFS sources; no PDF or LFS pointer was changed.

### Context-confirmed unit links

1. **Primary 2 p32 → Unit 3:** p31 is the Unit 3 cover “Classroom Actions & Routines”; p32 is Lesson 1 “Classroom Actions”; p33 continues with an explicit UNIT 3 heading.
2. **Primary 3 p45 → Unit 3:** p45 explicitly prints UNIT 3; p44 and p46 are Lesson 1 “Places Around Me” pages. The audio numbering remains unresolved except for the preprinted 2.
3. **Primary 3 p69 → Unit 4:** p69 explicitly prints UNIT 4; p68 starts Lesson 1 “How We Feel” and p70 continues the same lesson.
4. **Primary 6 p86 → Unit 6:** p85 is the Unit 6 cover “The Water Savers”; p86 has the vertical Unit 6 label and Vocabulary; p87 continues with definitions and story characters.
5. **Connect Plus Primary 1 p42 → Unit 2:** p41 is a Language reference page explicitly labelled Theme 1 Unit Two and introduces family language; p42 is the family Writing Corner; p43 contains activities on Lessons 1, 2, and 3.
6. **Connect Plus Primary 1 p86 → Unit 3:** p85 is a continuation activity on Lessons 1–7; p86 is Lesson 8 phonics (OW, OA, O-E); p87 contains Activities on Lesson 8. The same patterns appear in the Unit 3 column of the shared chart at p270.

### Still unassigned / unresolved

- **Primary 1 assessment p42:** p40, p41, and p42 are Weekly Assessments (A), (B), and (C); p43 begins Unit 5 “On the Farm”. This is a standalone assessment sequence, not a unit lesson. The scrambled strings and answer mapping remain unresolved; do not infer answers from the pictures.
- **Connect Plus Primary 1 p270:** remains a shared cross-unit phonics reference for Units 1–6, not a single-unit lesson.

### Repository data update

- Updated `src/data/extracted/manual-recovery-candidates.json` to mark the six context-supported unit links as `context_confirmed_pending_academic_review` and document the adjacent-page evidence.
- Kept every transcription as a candidate and every record outside the runtime question bank. No answer keys were added, and no questions were generated.
- The assessment remains unassigned; the phonics chart remains cross-unit.

### Validation gate

The adjacent-page evidence confirms placement, not final academic correctness. Vocabulary, spelling, IPA, task wording, grammar, and answer keys still require subject-editor approval before any candidate is promoted into lessons or question banks.
