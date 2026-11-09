# Prep 2 New Hello Plus — grammar scope and answer-key QA
Date: 9 November 2026
Branch: `content-import/prep-new-hello-hello-plus`

## Scope
Compared the grammar quiz bank in all six `Prep_2_New_Hello_Plus_Unit_1.html` through `Unit_6.html` files and inspected the full 30-item bank in Unit 1.

## Confirmed findings
- The 30-question `grammarQuizData` array is byte-for-byte identical in all six units.
- The official topic map recorded for Prep 2 Plus assigns a different primary focus to each unit:
  1. Past Continuous vs Past Simple
  2. Modals of deduction and obligation
  3. Used to vs Would for past habits and states
  4. Second Conditional
  5. Gerunds vs Infinitives
  6. Present and Past Passive Voice
- Unit 1's repeated shared bank includes questions on Past Continuous, but also future prediction with “going to”, modal deduction, Second Conditional, gerunds/infinitives, passive voice, used to, Present Simple, Present Perfect, and superlatives. Thus most of the shared bank does not test Unit 1's stated grammar focus.
- The source data contains 30 MCQs with four options per question. One answer key is encoded as string `"0"` while the others are numeric zero; this type inconsistency should be normalized and validated by the renderer/validator, without changing the intended key.
- The identical shared bank is not evidence that six units have six unit-specific grammar assessments.

## Required remediation
- Build six separate grammar banks from the corresponding official unit grammar scope and examples.
- Keep every question MCQ with exactly one defensible correct answer.
- Validate answer-key types and correctness, not just whether an index exists.
- Retain the source page references for each rule and assessment item once official pages are available.

## Status
No original HTML was changed. The grammar assessment for this pathway is not accepted as complete. Official-source checking remains blocked pending readable book pages.
