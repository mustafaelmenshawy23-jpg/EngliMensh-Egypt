# Prep 2 New Hello — Grammar, Reading & Listening structural QA (2026-11-09)

Scope: six imported Grade 2 New Hello unit HTML files on `content-import/prep-new-hello-hello-plus`. This is a structural/content audit, not textbook approval. Source HTML was not modified.

## Cross-unit findings
- All six units contain a Reading Comprehension section with five questions.
- All six units contain a Listening Comprehension section with a written listening script and five questions.
- None of the six files contains an `<audio>` element or an audio media source. Therefore the current listening material is script-only; it is not yet an actual listening activity with playable audio.
- Units 1–3 show each reading/listening answer directly as text (`Answer:`), rather than a student-response interaction. Units 4–6 present multiple-choice options. The app must not expose answer keys before a student responds.
- The imported files contain no question buttons in these sections. Interactivity must be added in the app-facing layer, not by assuming the HTML is already interactive.

## Unit-specific findings

### Unit 1 — Present Simple
- Grammar heading says 30 questions, and 30 question blocks exist, but only 29 possible bold answer markers were found.
- Grammar Q12 contains editorial residue and conflicting time references: it mentions "last year" before a parenthetical correction to a present-simple context. This must be rewritten before use.
- Reading and listening each have five questions, but answers are printed inline.
- Listening has a script only; no audio.

### Unit 2 — Past Simple
- 30 grammar question blocks and 30 possible bold answer markers.
- Grammar Q4 repeats `didn't` in both options a and b; the marked choice is not uniquely selectable.
- Reading and listening each have five questions, with answers printed inline.
- Listening has a script only; no audio.

### Unit 3 — Present Continuous
- 30 grammar question blocks and 30 possible bold answer markers.
- Previously identified duplicate grammar options remain a source defect: Q6, Q13, Q15, Q16 and Q19 each contain repeated choices. Q20–30 also have incorrect bold-marked keys as documented in `PREP2_NEW_HELLO_UNIT3_DETAILED_QA_2026-11-09.md`.
- Reading and listening each have five questions, with answers printed inline.
- Listening has a script only; no audio.

### Unit 4 — Must / Mustn't
- 30 grammar question blocks and 30 possible bold answer markers.
- Reading and listening each have five multiple-choice questions.
- Listening has a script only; no audio.

### Unit 5 — Have to / Don't have to
- 30 grammar question blocks and 30 possible bold answer markers.
- Reading and listening each have five multiple-choice questions.
- Listening has a script only; no audio.

### Unit 6 — Comparatives & Superlatives
- The quiz heading says 30 questions and the text includes numbered items 1–30, but the HTML contains only 29 `div.question` blocks.
- The markup around Q5/Q6 is malformed: Q6 appears inside the Q5 question block instead of a separate block. This can break question extraction, rendering, scoring, or answer selection even though the text for Q6 exists.
- Reading and listening each have five multiple-choice questions.
- Listening has a script only; no audio.

## Required remediation before approval
1. Correct Unit 1 Q12 and supply/review its missing answer key marker.
2. Remove Unit 2 Q4 duplicate option and verify one unique correct answer.
3. Repair Unit 3 duplicate options and all incorrect keys from the detailed QA report.
4. Repair Unit 6 Q5/Q6 HTML structure into two independent question records; then run a DOM/count test that asserts exactly 30 questions.
5. Create actual listening audio or an approved playback/TTS implementation, and keep scripts/answers separate from the student view.
6. Convert reading and listening into genuine interactive assessments with hidden answer keys, scoring, retry/accessibility support, and consistent question schemas.
7. Verify all content against the official book/teacher guide before marking approved.

No APK was built or distributed. No merge to `main` was performed.
