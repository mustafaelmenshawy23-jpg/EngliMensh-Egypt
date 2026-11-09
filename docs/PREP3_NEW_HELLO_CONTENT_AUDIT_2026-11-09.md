# Prep 3 New Hello — content audit
Date: 9 November 2026
Branch: `content-import/prep-new-hello-hello-plus`

## Scope
Source: `content-imports/preparatory/new-hello/Prep_3_New_Hello_Units_1_to_6_Full_Curriculum.html`.
The file contains all six units in one interactive HTML curriculum.

## Findings requiring remediation
- Units 3–6 call `generateUnitVocab`, which currently assigns generic Arabic labels, generic definitions, and the same unrelated classroom example to each vocabulary item. The target word lists exist (25 per unit), but the learning cards are not yet genuine vocabulary teaching cards.
- Units 3–6 call `generateQuiz`, which currently returns generic placeholder questions and placeholder answer options. These are not valid student assessments.
- The same generic quiz generator is used for unit 3–6 vocabulary, grammar, and exam banks.
- Units 1 and 2 contain a small fixed question bank expanded by cycling through it to reach 30 questions. The resulting bank repeats question stems and is not a 30-question unique assessment.
- The shared `generateReading` and `generateListening` functions return generic filler passages/dialogues and placeholder comprehension options. These sections are not ready to be treated as completed curriculum.
- The source uses unsupported wording claiming official ministry standards/answers. This needs to be removed until source pages are available for verification.
- The source contains inline SVG illustrations rather than verified real-world vocabulary photos. It must not be reported as satisfying the real-photo requirement.

## Unit grammar headings present
1. Prepositions of time/place; present simple for timetables.
2. Distributives (both/either/neither/none); comparative and superlative.
3. Present continuous for future arrangements; be going to for intentions.
4. Present perfect with ever/never; past simple vs present perfect.
5. Present perfect with just/already/yet; ability (can/could/be able to).
6. Advice and obligation (should/shouldn't, must/mustn't); might for possibility.

## Status
This audit intentionally records blockers rather than marking this track complete. The content needs a genuine unit-by-unit replacement and automated validation before the preparatory curriculum can be called complete. Generated/supplementary content must remain clearly distinguished from verified textbook content.
