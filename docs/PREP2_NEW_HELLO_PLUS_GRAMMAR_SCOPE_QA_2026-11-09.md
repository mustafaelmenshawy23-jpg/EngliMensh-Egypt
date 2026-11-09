# Prep 2 New Hello Plus — grammar remediation and QA
Date: 9 November 2026
Branch: `content-import/prep-new-hello-hello-plus`

## Updated inspection
The six unit HTML files now contain separate `grammarQuizData` banks rather than the formerly shared 30-question bank.

| Unit | Recorded grammar focus | Current bank |
|---|---|---:|
| 1 | Past Continuous vs Past Simple | 12 MCQs |
| 2 | Modals of deduction and obligation | 12 MCQs |
| 3 | Used to vs Would (past habits and states) | 12 MCQs |
| 4 | Second Conditional | 12 MCQs |
| 5 | Gerunds vs Infinitives | 12 MCQs |
| 6 | Present and Past Passive Voice | 12 MCQs |

## Manual sample review
- Unit 1 distinguishes ongoing past actions from completed interrupting events, including while/when, negatives and questions.
- Unit 2 covers obligation, prohibition, lack of necessity, advice and degrees of deduction.
- Unit 3 distinguishes repeated past actions (would/used to) from past states, and includes negative and interrogative forms.
- Unit 4 tests both clauses of the Second Conditional, advice with “If I were you”, and negative forms.
- Unit 5 tests common verb patterns and gerunds after prepositions.
- Unit 6 tests present and past passive forms, agreement, and past participles.

## Additional content cleanup completed
- Replaced 30 placeholder distractors in each of the six unit files (180 total) with other vocabulary headwords from the same unit.
- Replaced generic, repeated reading passages with six original, unit-themed supplementary passages (two paragraphs each) and five MCQs per unit (30 reading MCQs total).
- Replaced generic listening scripts with six unit-themed dialogues (five turns each) and five MCQs per unit (30 listening MCQs total).
- All new reading/listening questions have four distinct options, numeric answer keys and Arabic explanations. A direct six-unit content check found zero malformed MCQs and zero remaining `incorrect_N` / generic distractor placeholders.
- These are supplementary learning materials with text-to-speech playback, not official textbook passages or native audio recordings.

## Automated quality controls
The validator `scripts/validate-prep2-plus-grammar.mjs` is included in `npm test`. It checks:
- six separate unit files and 12 questions in each bank;
- unique question stems within each unit;
- exactly four distinct options and numeric answer indices (0–3);
- Arabic explanations;
- no free-text answer properties;
- unit-specific grammar signals;
- matching “Grammar Quiz (12)” and “Score: 0 / 12” labels.

## Limitations / acceptance status
This confirms structural and topic-focused practice-bank remediation, not official textbook approval. The source book pages are not currently available in readable form for line-by-line verification, so the content remains a supplementary practice draft pending teacher/official-source review. This report does not certify the vocabulary, reading, listening, image, or full-unit content in these six files.


## Follow-up six-file verification — 9 November 2026
The six Prep 2 New Hello Plus source files were re-read from the active branch after the grammar remediation:
- Each unit has 12 grammar MCQs (72 total); all 12 stems are distinct within each unit.
- All grammar questions parsed as valid JSON and passed checks for a non-empty question, four distinct options, and a numeric correct-answer index from 0 to 3.
- Each unit has 25 vocabulary MCQ entries (150 total), and all 25 entries expose an options array.
- This verification confirms structure and answer-key shape; it does not prove official textbook alignment or validate every vocabulary distractor semantically. Teacher/source review remains required.
