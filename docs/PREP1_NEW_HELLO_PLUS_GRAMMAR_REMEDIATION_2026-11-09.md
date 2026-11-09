# Prep 1 New Hello Plus — grammar quiz cleanup
Date: 9 November 2026
Branch: `content-import/prep-new-hello-hello-plus`

## Completed
- Audited all six unit grammar banks.
- Each bank previously contained 30 entries but only 20 distinct question stems; ten were repeated.
- Removed duplicate entries, leaving 20 distinct MCQs in each unit (120 across the grade).
- Updated the grammar quiz labels and score maxima to 20.
- Added an automated test `scripts/validate-prep1-plus-grammar.mjs` to check unique stems, four distinct options, numeric answer indices, explanations, and score labels.
- Removed unverified claims that the generated pages are official ministry-standard content; pages now state that they are supplementary drafts pending textbook review.

## Vocabulary question cleanup
- The six vocabulary banks had 30 questions each but only 27 distinct stems; the final three questions repeated earlier contexts.
- Replaced those repeated items in each unit with new definition-based MCQs for the same unit vocabulary (18 new questions total).
- Each unit now has 30 distinct vocabulary question stems, four options, and a numeric answer key. The 22 translated vocabulary cards per unit were preserved.
- Extended `scripts/validate-prep1-plus-grammar.mjs` to check the vocabulary bank, translations, unique stems, four distinct options, numeric keys, explanations, and no free-text assessment inputs.

## Limits
The 20 retained items are the unique questions already present in each unit's source HTML. This cleanup removes repetition; it does not independently prove every answer or every grammar point against the official textbook. Teacher/source verification remains required.
