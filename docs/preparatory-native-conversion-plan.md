# Preparatory native curriculum conversion

Branch: `feature/preparatory-native-curriculum`

## Source preservation
All 31 original preparatory HTML source files from the approved import branch have been copied unchanged into `content-imports/preparatory/`. These are source/reference files only. They must never be loaded into the application through an iframe or executed in the main app.

## Confirmed inventory
- Prep 1 / New Hello: 6 unit sources.
- Prep 1 / New Hello Plus: 6 unit sources.
- Prep 2 / New Hello: 6 static unit sources.
- Prep 2 / New Hello Plus: 6 interactive unit sources.
- Prep 3 / New Hello: one combined source containing Units 1–6.
- Prep 3 / New Hello Plus: 6 interactive unit sources.

## Content audit findings
1. The interactive unit files contain structured vocabulary, grammar, reading, listening and assessment data in inline JavaScript. The content can be extracted into app-owned JSON records.
2. The New Hello Prep 2 general files are static HTML. Their answer keys are visually emphasized in markup, not interactive controls. Convert the question text and choices into native question records and explicitly mark answer keys during parsing.
3. Prep 2 New Hello Unit 1 repeats the vocabulary item “Success”. Do not silently retain the duplicate as a separate word; verify the intended missing word against the original book before correction.
4. Prep 2 New Hello Unit 6 contains 29 grammar questions although the heading claims 30. Do not invent a 30th question.
5. The combined Prep 3 New Hello source contains generated placeholder content such as “Correct Ministerial Option”, “Incorrect Distractor”, “Question 1”, “Official target vocabulary term”, and generic generated reading/listening passages. Those generated placeholders are not valid curriculum content and must not be published. Recover those sections from the official source book / trusted original material and preserve the source page references.
6. The sampled source pages do not use ordinary raster image elements. Some units embed decorative SVG drawings; other vocabulary entries use emoji. These visuals must be reviewed word by word. Prefer real, clearly matching, openly licensed photographs for concrete vocabulary. For abstract words, use a clear semantic symbol rather than an unrelated image. Retain attribution and license metadata for downloaded images.
7. Source HTML includes inline scripts and external font/CDN references. None of those scripts or external dependencies may be needed by the shipped lesson UI.

## Native app requirements
Each unit must be rendered by the application itself, using the same responsive lesson and quiz experience as the primary stage:
- Vocabulary cards with English word, Arabic meaning, pronunciation, example and a relevant visual.
- Vocabulary practice with randomized choices and immediate feedback.
- Grammar explanation, form, usage, examples and native exercises.
- Reading passage and comprehension questions.
- Listening transcript/audio playback and comprehension questions.
- Unit-specific interactive games.
- Comprehensive unit assessment with score, saved progress and certificate eligibility.
- Independent progress per student, stage, grade, pathway, term and unit.

No iframe, HTML viewer, embedded web page, or runtime execution of imported source scripts is acceptable.

## Completion gates
- Exactly 31 source HTML files accounted for.
- All 3 grades × both pathways have six unit records each (36 units).
- No synthetic placeholders or unverified answer keys.
- Source counts and answer indices validated.
- All concrete vocabulary images visually inspected; no missing or mismatched image may be represented as a real photo.
- Offline operation verified without remote fonts/CDNs.
- Native navigation, answer randomization, progress persistence, TTS, games and certificates regression-tested.
- Android debug APK built only after all gates pass.


## Prep 3 past-exam section (after Unit 6 only)
- Add a separate section titled "نماذج امتحانات سابقة" after Unit 6 in Prep 3; do not add it to Prep 1 or Prep 2.
- Include only real, dated English exams that can be verified as belonging to the New Hello / New Hello Plus curriculum actually taught in that academic year.
- Initial research found New Hello Prep 3 exam/revision material explicitly labeled 2023/2024 and 2024/2025, and New Hello Prep 3 material advertised for 2025/2026. This is a discovery lead, not yet an approved inclusion list: verify each exam's year, governorate/source, curriculum match, term, and whether it is an actual past exam or merely a predicted/revision test before importing it.
- Exclude exams for other textbook editions/curricula, predicted exams presented as historical exams, and any undated or unverifiable files.
- Prefer official Ministry/directorate exam papers where available; otherwise retain source URL, publisher/teacher attribution, year, term, governorate, answer-key status, and a verification note.
- Keep each paper available offline in the app. Use a native exam runner only if the source can be faithfully converted with verified questions and answers; otherwise provide the original PDF/document as a clearly labeled downloadable/openable paper without pretending it is an interactive native exam.
- Do not infer that the new academic year 2026/2027 uses the same Prep 3 textbook. Confirm the textbook/edition before adding any papers for that year.


