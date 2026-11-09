# Prep 2 New Hello — follow-up QA findings (updated 9 November 2026)

Branch: `content-import/prep-new-hello-hello-plus`

This addendum supersedes the earlier Prep 2 New Hello source-QA findings where later fixes have been confirmed. Original imported HTML remains unchanged; the app-facing review layer contains learner-visible repairs.

## Cross-unit inventory
All six files contain 25 vocabulary cards. Units 1–5 contain 65 declared question blocks each. Unit 6 contains 64 blocks against 65 expected (25 vocabulary + 30 grammar + 5 reading + 5 listening). The missing Unit 6 block remains unresolved and must be checked against the official source; do not invent a replacement.

## Confirmed defects and current remediation
- Unit 1 vocabulary: the current source contains 25 distinct headwords; the earlier duplicate `Success` finding is superseded.
- Unit 1 vocabulary Q20: corrected in the review layer to a clear prompt about useful tools for learning, with `tool` as the unique correct answer (option a).
- Unit 1 grammar Q12: learner-facing prompt removes editorial residue.
- Unit 1 grammar Q17: learner-facing option removes the embedded correction; reviewed key is `arrive`.
- Unit 1 grammar Q23: reviewed key is `make` for plural subject `Bees`.
- Unit 1 grammar Q18: remains excluded pending grammar-scope review.
- Unit 3 grammar Q20–Q30: explicit review-layer answer-key overrides are present; teacher/source verification remains required.

## Other checks
- Unit 2: the review layer repairs the duplicate-choice issue in vocabulary Q17 and grammar Q4.
- Unit 4: inventory matches its declared 65 blocks; no additional confirmed defect recorded in this pass.
- Unit 5: inventory matches its declared 65 blocks; reviewed Have to / Don't have to items 23–27 have internally consistent marked answers, including the past-time context in Q26.
- Unit 6: 64 blocks versus 65 expected; unresolved.

## Required next action
1. Verify every prompt, option, key, explanation and grammar guide across all six units against readable official book/teacher-guide pages.
2. Locate Unit 6's missing declared question from an authoritative source.
3. Run the interactive viewer on Android WebView and test answer selection, unanswered-item handling, scoring, correct-answer reveal, retry, accessibility and persistence.
4. Keep all assessments multiple choice; retain the original HTML unchanged and record any additional repairs in the reviewed layer.

## Status
The app-facing review layer is structurally improved, not academically approved. Device TTS playback is not a recorded listening track. No merge to `main` or APK release is authorized.
