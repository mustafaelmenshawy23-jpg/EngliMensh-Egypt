# Prep 2 New Hello remediation progress — updated 9 November 2026

Scope: the six Grade 2 general-path New Hello HTML units. Imported source HTML remains unchanged. Corrections are an app-facing review overlay and remain drafts pending official textbook/teacher-guide verification.

## Implemented in the app-facing layer
- Arabic draft translations cover every unique vocabulary headword across the six 25-card banks (149 unique headwords across 150 cards).
- The current Unit 1 source now has 25 distinct headwords; the previously reported duplicate `Success` is no longer present.
- Unit 1 vocabulary Q20 is repaired as a clear multiple-choice question, with `tool` as the unique correct answer (option a); it is not excluded in the current layer.
- Unit 1 grammar Q12/Q17/Q23 learner-facing repairs and reviewed keys are present; Q18 remains excluded pending scope review.
- Unit 2 vocabulary Q17 and grammar Q4 duplicate-choice repairs remain in the review layer.
- Unit 3 grammar Q20–Q30 have explicit answer-key overrides in the review layer.
- The build generator injects the review overlay, grammar guides, and interactive enhancement into generated viewer copies.
- The student registry routes six-unit lesson sections to those generated viewer copies.
- Vocabulary and grammar multiple-choice sections are converted to selectable choices. Keys use source bolding unless an explicit reviewed override exists; known ambiguous items remain excluded.
- Reading/listening questions that exposed inline `Answer:` text are converted into selectable MCQs. Up to three distinct distractors are drawn from other answers in the same passage/script, choices are randomized, and the correct key is preserved.
- Scoring compares the selected option key with the correct key; unanswered items remain available, submitted items stay locked, correct options are revealed, and retry resets the activity.
- Listening script text can be played using device/browser speech synthesis (English voice). This is TTS, not a recorded listening track.
- Grammar module receives an expanded Arabic guide with affirmative, negative, question/short-answer forms, spelling rules, signal words, examples, and common-error notes.
- Unit 6 grammar Q6 malformed `question-item` markup is normalized before quiz parsing.

## Automated safeguards
- Review-layer validator checks all 150 source vocabulary cards, Arabic draft translations, draft status, known corrections/exclusions, grammar guide completeness, viewer routing, overlay injection, listening playback, reading/listening MCQ conversion, and Unit 6 Q6 markup normalization.
- `npm test` runs `node --check scripts/prep2-interactive-enhancement.js` and the review-layer validator.

## Not yet approved / remaining work
1. Verify all six units against the official student book and teacher guide; current translations and explanations remain drafts.
2. Review every vocabulary/grammar prompt, distractor and answer key—not only previously flagged defects.
3. Resolve Unit 6's one missing declared question against official material.
4. Test generated viewers in Android WebView, including Unit 6's question count, exclusions, keyboard/screen-reader behavior, scoring and retry.
5. Decide whether approved recorded listening audio is available; current playback is TTS.
6. Complete the remaining Prep 2 New Hello Plus and other preparatory-grade units.

No merge to `main` and no APK distribution is authorized until the full preparatory curriculum is complete.
