# Prep 2 New Hello source QA — 9 November 2026

Branch: `content-import/prep-new-hello-hello-plus`

Scope: the six imported static HTML files in `content-imports/preparatory/new-hello/`. This is a source-quality audit, not an approval of the curriculum.

## Inventory verified

| Unit | Vocabulary cards | Question blocks | Expected blocks from headings |
|---|---:|---:|---:|
| 1 | 25 | 65 | 65 |
| 2 | 25 | 65 | 65 |
| 3 | 25 | 65 | 65 |
| 4 | 25 | 65 | 65 |
| 5 | 25 | 65 | 65 |
| 6 | 25 | 64 | 65 |

Each unit declares 25 vocabulary questions, 30 grammar questions, 5 reading questions, and 5 listening questions. Unit 6 therefore has one fewer question block than its declared structure. This must be reconciled against the official source; do not create a replacement question from guesswork.

## Confirmed Unit 1 content defects

1. The 25-word vocabulary bank contains **Success** twice (items 9 and 24).
2. Vocabulary question 20 offers the combined option `tool / skill`, although neither term appears in the 25-word vocabulary bank as the intended single answer. The source question and answer key need editorial review.
3. Grammar question 12 contains an abandoned sentence fragment: `My father ... a new car last year (Wait, present simple context: My father always ... to work)`.
4. Grammar question 17 visibly embeds a correction in the answer option: `arrives (Wait, I arrive) -> b is arrive`.
5. Grammar question 23 marks `makes` as the answer for plural subject `Bees`; standard subject–verb agreement requires `make`. The answer key is incorrect as written.
6. Grammar question 18 asks for a passive construction (`English ... spoken all over the world`) within a Present Simple quiz, but its three options do not provide the correct construction `is` as a valid marked answer in the source's bolded key. This item needs correction or removal based on the intended grammar scope.

## Integration status and safeguards

- These six Prep 2 New Hello documents are static HTML, not native interactive quizzes. Correct answers are embedded as bold markup; they must be converted to learner-answer controls with answer checking and feedback before being called interactive.
- Original imported HTML files remain unchanged. Corrections should be stored in a separate reviewed data layer or a documented patch, with source traceability.
- Do not mark this pathway complete until every item and answer key has been checked against the official student book/teacher source, Unit 6's missing question has been resolved, and the interactive quiz behavior is tested.
