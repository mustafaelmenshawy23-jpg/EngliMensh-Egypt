# Curriculum coverage status — 8 November 2026

**Repository:** `mustafaelmenshawy23-jpg/EngliMensh-Egypt`  
**Branch:** `main`  
**Snapshot commit:** `492b76de7e151c6139a857511ec845bf4fd2e902`  
**Scope:** this repository only. No other EngliMensh repository is part of this report.

## 1. Source inventory

| Measure | Current verified count |
|---|---:|
| Original PDF paths in `public/books/` | 34 |
| Books in the source index | 34 |
| Official student books | 15 |
| Commercial supplementary books | 9 |
| Assessment PDFs | 9 |
| Reader PDFs | 1 |
| Indexed lesson units | 118 |
| Units in official student books | 78 |
| Units in commercial supplements | 40 |
| Units missing a verified PDF start page | 0 |
| Additional units with an ambiguous next-unit boundary | 0 |
| Structural candidates with safely delimited page ranges (before OCR quality gating) | 118 |

The 34 source PDFs remain original Git LFS files. The index includes the previously unindexed Prep 2 performance-tasks PDF as an assessment source. Assessment books and the reader are catalogued separately; the current lesson-generation batch selects student books and commercial supplements, not assessment PDFs or reader chapters.

Books currently present in the index but without unit records are: Connect Plus Primary 5 and Hello Plus Preparatory 2 (their contents/unit pages still need indexing), the Baccalaureate Year 1 reader (chapters not yet indexed), and all nine assessment books (book-level exam sources, not lesson units).

### Visually verified unit-page boundaries

The 19 previously unresolved start pages have now been rendered directly from the hydrated original PDFs at 300 DPI and visually checked. All 19 pages show the expected unit number/title or the corresponding unit overview. The source index and module scaffolds were updated together; the validation workflow confirms both files are consistent.

