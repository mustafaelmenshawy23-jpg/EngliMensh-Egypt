# Primary Connect / Connect Plus 2026–2027 import audit

## Source package
User-supplied archive: `englimensh_primary_full_75_units_2026_2027.zip`

Archive entries:
- `englimensh_primary_full_75_units_2026_2027/index.html`
- `englimensh_primary_full_75_units_2026_2027/englimensh_primary_complete_all_units_2026_2027.html`
- `englimensh_primary_full_75_units_2026_2027/css/style.css`
- `englimensh_primary_full_75_units_2026_2027/js/data.js`
- `englimensh_primary_full_75_units_2026_2027/js/app.js`

The `js/data.js` source declares a JavaScript object named `database`. Its object payload parses as JSON after removing the declaration and trailing semicolon. The source data file is approximately 554 KB.

## Confirmed curriculum inventory
- Connect: 39 units across Primary 1–6 (9 + 6 + 6 + 6 + 6 + 6).
- Connect Plus: 36 units across Primary 1–6 (6 per grade).
- Total: 75 units.
- Vocabulary entries: 750 (10 per unit).
- Vocabulary quiz items: 750 (10 per unit).
- Dialogue records: 150 (2 per unit).
- Phonics records: 75.
- Reading passages: 75.
- Grammar records: 75.
- Grammar quiz items: 75 (1 per unit).
- Speaking quiz records: 75 (1 per unit).
- Scramble-word activities: 150 (2 per unit).
- Exam questions: 150 (2 per unit).

Unit titles and all 75 unit records are present in the supplied data. Primary 5 and Primary 6 Connect units are not stored in numerical order; sort by the numeric unit number in the app rather than relying on object insertion order.

## Automated structural validation
- All 75 unit records contain the expected top-level content fields.
- All supplied multiple-choice question records have an options array with at least two choices and an in-range integer answer index.
- No invalid answer indexes or malformed option arrays were found in the inspected question groups.
- The source package contains 750 vocabulary quiz items, 75 grammar quiz items, 75 speaking quiz items, and 150 exam questions.

## Confirmed assessment quality issues
Every answer key in all four supplied quiz groups points to option index 0:
- Vocabulary quiz: 750 / 750.
- Grammar quiz: 75 / 75.
- Speaking quiz: 75 / 75.
- Exam questions: 150 / 150.

This makes the answer position trivially predictable. The app must shuffle answer options per question while preserving the correct answer, and newly authored supplementary questions must distribute correct answers across positions.

There are also repeated generic prompts:
- The speaking quiz uses only two generic prompt templates across the 75 units.
- The grammar quiz includes a repeated generic prompt ("Grammar accuracy check:") in multiple units.
- Vocabulary quiz wording repeats naturally for recurring vocabulary words; avoid counting these as unique higher-order questions.
- One exam prompt about the Suez Canal appears in more than one unit.

## Content provenance and labeling
The package is a user-supplied HTML/JavaScript curriculum resource. It does not include page-level PDF references for individual items. Imported records must therefore retain package/unit provenance and must not be assigned fabricated PDF page numbers or marked as individually PDF-verified.

The two dialogue records per unit include generic welcome/teacher text in the supplied app data. Treat these as supplied platform content, not automatically as verbatim textbook dialogue. Likewise, reading passages and grammar explanations should be labeled according to their actual source status. Do not present assistant-authored questions as printed textbook questions.

## Import and implementation requirements
1. Preserve the supplied Connect / Connect Plus split and all 75 unit records.
2. Map the six primary grades to the existing app's Primary pathway and the two tracks to General (Connect) and Advanced (Connect Plus), after confirming the current curriculum structure identifiers.
3. Sort unit numbers numerically.
4. Keep the source package as a distinct provenance source; do not fabricate PDF filename/page references.
5. Build a reusable importer/adapter instead of manually duplicating the same unit data into multiple app files.
6. Expand practice with clearly labeled supplementary questions: varied formats and difficulty across vocabulary, grammar, phonics, reading comprehension, listening/speaking, and unit review. Every generated question must have a validated answer key and plausible distractors.
7. Preserve existing progress storage, navigation, the existing PDF-derived curriculum index, and all non-primary stages.
8. Run the existing test suite and production build before proposing a merge or APK build.

## Repository integration status
This audit is committed on branch `feature/primary-connect-connect-plus-2026-2027`. The branch is one commit ahead of `main` and contains this audit document only. No curriculum data has yet been imported into the student app, no application files have been changed by this branch, no pull request has been opened, and no APK has been built.

The repository's existing governance expects curriculum content to remain source-linked and distinguishes extracted PDF material from review candidates. This HTML package should be added as an explicit, separate owner-supplied content source rather than misrepresented as PDF extraction.
