# Prep 3 New Hello (general) — current content audit
Date: 9 November 2026
Branch: `content-import/prep-new-hello-hello-plus`
Source: `content-imports/preparatory/new-hello/Prep_3_New_Hello_Units_1_to_6_Full_Curriculum.html`

## Current source state (rechecked at the current branch head)

The earlier audit below this file's history is superseded: the source has since received teacher-authored runtime overrides for Units 3–6. The legacy generic template definitions remain in the file for maintainability, but the later `unitsData[3]` through `unitsData[6]` assignments replace them before the unit data is rendered.

### Unit 1 and Unit 2
- Unit 1: 75 MCQ records found; 75 distinct stems.
- Unit 2: 70 MCQ records found; 70 distinct stems.
- In both unit blocks, the structural scan found exactly four distinct options, a valid numeric correct-answer index, and a non-empty explanation for each question.
- This check does not establish that every answer is academically correct or that the items match the official textbook scope.

### Units 3–6
- Each unit now has a later teacher-authored runtime override containing vocabulary cards, a vocabulary quiz, a grammar guide, a grammar quiz, a reading passage, a listening dialogue, and a mixed exam.
- The source-wide validator counts 305 authored MCQ records across the six units and checks option uniqueness, answer-index bounds, explanations, draft provenance, and answer-preserving option randomization.
- The overrides are explicitly labelled as teacher-prepared review drafts, not verbatim official textbook content.
- The legacy generator/template definitions still exist earlier in the source; runtime overrides must remain in place. A regression test now checks that every Unit 3–6 override exists after the legacy template and contains all seven required content sections, and rejects known generic placeholder phrases inside the active override.

## Additional quality limitations
- The source contains inline SVG illustrations; these are not verified real-world vocabulary photographs. Do not count them as satisfying the photo requirement.
- Reading/listening content in teacher-authored sections is supplementary draft material. It is not a substitute for official recorded audio.
- The exact official textbook pages could not be checked from the repository workflow because source PDFs are stored as Git LFS pointers in the checkout. Academic approval of every translation, grammar explanation, question, distractor, key, and passage therefore remains open.

## Automated regression improvement
The Prep 3 general validator was strengthened to:
1. check all 305 authored MCQs for four distinct options, valid answer indices, and explanations;
2. require unique question stems and exact inventory counts for Unit 1 (75) and Unit 2 (70);
3. require complete later runtime overrides for Units 3–6; and
4. reject known placeholder content inside those active overrides.

The new validator logic was exercised against the current source text in this review and returned zero structural failures. GitHub Actions still needs to run on the resulting validator commit before the change is considered CI-verified.

## Release status
Prep 3 New Hello general is **structurally improved, not academically approved**. Keep the source HTML unchanged, preserve the draft label, and do not merge or release an APK until source-page verification, the remaining app features, and Android WebView/device checks are complete.
