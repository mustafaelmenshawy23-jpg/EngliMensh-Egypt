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
