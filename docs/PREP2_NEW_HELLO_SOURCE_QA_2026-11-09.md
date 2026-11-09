# Prep 2 New Hello source QA — 9 November 2026 (superseding update)

Branch: `content-import/prep-new-hello-hello-plus`

Scope: the six imported static HTML files in `content-imports/preparatory/new-hello/`. This is a source-quality audit, not academic approval.

## Inventory verified
All six files contain 25 vocabulary cards. The declared question structure is 65 blocks per unit (25 vocabulary + 30 grammar + 5 reading + 5 listening). Units 1–5 contain 65 blocks each. Unit 6 contains 64 blocks, so at least one declared question block is missing. The exact section and intended replacement must be checked against the official source before editing.

## Unit 1 findings — current source and review-layer state
The earlier source audit recorded a duplicate `Success` headword and defects in vocabulary Q20 and grammar Q12/Q17/Q18/Q23. Rechecking the current branch head shows:
- The current Unit 1 source vocabulary now contains 25 distinct headwords; `Success` appears once. The previous duplicate-headword finding is no longer current.
- The review layer now repairs vocabulary Q20 with the prompt “Computers and the internet are useful .......... for learning.”, a corrected option set, and the answer key `a) tool`. It is not excluded in the current JSON layer.
- Grammar Q12's editorial residue is removed in the learner-facing prompt.
- Grammar Q17's embedded correction is removed from the learner-facing option; the reviewed key is option a (`arrive`).
- Grammar Q23's reviewed key is option a (`make`) for the plural subject `Bees`.
- Grammar Q18 remains excluded pending grammar-scope review.

These are corrections in the app-facing review layer; the imported source HTML remains preserved and must not be silently overwritten.

## Unit 3 confirmed answer-key defects
The review layer contains overrides for Grammar Quiz questions 20–30. The original source marks incorrect answers for these items; the learner-facing interactive layer uses the reviewed key option a for each. The rationale and full wording still require teacher/source-page verification.

## Unit 6 completeness
Unit 6 still has 64 question blocks against 65 declared. Do not invent a replacement question. Compare against the official student book/teacher guide first.

## Other checks and remaining work
- Unit 2: inventory matches its declared 65 question blocks. Its review layer repairs the duplicate-choice issue in vocabulary Q17 and grammar Q4.
- Unit 4: inventory matches its declared 65 question blocks. No additional confirmed defect is recorded in this pass.
- Unit 5: inventory matches its declared 65 question blocks. Reviewed Have to / Don't have to items 23–27 have internally consistent marked answers, including the past-time context in question 26.
- All six units still need complete question-by-question verification of every stem, distractor, answer key, translation and grammar explanation against readable official sources.
- Reading/listening items with inline answers are converted to multiple-choice in the generated learner view; listening playback is device TTS, not recorded audio.

## Integration safeguards
- The original imported HTML files remain unchanged. Corrections are stored in a separate reviewed data layer with explicit source traceability.
- The review layer is labelled as draft pending official source review.
- Do not mark Prep 2 New Hello complete until all 6 units and their answer keys are verified against official source material, Unit 6's missing block is resolved, and Android WebView interaction/scoring/retry behavior is tested.
