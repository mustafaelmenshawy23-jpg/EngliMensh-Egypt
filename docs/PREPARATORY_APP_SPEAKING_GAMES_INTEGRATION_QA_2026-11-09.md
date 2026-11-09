# Preparatory app integration QA — speaking and games
Date: 9 November 2026
Branch: `content-import/prep-new-hello-hello-plus`

## What the app currently exposes
The preparatory HTML library in `src/main.js` defines these learner modules:
1. Vocabulary
2. Vocabulary Questions
3. Grammar
4. Grammar Questions
5. Reading
6. Listening
7. Games
8. Comprehensive Test

There is no `speaking` module in this module list. Therefore, the current preparatory unit flow does not expose a dedicated speaking section, even if a source page contains dialogue or a “speaking” word in sample text.

## Games: source vs app distinction
The app does contain a separate preparatory game renderer with six mechanics:
- Picture Match
- Picture Quiz
- Word Jumble
- Meaning Quest
- Open the Box
- Flashcard Flip

These games use the selected unit's vocabulary records from `src/data/preparatory-vocabulary.json`; they are not games embedded in the imported HTML source files. The game renderer has an explicit empty state when no vocabulary records are available. Their usefulness depends on accurate word meanings, examples, and usable pictures in the generated unit data.

The stage-based `gameRegistry` elsewhere in the app still lists preparatory games as unavailable; the imported preparatory library uses its own separate game renderer. Do not confuse these two pathways or claim that all stage-wide game registry entries are populated.

## QA test gap
`scripts/test-preparatory-learning.mjs` asserts the presence of eight module IDs and six game IDs, but its success message says “9 learning sections”. It does not assert a speaking module. The test therefore currently permits the missing speaking section and overstates the section count in its success output.

## Required remediation
- Add a dedicated speaking-practice module to the preparatory unit navigation, with unit-specific oral prompts grounded in the source content.
- Keep any learner answer/check interactions multiple-choice where questions are used; oral repetition itself can be an optional practice task, not a free-text test.
- Do not claim speech recognition, microphone recording, or pronunciation scoring unless those capabilities are implemented and verified. Device TTS can be offered as a model playback only.
- Update the preparatory learning test to assert all nine expected learning sections, including speaking, and correct its success message.
- Verify the six game mechanics with unit-specific vocabulary after the vocabulary extraction/build pipeline runs; check that no placeholder translations/definitions are fed into Meaning Quest.

## Status
This is an integration QA note. No learner-facing source code was changed in this pass. The original imported HTML remains unchanged; no APK was built or shared and no merge to `main` was performed.