- [Render workflow #42461394078](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/42461394078) — successful; artifact `englimensh-unit-page-boundary-review-300dpi`.
- [Verified boundary candidates](../data/curriculum/unit-page-boundary-candidates.draft.json) — retains the OCR evidence, rendered page, and visual-review status.
- All 118 indexed units now have a positive `startPdfPage`; the 19 newly confirmed pages are also synchronized into `unit-modules.draft.json`.
- The five previously ambiguous end boundaries are resolved because the next unit's start page is now known. End ranges are derived from the next start page and the source manifest; original PDFs were not edited.

Newly confirmed pages:
- Secondary 2 official book: Units 1–6 — PDF pages 6, 18, 30, 48, 60, 72.
- Baccalaureate Year 2 First Language Part 1: Units 2–3 — pages 39, 74.
- Baccalaureate Year 2 First Language Part 2: Units 7–8 — pages 40, 67.
- Primary 3 official book: Unit 3 — page 43.
- Primary 6 official book: Units 4 and 6 — pages 54, 85.
- Hello Plus Preparatory 3 supplement: Units 1–6 — pages 3, 66, 106, 157, 205, 254.

The two OCR-empty Baccalaureate Part 1 title pages were still confirmed visually from their 300-DPI images. These are page-boundary confirmations only, not academic approval of lesson content.

## 2. Unit structure and content state

- `src/data/lessons/unit-modules.draft.json` contains 118 unit records across 34 books.
- Every unit scaffold has the same nine sections: Vocabulary, Vocabulary Questions, Grammar, Grammar Questions, Reading, Listening, Speaking, Games, and Comprehensive Test.
- All 1,062 scaffold section slots are currently empty. The scaffold is a structural map, not populated curriculum content.
- `src/data/lessons/lessons.draft.json` contains 26 legacy lesson records and 149 items; all 26 records remain `needs_review`.
- The current draft directory contains four substantive unit drafts: Primary 1 Units 1–3 and Baccalaureate Year 2 First Language Part 1 Unit 4. They remain unapproved. A separate Unit 1 validation-failure report is not a content draft.
- `src/data/approved-unit-drafts/` currently contains no approved unit JSON files. Therefore no generated lesson draft is released as approved student content.

## 3. Application integration

The learner workspace defines nine independent section screens and a generic renderer for approved unit drafts. The release registry only imports JSON files from `src/data/approved-unit-drafts/` and requires explicit approval metadata and approved items. This is the intended path for all units; the older special renderers for Primary 1 Units 1–3 are not evidence of full-curriculum coverage.

The application build verifies compilation, not that all 118 units contain lessons or that every screen has been exercised with approved source content. No unit is counted complete until its source material is reviewed, approved, bundled through the approved-draft registry, and tested in the learner app.

## 4. Audio, speaking, games, and assessment limitations

- TTS voice discovery is implemented through the native Capacitor `getSupportedVoices()` API on native platforms and browser `speechSynthesis.getVoices()` on web. Each dialogue turn can carry `speakerGender`; users can choose separate male/female voice preferences when the platform exposes voices. Matching is only automatic when the voice name/URI explicitly identifies male or female; otherwise the app reports the limitation and uses the system default.
- The project code has not been tested on a physical Android device for actual voice inventory or male/female playback. No claim of gender-matched audio playback is made.
- No `getUserMedia` or `MediaRecorder` microphone-recording implementation is present in `src/main.js`. Dialogue TTS is sequential and stop-aware, but speaking recording/assessment is not implemented.
- Generated game challenges are currently multiple-choice interactions. More varied mechanics and real listening/speaking game behavior have not been verified.
- The generator prompt requests exactly 10 unit comprehensive-test questions, while the current automated validator enforces a minimum of 10 (it does not yet reject counts above 10). Book/term-level review exams from assessment PDFs still need a separate extraction, indexing, and integration path.

## 5. Workflow and build evidence

| Workflow | Run | Result |
|---|---:|---|
| Source/index, lesson, scaffold, test, and web build validation after boundary sync | [#42461668942](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/42461668942) | Success |
| 300-DPI unit-boundary visual render | [#42461394078](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/42461394078) | Success; 19 pages rendered and visually checked |
| Android debug preview APK after boundary sync | [#42461668925](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/42461668925) | In progress at APK packaging |
| Web preview deployment after boundary sync | [#42461668936](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/42461668936) | Success |
| Resumable interactive curriculum batch | [#42459874358](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/42459874358) | In progress at source extraction/OCR |
| Next ordered batch using corrected page boundaries | [#42461664348](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/42461664348) | Queued behind the active extraction run |

A validator defect was found and fixed in `scripts/validate-source-book-index.mjs`: the Git LFS pointer prefix and PDF filename regular expression were over-escaped, causing valid source pointers to be rejected. The validation run above confirms the corrected source-index check and all subsequent validation, tests, and web build passed.

The active generation run has completed checkout, dependency installation, and Git LFS hydration. Its source extraction/OCR step is still running; the batch-generation step has not started yet. The corrected page index triggered a second ordered batch run, which is queued behind it. The committed `progress.json` is still the older 6 November snapshot, and no `batch-state.json` has yet been committed. Do not treat that old progress file as the result of the active run.

## 6. Android preview artifact

- Artifact: `EngliMensh-Egypt-preview-debug-apk`
- Workflow run: [#42460424263](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/42460424263)
- APK size: 4,130,665 bytes
- SHA-256: `bf2e210319c8932cdac148e2620b26ae1cc7b02b7e01037ba499c8eb26a889a8`

This is a debug preview APK, not a signed Play Store release. Build success does not establish physical-device UI, audio, or microphone testing.

## 7. Remaining work

1. Complete source extraction and OCR for the active generation run, then generate and persist the first ordered unit batch and its queue cursor.
2. Continue the remaining ordered batches across all 118 indexed units; generated drafts remain unapproved until reviewed.
3. Add unit records and page ranges for Connect Plus Primary 5 and Hello Plus Preparatory 2.
4. Index the Baccalaureate Year 1 reader's chapters and create a separate workflow for the nine assessment PDFs.
5. Complete and manually approve all nine sections for every unit; then verify the generic renderer with actual approved drafts.
6. Test TTS voice lists and playback on real Android devices; implement or explicitly defer microphone recording and broader game mechanics.
7. Add and test book/term comprehensive review exams and their answer keys.

**Release status: not complete.** The repository inventory, nine-section scaffolds, approval gate, generic section renderer, and build/validation pipeline are in place. Curriculum population, manual academic review, device-level audio testing, and full app behavior verification remain outstanding.
