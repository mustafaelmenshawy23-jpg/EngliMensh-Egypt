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


## Reproducible import preparation (2026-11-07)
The source ZIP was available as a conversation attachment and was parsed locally. A normalized JSON export was generated at `englimensh_primary_curriculum_2026_2027.normalized.json` (75 units, 2 tracks, 12 grade-track groups). It preserves the original vocabulary, examples, dialogue, phonics, reading, grammar, games, and assessment records, and explicitly records that item-level PDF page references were not supplied.

A reproducible repository importer has now been added:
- `scripts/import-primary-html-curriculum.mjs`
- npm command: `npm run import:primary-html`
- Expected archive path: `imports/englimensh_primary_full_75_units_2026_2027.zip`
- Generated repository output: `src/data/curriculum/primary-connect-html-2026-2027.json`

The importer checks the two tracks, six grades per track, all 75 units, 750 vocabulary entries, and all 1,050 supplied multiple-choice questions. It rejects invalid answer indexes/options and warns that all 1,050 source answer keys currently point to option index 0. It sorts unit numbers numerically (including the out-of-order Connect Primary 5 and 6 source keys).

## Remaining integration gates
- The source ZIP has not yet been committed under `imports/`, so the repository importer has not been executed in GitHub Actions or against the checked-out repository.
- The normalized dataset has not yet been added to the repository.
- The student app has not yet been wired to the new normalized dataset.
- The app currently uses PDF source-index book IDs for its student workspace. Integration must preserve that pathway and add HTML-source curriculum records with explicit provenance rather than fabricate PDF page numbers.
- Do not mark the 1,050 imported source questions academically reviewed. Randomize answer option positions at runtime while preserving answer identity, and add a separate, clearly labeled bank of supplementary questions with validated answer keys and meaningful distractors.
- No production build, test suite, APK, or merge has been claimed for this import branch.


## Repository handoff details
The branch now also contains `imports/README.md`, which documents the exact archive location, and `scripts/import-primary-html-curriculum.mjs` with the npm command `npm run import:primary-html`. The package script has been registered. The importer is designed to preserve source content as supplied, sort unit numbers, validate all MCQ answer indexes, and write the normalized JSON. It has not yet been executed in the repository because the ZIP itself is not yet present under `imports/`.


## Verification update (2026-11-07, follow-up)

The original conversation attachment was re-opened and independently parsed from its actual ZIP bytes. Its archive SHA-256 is `267126e18a5fae8db23aba5b33e49339cd25b28761a11b1eb843b05fe2266b18`. The expected `js/data.js` member exists and parses successfully. Structural validation confirmed 2 tracks, 6 grades per track, 75 units, 750 vocabulary entries, 750 vocabulary quiz items, 150 dialogue records, 75 speaking quiz items, 75 phonics records, 75 reading texts, 75 grammar records, 75 grammar quiz items, 150 word games, 150 exam questions, and 1,050 valid MCQs. All 1,050 MCQ answer indexes are 0, so runtime answer shuffling with answer identity preserved remains mandatory.

Important correction: the archive currently committed at `imports/EngliMensh_Primary_Curriculum_2026_2027.zip` is **not** the original HTML bundle. Its ZIP directory contains only `EngliMensh_Primary_Curriculum_2026_2027.json`; it does not contain `englimensh_primary_full_75_units_2026_2027/js/data.js`. Therefore the current importer cannot consume the committed ZIP as-is. The locally generated normalized JSON is 702,204 bytes and is not yet committed to the repository.

The open PR is #1. The feature branch is 10 commits ahead of `main`, 0 behind, and changes only the audit, import README, package script, importer script, and the mismatched ZIP. No application source file has been modified and the new curriculum is not wired into the student app. Do not merge PR #1 yet. Remaining gates: reconcile the archive format/path, commit the validated normalized dataset, integrate through an adapter without replacing existing PDF-backed pathways or progress storage, then run tests and production build and review the diff for regressions.
