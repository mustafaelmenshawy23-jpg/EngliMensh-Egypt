# Prep 3 New Hello Plus — vocabulary remediation
Date: 9 November 2026
Branch: `content-import/prep-new-hello-hello-plus`

## Completed
Replaced generic placeholder vocabulary content in all six Prep 3 New Hello Plus units.

- 132 vocabulary entries now have Arabic meanings, learner-friendly English definitions, and contextual example sentences.
- Replaced the old generic vocabulary quiz banks with 132 definition-based multiple-choice questions (22 per unit).
- Each vocabulary question has four distinct headword options, a numeric correct-option index, and an Arabic explanation.
- Updated the displayed vocabulary quiz score maximum from 30 to 22 where present.
- Added `scripts/validate-prep3-plus-vocabulary.mjs` to `npm test`. It checks all six units for missing/placeholder Arabic meanings, generic definitions/examples, repeated headwords, duplicate options, invalid answer keys, and mismatches between each question and its target word.

## Important limits
These are carefully written learning aids based on the actual headwords already present in the six HTML files. They are not claimed to be a verbatim transcription or official ministry-approved translation set. A teacher/source-book review is still required before marking the unit content academically approved.

## Remaining Prep 3 Plus work
- The grammar quiz banks still contain repeated questions across units and require topic-by-topic correction.
- The comprehensive exam banks still contain generic placeholder questions/distractors.
- Reading and listening sections still need source-aligned passage/script review and specific MCQs.
- Speaking and game activities require a dedicated unit-by-unit audit.
- Original source PDFs are currently stored as Git LFS pointers in the repository workflow, so exact page verification is not available from the present checkout.

No APK release or merge to `main` is authorized by this work.
