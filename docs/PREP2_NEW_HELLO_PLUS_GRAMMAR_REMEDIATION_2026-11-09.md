# Prep 2 New Hello Plus — grammar quiz remediation
Date: 9 November 2026
Branch: `content-import/prep-new-hello-hello-plus`

## Changes applied
- Replaced the identical 30-question grammar bank copied into all six units.
- Added six separate 12-question multiple-choice banks (72 questions total), aligned to the recorded unit focus:
  1. Past Continuous vs Past Simple
  2. Modals of deduction and obligation
  3. Used to vs Would
  4. Second Conditional
  5. Gerunds vs Infinitives
  6. Present and Past Passive
- Every question has four distinct options, a numeric correct-option index, and an Arabic explanation.
- Updated quiz navigation labels and score maxima to 12 so the interface matches the actual question count.
- Changed the hero curriculum claim to state that these are practice drafts pending official-source review.
- Added `scripts/validate-prep2-plus-grammar.mjs` to the automated test suite. It checks six unit banks, 12 distinct stems per unit, four unique options, numeric answer keys, Arabic explanations, MCQ-only data, and matching score labels.

## Verification limits
The original official textbook pages are not readable in the current repository workflow because the source PDFs are stored as Git LFS pointers. These questions are original practice items aligned to the recorded grammar-topic map; they are **not** claimed to be extracted from or approved against the official book. Teacher review and source-page verification are still required before academic approval.

## Remaining work
- Review the grammar guide explanations/examples against official pages.
- Repair Prep 3 Plus vocabulary translations, definitions, examples, and placeholder assessments only after readable source material is available.
- Continue reviewing all other preparatory units and learning sections. No APK release or merge is authorized by this remediation.
