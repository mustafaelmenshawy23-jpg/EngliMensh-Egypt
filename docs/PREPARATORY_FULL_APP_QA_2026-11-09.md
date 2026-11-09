# Preparatory curriculum and app-wide QA checkpoint
Date: 9 November 2026
Branch: `content-import/prep-new-hello-hello-plus`
Reviewed head before this report: `d1bbd87c5ea4d457d900c5dd3a1e92fca3a07334`

## 1. Current automated validation
- GitHub Actions validation run `42572086234` completed successfully on the reviewed head.
- All 16 listed workflow steps passed, including automated tests, production Vite build, and web-build artifact upload.
- This is a web/PWA build and static/Node test suite. It is not an Android APK build and does not prove device-level behavior.

## 2. New Hello general — three preparatory grades
- Prep 1: six units have 22 vocabulary cards each, Arabic meanings/definitions/examples, 30 unique vocabulary MCQs per unit, 20-question final tests, and grammar banks reduced to distinct items (30 in Units 1–2; 20 in Units 3–6). Structural validator is in `npm test`. Academic answer-by-answer review against readable official pages is still required.
- Prep 2: six units have an app-facing Arabic vocabulary review layer (149 unique headwords across 150 cards), expanded Arabic grammar guides, known answer-key/duplicate-choice repairs and interactive question handling. The current enhancer converts source `Answer:` comprehension records into selectable MCQ options using other answers from the same passage/script, and the reading/listening source scripts can be played with device TTS. The original source files remain distinct from the review overlay. Full semantic review of every prompt, distractor, key and translation, plus Android WebView/device verification, remains open.
- Prep 3: Units 3–6 have explicit teacher-authored overrides for vocabulary, grammar, reading, listening and quizzes; the initial generic template objects are replaced before rendering and are not the active unit content. A fresh source audit found 305 authored MCQs with four distinct options, valid answer indices and non-empty explanations; no repeated question stems or common placeholder markers were found. I also strengthened 25 concise explanations and removed the unsupported claim of full Ministry compliance from the footer. Remaining gate: answer-by-answer academic verification against the exact source book, and a human check of reading/listening answer evidence and unit-scope alignment. The content for Units 3–6 is teacher-prepared review material, not verbatim official text.

## 3. New Hello Plus — three preparatory grades
- Prep 1 Plus: vocabulary/grammar duplicate stems were removed; current validators check counts, distinct stems, option sets, answer-index shape and score labels. Correctness and unit-scope alignment still need teacher/source verification.
- Prep 2 Plus: duplicated cross-unit grammar banks were replaced with separate 12-question unit-focused banks; six supplementary reading passages and listening dialogues and their MCQs were added; vocabulary cards include Arabic meanings. Current tests verify structure and selected topic signals, not every semantic distractor/key or official-book alignment.
- Prep 3 Plus: vocabulary cards, Arabic meanings, definitions, contextual examples, vocabulary MCQs, unit-focused grammar MCQs and supplementary reading/listening MCQs were rebuilt. Automated checks cover placeholder fields, question structure, options, keys and counts. Teacher/source verification remains necessary; reading/listening are supplementary text with TTS, not official recordings.

## 4. App functionality review — source-level findings
### Present in current app source
- Stage/grade/path navigation and imported preparatory unit/section routing.
- A preparatory learning path with nine modules, including vocabulary, grammar, reading, listening, speaking practice, games and comprehensive test.
- Six preparatory game mechanics: picture match, picture quiz, word jumble, meaning quest, open the box and flashcards.
- Local progress persistence and defensive storage validation.
- Device/browser text-to-speech playback and selectable speaker voices. Speaking practice is oral repetition with optional model playback; it does not record, recognize or score learner speech.
- App launcher/PWA icon preparation and a successful production web build.

### Missing or not evidenced in current runtime source
- Student profile creation/editing, per-student photo selection/camera/gallery flow, and per-student progress separation were not found in `src/main.js` or the tracked runtime module set.
- Certificate generation/ownership/threshold logic (including the agreed 90% per student per completed unit) was not found in runtime code.
- Four selectable, persistent visual themes were not found. The current stylesheet defines one main design-token palette; no theme switcher or theme persistence was found.
- Stage-wide game registry still marks non-primary stage games unavailable. The six preparatory games are a separate unit-vocabulary pathway and should not be presented as all-stage game coverage.
- TTS is not recorded listening audio, speech recognition, or pronunciation scoring.

These are implementation gaps, not test failures. They must be implemented and then tested before claiming those approved features are complete.

## 5. Test coverage limits and release gates
- Existing navigation tests include state/selector and source checks, not full end-to-end Android interaction on a physical device.
- Storage tests exercise defensive serialization/restore logic, but do not prove multi-student data isolation because student profiles are not currently implemented.
- TTS tests cover voice classification/selection, not actual pronunciation quality on different Android devices.
- Game tests check wiring and randomization patterns; device play-through, score persistence, accessibility, and empty-vocabulary behavior still require manual QA.
- Theme/profile/certificate regression tests cannot pass until those features exist.
- The source-book PDFs are represented as Git LFS pointers in the validation checkout. Exact official-page verification remains blocked until readable source pages are available.

## 6. Release decision
- Keep PR #3 open and unmerged.
- Do not produce or distribute an APK yet. The current successful workflow is a web validation/build only.
- Required before APK review: replace Prep 3 New Hello general placeholders; finish semantic review of all three grades in both pathways; implement the missing profile/certificate/theme features; complete app regression and Android WebView/device QA; then run a fresh successful Android debug build and review its artifact.
