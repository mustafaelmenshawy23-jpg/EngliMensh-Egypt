# Prep 2 New Hello remediation progress — 2026-11-09

Scope: the six Grade 2 general-path New Hello HTML units. Imported source HTML remains unchanged. All corrections are an app-facing review overlay and remain drafts pending official textbook/teacher-guide verification.

## Implemented in the app-facing layer

- Arabic draft translations cover every unique vocabulary headword across the six 25-card banks (149 unique headwords across 150 cards).
- The build generator injects the review overlay, grammar guides, and interactive enhancement into generated viewer copies.
- The student registry now routes six-unit lesson sections to those generated viewer copies.
- Vocabulary and grammar multiple-choice sections are converted to selectable choices. Keys are taken from source bolding unless an explicit reviewed override exists; known ambiguous items are excluded.
- Reading and listening questions that exposed inline `Answer:` text are converted to short-answer inputs. Multiple-choice comprehension sections are converted to selectable choices.
- Scoring uses exact normalized text matching for short answers; unanswered items remain available, submitted items stay locked, and retry resets the activity.
- Listening script text can be played using device/browser speech synthesis (English voice). This is TTS, not a recorded listening track.
- Grammar module receives an expanded Arabic guide with affirmative, negative, question/short-answer forms, spelling rules, signal words, examples, and common-error notes.
- Unit 6 grammar Q6's malformed `question-item` class is normalized to a separate question before quiz parsing.
- Source-specific vocabulary repairs:
  - Unit 1 Q20 excluded pending editorial correction; grammar Q18 excluded pending scope review.
  - Unit 2 vocabulary Q17 excluded because of duplicate choices; grammar Q4 duplicate option corrected.
  - Unit 5 vocabulary Q9 aligned to the taught headword `respect`; the `disabled` definition is rewritten respectfully.
  - Unit 6 vocabulary Q1 rewritten to test `climate`; Q15 receives a proper blank and tests `mountain`; `renewable` definition is clarified as an adjective.
  - Unit 3 grammar answer-key overrides and duplicate-option repairs are maintained in the overlay.
  - Unit 1 grammar Q12/Q17/Q23 repairs are maintained in the overlay.

## Automated safeguards

- Review-layer validator checks all 150 source vocabulary cards, all unique Arabic draft translations, draft status, known corrections/exclusions, grammar guide completeness, generated viewer routing, overlay injection, listening playback presence, short-answer exact matching, and Unit 6 Q6 markup normalization.
- `npm test` runs `node --check scripts/prep2-interactive-enhancement.js` and the review-layer validator.

## Not yet approved / remaining work

1. Verify all six units against the official student book and teacher guide; current Arabic translations and expanded explanations are drafts.
2. Review all 25 vocabulary questions and 30 grammar questions per unit, confirming every key, option, and prompt—not only previously flagged defects.
3. Confirm that each generated viewer renders correctly in Android WebView on device, including Unit 6's 30-question count, excluded items, keyboard/screen-reader behavior, and retry/scoring.
4. Decide whether approved recorded listening audio is available; current implementation uses device TTS over the supplied script.
5. Complete the remaining Prep 2 New Hello Plus and other preparatory-grade units after this six-unit set is verified.

No merge to `main` and no APK distribution is authorized until the full preparatory curriculum is complete.
