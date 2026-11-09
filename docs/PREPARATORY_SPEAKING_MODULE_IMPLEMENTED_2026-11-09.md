# Preparatory speaking module — implementation follow-up
Date: 9 November 2026
Branch: `content-import/prep-new-hello-hello-plus`

## Implemented
- Added a ninth preparatory learning module: `speaking`.
- Added `renderPreparatorySpeaking(words)`, which creates oral practice prompts from the selected unit's vocabulary records (up to 12 words).
- Each prompt offers optional device TTS model playback, then asks the learner to say the word aloud and optionally make a sentence.
- The speaking area is a practice activity, not a scored test. It does not claim to record speech, recognize pronunciation, or grade the learner.
- All assessed questions remain multiple-choice; no free-text answer field was introduced.
- The existing original HTML source files and vocabulary source data were not modified.

## Automated test changes
- `scripts/test-preparatory-learning.mjs` now requires all nine modules, including speaking.
- It checks for the speaking renderer, optional TTS control, and explicit disclosure that no recording or pronunciation scoring occurs.
- The success message now accurately identifies nine learning sections including speaking.

## Remaining work
- Verify CI on this exact commit.
- Verify the new screen in Android WebView, including a unit with vocabulary and a unit with no verified vocabulary.
- Source-quality issues in New Hello Plus remain open: placeholder translations/definitions, duplicated assessment prompts, and unit-specific grammar alignment must be repaired from readable official material.
- Phase 2 image coverage and offline asset verification remain in progress.

## Status
The speaking module is committed on the feature branch. It is not yet release-approved. No APK was shared and no merge to `main` was performed.
