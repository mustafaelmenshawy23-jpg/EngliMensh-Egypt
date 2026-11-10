# Curriculum inventory and generation status — 10 November 2026

Scope: `mustafaelmenshawy23-jpg/EngliMensh-Egypt`, branch `main` only. Original PDFs are preserved unchanged.

## Repository inventory

- **34 PDF files** under `public/books/`.
- **34 indexed source documents** in `data/curriculum/source-book-index.draft.json`.
- **125 indexed unit entries**: 81 in 15 official student books and 44 in 9 commercial supplements.
- The remaining 10 documents are 9 assessment books and 1 reader; they do not yet have unit-level records in the lesson-generation queue.
- `src/data/lessons/unit-modules.draft.json` contains 125 unit scaffolds with the nine requested section types. Scaffolds are structure only, not populated lesson content.

## Latest extraction snapshot

The batch artifact from [generation run 42777668120](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/42777668120) contains an extraction manifest for 34 source PDFs (5,626 PDF pages in total). It records 33 processed sources and one unavailable Git LFS source:

- `public/books/Performance Tasks Prep 2-OnlineMaterials.PDF` — `lfs_pointer_not_downloaded`.

A page being present in the extraction file does not mean its OCR is reliable. The source-quality gate currently blocks 43 unit candidates because of empty pages, repeated/watermark-like text, unusually short text, or other extraction anomalies. Those candidates must remain blocked until their source pages are recovered or visually reviewed.

## Resumable batch status

Snapshot time: 10 November 2026, 08:00 UTC.

| State | Units |
|---|---:|
| Indexed candidates | 125 |
| Blocked for source review | 43 |
| Failed transiently and waiting for retry | 15 |
| Eligible and not yet attempted | 67 |
| Valid generated drafts counted by the batch pipeline | 0 |
| Approved drafts | 0 |

The latest batch attempted 10 units. All 10 requests failed with Gemini API HTTP 503 (temporary high demand); no content from that batch was accepted. Five earlier units also have a transient failure record. The cursor and per-unit retry timestamps are saved in `artifacts/unit-drafts/batch-state.json`, and the detailed per-unit report is in `artifacts/unit-drafts/progress.json`.

Four older draft artifacts are present (Primary 1 Units 1–3 and Baccalaureate Year 2 First Language Part 1 Unit 4). They are not approved curriculum. Primary 1 Unit 1 has 58 items across nine sections, all still `needs_review`; Units 2 and 3 have 37 and 42 items respectively, each still `needs_review` and missing three of the nine section types. They must not be treated as completed or published.

## Pipeline and application findings

- The app loads only drafts from `src/data/approved-unit-drafts/` that pass the approval guard, including all nine section types, teacher review, confirmed visual review, and matching source fingerprint. This correctly prevents unreviewed artifacts from being published.
- The current batch generator covers student books and commercial supplements. Assessment books and the reader need their own source-grounded review/term-assessment processing path.
- The invalid regular-expression literal in `scripts/test-extraction-cache-health.mjs` was replaced with a direct import-contract assertion. The next run exposed a brittle expected sort order in `scripts/test-source-review-queue.mjs`; the test now correctly checks grouping by source PDF, then ascending PDF page.
- [Latest validation run 42783064793](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/42783064793) completed successfully on commit `c730cc0`: source-index checks, review-candidate checks, visual-recovery checks, lesson-content checks, unit-module checks, JavaScript syntax, all automated tests, and the production web build passed.
- [Latest deploy preview run 42783064663](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/42783064663) completed successfully.
- [Android preview run 42783064656](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/42783064656) completed successfully. Artifact `EngliMensh-Egypt-preview-debug-apk` (ID `13747131763`) contains a verified `app-debug.apk` of 7,245,181 bytes. It is a debug preview, not a signed Play Store release, and it has not been installed on a physical device.
- These workflow successes prove code/test/build health only; they do not prove lesson-content completeness.

## TTS and speaking

The app discovers voices through the Capacitor text-to-speech plugin on native platforms and browser `speechSynthesis` on web. Voice names/URIs are classified conservatively; only a voice classified as the requested gender is assigned to that role. If no matching voice is exposed, the app warns that gender matching is unverified and uses the platform default. User voice preferences are stored separately for male and female roles.

No physical Android device test was performed in this run, so actual male/female voice identity and playback quality remain unverified. No microphone-capture implementation (`getUserMedia`, `MediaRecorder`, or SpeechRecognition) was found in `src/main.js`; simultaneous microphone/TTS behavior therefore has not been exercised.

## Blocking workflow configuration

The repository default branch is currently `feature/primary-connect-connect-plus-2026-2027`, while this curriculum work runs on `main`. The default-branch copy of `generate-interactive-unit.yml` is an older workflow that checks out the feature branch. The main-branch workflow push produced a no-job run [42783062859](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/42783062859), and the earlier automatic continuation attempt was rejected by GitHub with HTTP 422. I did not modify the feature branch. GitHub batch continuation requires a manual repository-setting alignment: set `main` as the default branch, or have the repository owner add the current dispatch-enabled workflow to the default branch with its checkout explicitly targeting `main`. The saved per-unit cursor and retry state remain intact.

## Next work

1. Retry the 15 transiently failed units using the newly added and unit-tested Gemini fallback sequence: 3.8 Flash, 3.6 Flash, 3.5 Flash-Lite, then 3.5 Flash. The fallback code is committed, but it has not yet been exercised by a new batch because of the default-branch workflow mismatch.
2. Continue the 67 eligible candidates in bounded batches once the workflow is dispatchable; keep all source-blocked units out of generation until repaired/reviewed.
3. Recover the one unavailable LFS PDF and work through the 43 visual/OCR blockers.
4. Add a separate workflow for the nine assessment books and the reader.
5. Review each draft against its actual PDF pages, approve only after visual and answer-key checks, then test the approved content inside the app.

**Completion status: not complete.** The current batch snapshot still has 43 source-review blockers, 15 transient failures, and 67 pending candidates; no batch-generated unit is approved. The new fallback code is unit-tested but has not yet been exercised by a new generation run because of the default-branch workflow mismatch. Build success alone is not a curriculum-completion signal.
