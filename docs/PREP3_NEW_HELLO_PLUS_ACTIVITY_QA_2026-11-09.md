# Prep 3 New Hello Plus — activity and source QA follow-up
Date: 9 November 2026
Branch: `content-import/prep-new-hello-hello-plus`

## Scope
Six original source files: `Prep_3_New_Hello_Plus_Unit_1.html` through `Unit_6.html`.

## Original-source findings (preserved)
- The six original HTML files contain declarations for vocabulary, vocabulary quiz, grammar quiz, reading, listening and exam data.
- The original Unit 1 vocabulary/exam questions contained generic prompts and placeholder distractors (for example, “distractor term” and “unrelated word”).
- Original listening dialogue is not evidence of recorded listening audio or a distinct speaking activity.
- The original source files are preserved unchanged; their raw placeholder findings remain relevant when auditing the imported source itself.

## Later learner-facing remediation (supersedes the earlier “required action” for active app content)
The later remediation recorded in `docs/PREP3_NEW_HELLO_PLUS_VOCAB_REMEDIATION_2026-11-09.md` reports that the active app-facing layer was rebuilt with:
- 22 vocabulary entries and 22 definition-based vocabulary MCQs per unit (132 total);
- 12 unit-focused grammar MCQs per unit (72 total);
- original supplementary reading and listening passages/dialogues with five MCQs each per skill;
- 20-question mixed practice tests per unit, composed of 10 vocabulary and 10 grammar questions;
- unique options, numeric answer keys and Arabic explanations checked by automated validators.

These are teacher-prepared supplementary drafts based on the recorded headwords and grammar headings. They are not official textbook transcriptions or Ministry-approved assessments. The remediation report and validators must be rechecked at the current branch head before claiming all checks pass.

## Speaking and games
- Browser/device speech synthesis is TTS playback, not learner speech recording, speech recognition or pronunciation scoring.
- The original Plus files do not establish a distinct unit-linked speaking production task or unit-specific game. The preparatory app has a separate speaking-practice module and vocabulary game pathway, but this does not prove every Plus unit has a mapped speaking task/game.

## Required remaining action
1. Re-run the Prep 3 Plus validator against all six active data sets and inspect the generated viewer output.
2. Teacher-review every vocabulary translation, definition/example, grammar explanation, question, distractor and answer key against readable official source pages.
3. Confirm that the active viewer does not expose the original placeholder questions to learners.
4. Audit the unit-to-speaking and unit-to-game mapping; do not count TTS as recorded listening or speaking assessment.
5. Test all sections and games in Android WebView, including offline behavior and persistence.

## Status
Original HTML remains unchanged. Active learner-facing remediation is a supplementary draft, not academic approval. No APK release or merge to `main` is authorized.
