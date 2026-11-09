# Prep 2 New Hello — follow-up QA findings (9 November 2026)

Branch: `content-import/prep-new-hello-hello-plus`

This addendum extends `docs/PREP2_NEW_HELLO_SOURCE_QA_2026-11-09.md`. It preserves the imported source HTML unchanged.

## Cross-unit inventory

All six files contain 25 vocabulary cards. The declared question structure is 65 blocks per unit (25 vocabulary + 30 grammar + 5 reading + 5 listening). Units 1–5 contain 65 blocks each. Unit 6 contains 64 blocks, so at least one declared question block is missing. The exact section and intended replacement must be checked against the official source before editing.

## Additional confirmed answer-key defects — Unit 3 (Present Continuous)

In the Grammar Quiz, questions 20–30 have incorrect bolded answer keys. The source marks the following answers as correct, but the sentence grammar requires the alternative shown here:

| Question | Source-marked answer | Grammatically correct answer |
|---|---|---|
| 20 | does | is |
| 21 | is | are |
| 22 | are | is |
| 23 | are | is |
| 24 | is | am |
| 25 | is | are |
| 26 | are | is |
| 27 | do | are |
| 28 | are | is |
| 29 | are | is |
| 30 | are | is |

These are answer-key defects, not changes to the lesson's target grammar. The interactive version must use the verified answer key, not copy the bold markup blindly.

## Other checks

- Unit 2: inventory matches its declared 65 question blocks. The arrow notation in its irregular-verb explanation is normal instructional notation, not a defect.
- Unit 4: inventory matches its declared 65 question blocks. No additional confirmed defect is recorded in this pass.
- Unit 5: inventory matches its declared 65 question blocks. The reviewed Have to / Don't have to items 23–27 have internally consistent marked answers, including the past-time context in question 26.
- Unit 6: 64 question blocks versus 65 declared. This remains an unresolved source completeness issue.

## Required next action

Before declaring Prep 2 New Hello complete:
1. Check Unit 3 questions 1–19 and all other unit answer keys systematically.
2. Compare Unit 6 against the official book/teacher material to locate the missing question.
3. Resolve Unit 1's duplicate vocabulary entry and malformed questions against an authoritative source.
4. Build a separate reviewed answer-key layer and learner-facing interactive quiz; do not alter the preserved imported source HTML.
