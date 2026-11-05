# Pass 12 — visual review of short/fragmentary OCR pages

## Scope and method

- Workflow run: [42122614604](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/42122614604)
- Artifact: `englimensh-pass11-short-ocr-240dpi`
- Source images: 20 pages rendered from hydrated Git LFS source PDFs at 240 DPI.
- Coverage: 5 source books; all 20 Pass 11 short/fragmentary OCR candidates.
- Page references below use the 1-based physical PDF page. Printed page numbers are recorded separately only when visible on the page.

## Review outcome

The 20 rendered pages were visually reviewed. Their visible instructional text, labels, vocabulary, sentence frames, and page structures have been captured in `src/data/extracted/visual-recoveries-pass12.jsonl`.

- 20 candidate records created; 20 unique IDs.
- 20/20 retain `transcriptionStatus: candidate` and `reviewStatus: needs_review`.
- No machine OCR record in `pages.jsonl` was overwritten.
- No answer key, missing response, or audio-dependent mapping was inferred.
- Picture prompts are described as visual cues where no printed label exists.
- Ambiguous assessment strings are retained literally rather than silently corrected.

## Source coverage

### Official Primary 1 student book — `English_language_prim1_t1.pdf`

| PDF page | Printed page | Visually recovered content |
|---:|---:|---|
| 13 | 13 | Unit 1, Lesson 2 Phonics; Tt tracing/matching; printed word “teacher”; picture prompts. |
| 30 | 30 | Unit 2, Lesson 2 Phonics; “spider, sun, spoon, snake, star”; Ss tracing. |
| 69 | 69 | Unit 4, Lesson 1 Head to Toe; “Draw the missing parts of the face”; illustrated facial-feature pieces, no printed labels. |
| 78 | 78 | Unit 4, Lesson 3 My 5 senses; two picture-based tasks with sense icons. |
| 82 | 82 | Unit 4, Lesson 4 Phonics; Kk tracing; printed word “kite”; picture prompts. |
| 99 | 99 | Unit 5, Lesson 4 Phonics; Oo tracing; “octopus”; picture prompts. |
| 102 | 102 | Unit 5, Lesson 4 Phonics; Ff/Oo picture tracing and printed words “on, ostrich, fork, fan, ostrich, frog”. |
| 108 | 108 | Unit 6, Lesson 2 Phonics; Bb tracing; “bird, boy, ball, banana, bike”. |

### Official Primary 2 student book — `English_language_prim2_t1 (1).pdf`

| PDF page | Printed page | Visually recovered content |
|---:|---:|---|
| 9 | 9 | Unit 1; “cat, hat, cap, map, man, fan”; minimal-pair choices “cat/cut, hot/hat, fin/fan, cap/cop, man/men, mop/map”. |
| 15 | 15 | Unit 1; “Draw and label 4 objects you see in your classroom”; four blank response boxes. |
| 90 | 90 | Lesson 4 “I Can Read and Write About My Home!”; “kitchen, living room, bedroom, bathroom, dining room, garden, hall, balcony”. |

### Official Primary 3 student book — `English_language_prim3_t1 (1).pdf`

| PDF page | Printed page | Visually recovered content |
|---:|---:|---|
| 21 | 21 | Unit 1 Daily Routines; “wake up, eat breakfast, do homework, watch TV, sleep, go to school, read, play”. |
| 41 | 41 | Unit 2 jobs; “doctor, teacher, baker, farmer, pilot”; sentence frames “I am a … / She is a … / He is a …”. |
| 44 | 44 | Lesson 1 Places Around Me; “house, library, supermarket, park”. |

### Official Primary 4 student book — `English_language_prim4_t1 (1).pdf`

| PDF page | Printed page | Visually recovered content |
|---:|---:|---|
| 76 | 76 | Unit 4 writing/project planner; self-assessment “Rate your work”, criteria “I used a main heading and sub-headings” and “I added pictures and details”. Main planning areas are intentionally blank. |

### Official Primary 1 assessment book — `English_prim1_t1_Assmt (1).pdf`

| PDF page | Printed page | Visually recovered content |
|---:|---:|---|
| 10 | 9 | Weekly Assessments A and B; exact scrambled strings and picture prompts retained. |
| 15 | 14 | Unit 2 Weekly Assessment C; flower/bird/tree scrambled words and two sentence frames. One first string has a visible spacing/print artifact and remains literal. |
| 19 | 18 | Unit 2 Weekly Assessment C; axe/apple/triangle scrambled strings and shape sentence frames. |
| 35 | 34 | Unit 4 My Body and My Senses; homework “Look and write” with five body-part pictures. |
| 50 | 49 | Weekly Assessment C; ostrich/fork/fan scrambled strings and two picture-supported sentence frames. |

## Important handling rules

1. These records are supplemental visual candidates, not approved curriculum content.
2. Keep the original machine extraction unchanged.
3. Do not turn picture descriptions into printed vocabulary or answer keys.
4. Preserve uncertain strings exactly as seen; resolve them only against a clearer source or academic review.
5. The postponed `Performance Tasks Prep 2-OnlineMaterials.PDF` remains outside this pass.

## Validation

The JSONL was checked for unique IDs, source-path consistency, positive 1-based PDF page numbers, and review status. All records remain pending academic review.
