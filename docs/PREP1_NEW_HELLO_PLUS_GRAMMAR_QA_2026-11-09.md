# Prep 1 New Hello Plus — grammar assessment integrity follow-up
Date: 9 November 2026
Branch: `content-import/prep-new-hello-hello-plus`

## Scope
Static inspection of the six source files:
`Prep_1_New_Hello_Plus_Unit_1.html` through `Unit_6.html`.

## Verified results
For each of the six units, the `grammarQuizData` array contains 30 entries but only 20 distinct question stems (10 repeated stems per unit).
Across the six arrays, every inspected grammar question has four options, the four option strings are distinct within that question, and the `correct` index is an integer in the valid 0–3 range.

This is a structural check only. A valid index and four different strings do not prove that the keyed answer is grammatically correct or that the item matches that unit's taught grammar topic.

The source headings expose vocabulary, grammar practice, listening comprehension, and a comprehensive exam. The inspected six files contain no native `<audio>`, `getUserMedia`, or `MediaRecorder`; do not describe their speech synthesis as recorded listening or speaking assessment. A distinct speaking task and unit-linked game still need to be verified in the actual learner flow.

## Required remediation
- Review the 10 repeated grammar prompts in each unit; retain only where repetition has a documented pedagogical purpose, otherwise replace from the official unit scope.
- Verify every keyed answer against the grammar rule and source material, not just the index range.
- Keep all learner questions multiple-choice with exactly one defensible correct answer.
- Verify actual speaking and game interactions in the Android app; do not infer them from audio playback or ordinary dialogue text.

## Status
No source HTML was changed. This note does not approve the units academically. Official-source checking remains blocked until readable official source pages are available.