## Preferred reference: El-Moasser (المعاصر)
- Use El-Moasser New Hello! 3rd Prep final-revision / governorate-exam collections as a priority reference for checking the exam format, coverage, and the years in which the current textbook edition was in use.
- A verified discovery lead is "EL-MOASSER GUIDE – FINAL REVISION – New Hello! ENGLISH – 3rd Prep. 2024 – FIRST TERM". Its contents list 15 general sample tests and 5 Al-Azhar sample tests, and the cover states it follows the 2023–2024 exam specifications. Treat these as sample tests, not automatically as actual historical governorate exams.
- Another discovery lead is a 2025 collection labeled "محافظات كتاب المعاصر لغة إنجليزية ٣ع ترم أول 2025". Verify its individual papers and provenance before classifying any as actual past exams.
- Separate the section into clear categories where evidence supports them: (A) actual past governorate/ministry exams, with year + term + governorate and source; (B) El-Moasser practice/sample tests, clearly labeled as practice/sample, with edition/year and term. Never mislabel practice tests as historical papers.
- Use El-Moasser to cross-check topic alignment and exam style; do not copy/reproduce its proprietary question sets, answer keys, scans, or PDFs into the app without permission/licensing. Prefer linking to authorized publisher material or independently sourced official exam papers. If an authorized copy is supplied, preserve its source and usage permissions.
- Record source URL, exact title, edition/year, term, governorate (if applicable), whether it is a real exam or practice test, answer-key availability, and curriculum-match verification.
- Only include papers from academic years in which the exact New Hello / New Hello Plus edition was actually taught. Do not assume a 2026/2027 Prep 3 edition matches the older edition without checking.

## Follow-up source audit — critical blockers found during native conversion

- The existing curriculum structure currently defines only the Preparatory General / New Hello pathway. The imported New Hello Plus HTML files exist (18 files across Prep 1–3), but there is no corresponding `egypt-preparatory-advanced` pathway or source-book records in the current source index. Do not expose New Hello Plus as selectable until its six units per grade have been mapped into the native curriculum.
- Prep 3 New Hello Plus Unit 1 and Unit 2 contain synthetic vocabulary metadata such as the Arabic placeholder "مفردة دراسية" and generic definitions/examples ("An essential curriculum term..."). These records are not student-ready content. Audit all six Prep 3 Plus units and the remaining imported sources before conversion; do not publish placeholder Arabic meanings, definitions, examples, or SVG initials as real vocabulary visuals.
- The combined Prep 3 New Hello HTML file contains injected Firebase host configuration and an `initialAuthToken` bearer JWT, in addition to unrelated host/runtime scripts. Treat that token as exposed: revoke/rotate the associated credential or service-account access immediately. Never copy the token, Firebase host scripts, or configuration into the native app, logs, documentation, or new commits. The imported HTML is archival source only and must not be executed or shipped.
- The first source-integrity test had a filename expectation defect: Prep 2 New Hello files use the `_Complete.html` suffix. The test was corrected in commit `506a6ea84c2ed27325e9f6969dff038493244ae9`; the test still needs to be run in CI after the next workflow/test run.
- Native conversion remains blocked on source verification, structured data extraction, and curriculum wiring. The presence of 31 HTML files is not evidence that 36 verified native units are ready.


## Additional alignment audit — do not map HTML titles to official books by filename alone

A direct comparison of the preserved source metadata with the official-book index found a concrete mismatch: the Prep 1 New Hello HTML Unit 1 is titled "My Family and Me", while the indexed Egyptian Ministry student book for Preparatory 1 Unit 1 is "Life in a Digital World" (PDF page 13). The Prep 1 New Hello Plus HTML Unit 1 is titled "A World of Work", while no official New Hello Plus student-book record is currently present in the source-book index. These files therefore cannot be treated as verified unit content solely because their filenames and grade/unit numbers match.

The new metadata-only audit script `scripts/audit-preparatory-html.mjs` inventories all 31 source titles and flags synthetic placeholders, injected host/runtime or credential markers, external font/CDN dependencies, and initials-only SVG visuals. It never executes source scripts and never prints credential values. It is part of `npm test`. Its output is a QA inventory, not academic approval. Every source unit must be reconciled against the correct book edition and page before conversion or student visibility.


## Automated source-audit run — 2026-11-08

The validation-only workflow run `42521352658` completed successfully. Existing automated checks reported 31 application tests, 25 storage-hardening tests, 41 navigation/launch tests, and 482 imported-curriculum checks passing, with zero failures in those reported groups. The preparatory metadata audit examined all 31 preserved HTML files and found:
- 25 files with at least one source-quality/dependency flag.
- 7 files containing synthetic or placeholder content.
- 1 file containing injected host-runtime / credential markers.
- 25 files referencing external font/CDN dependencies.
- 6 files using initials-only SVG visuals.

The workflow deliberately skipped the Android APK job on this preparatory branch. These results validate the audit tooling and existing regression checks only; they do not mean the preparatory curriculum has been converted or approved. The source-to-book mismatch described above remains an active blocker.
