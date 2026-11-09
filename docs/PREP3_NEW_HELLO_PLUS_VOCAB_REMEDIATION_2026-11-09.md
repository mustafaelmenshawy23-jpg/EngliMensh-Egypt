# Prep 3 New Hello Plus — vocabulary remediation
Date: 9 November 2026
Branch: `content-import/prep-new-hello-hello-plus`

## Completed
Replaced generic placeholder vocabulary content in all six Prep 3 New Hello Plus units.

- 132 vocabulary entries now have Arabic meanings, learner-friendly English definitions, and contextual example sentences.
- Replaced the old generic vocabulary quiz banks with 132 definition-based multiple-choice questions (22 per unit).
- Replaced generic reading and listening filler in all six units with original, theme-based supplementary passages/dialogues and five MCQs each per skill (60 reading/listening MCQs total).
- Replaced the repeated generic grammar banks with 12 distinct unit-focused MCQs per unit (72 total), using the grammar headings already present in the six HTML lessons: Present Perfect Simple/Continuous; Relative Clauses; Future Continuous/Future Perfect; Past Perfect/Past Simple; Causative have/get; and Reported Speech.
- Rebuilt each 20-question mixed practice test from 10 vocabulary and 10 questions from that unit's grammar bank.
- Rebuilt each 20-question mixed practice test from 10 vocabulary and 10 grammar MCQs, removing placeholder distractors and repeated stems.
- Corrected displayed score maxima to match the actual question counts and removed unverified claims that these are official ministry assessments.
- Extended the automated validator to check reading/listening, grammar, and mixed-test counts, unique options, answer keys, and placeholder strings.
- Each vocabulary question has four distinct headword options, a numeric correct-option index, and an Arabic explanation.
- Updated the displayed vocabulary quiz score maximum from 30 to 22 where present.
- Added `scripts/validate-prep3-plus-vocabulary.mjs` to `npm test`. It checks all six units for missing/placeholder Arabic meanings, generic definitions/examples, repeated headwords, duplicate options, invalid answer keys, and mismatches between each question and its target word.

## Important limits
These are carefully written learning aids based on the actual headwords already present in the six HTML files. They are not claimed to be a verbatim transcription or official ministry-approved translation set. A teacher/source-book review is still required before marking the unit content academically approved.

## Remaining Prep 3 Plus work
- Grammar MCQs are now aligned to the grammar headings recorded in each HTML unit, but still require teacher/source verification against the official book.
- The mixed practice test is a useful 10-vocabulary/10-general-grammar exercise, not a fully comprehensive exam across all skills.
- Reading/listening are original supplementary practice, not official textbook passages/audio. They need teacher/source review.
- Speaking and game activities require a dedicated unit-by-unit audit.
- Original source PDFs are currently stored as Git LFS pointers in the repository workflow, so exact page verification is not available from the present checkout.

No APK release or merge to `main` is authorized by this work.


## Follow-up parser hardening — 9 November 2026
- Replaced the validator's fragile `indexOf('];')` array terminator with balanced-bracket extraction that respects escaped quotes inside JSON strings and embedded SVG markup.
- Added a parser fixture containing the literal characters `];` inside a quoted SVG value and an escaped quote.
- Exercised the same balanced extraction against all six current Prep 3 Plus HTML source files. Each parsed successfully with the expected inventory: 22 vocabulary entries, 22 vocabulary MCQs, five reading MCQs, five listening MCQs, 12 grammar MCQs, and 20 mixed-test MCQs per unit.
- This direct structural exercise is not a GitHub Actions run or teacher approval. The latest validator commit still requires CI confirmation.
