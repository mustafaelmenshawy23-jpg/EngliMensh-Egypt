# Prep 1 New Hello — content cleanup and QA
Date: 9 November 2026
Branch: `content-import/prep-new-hello-hello-plus`

## Scope checked
Six files: `content-imports/preparatory/new-hello/Prep_1_New_Hello_Unit_1.html` through `Unit_6.html`.

## Completed
- Preserved 22 vocabulary entries per unit (132 total), with Arabic meanings, definitions and examples.
- Replaced repeated vocabulary question stems with new definition-based MCQs; each unit retains 30 distinct vocabulary questions (180 total).
- Removed repeated grammar questions from Units 3–6. Units 1–2 retain 30 distinct grammar MCQs each; Units 3–6 now contain 20 distinct MCQs each. Score labels were adjusted to match each bank.
- Preserved 20-question final exam banks in all six units.
- Kept all assessment questions multiple choice; no free-text assessment inputs were found by the validator.

## Automated validation
Added `scripts/validate-prep1-new-hello.mjs` to `npm test`. It checks vocabulary data, unique question stems, four distinct options, numeric answer keys, reading/listening sections, final tests, score labels, and absence of free-text assessment controls.

The validator's checks were also run directly against all six source files; no remaining structural failures were found.

## Limitations
This is a structural/content-quality check, not official textbook approval. Existing source explanations may be in English; the validator checks that each vocabulary card has a non-empty Arabic meaning, definition and example. Teacher review against readable official source pages remains necessary.
