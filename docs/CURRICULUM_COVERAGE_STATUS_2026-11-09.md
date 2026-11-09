# Curriculum coverage and batch-pipeline update — 9 November 2026

**Repository:** `mustafaelmenshawy23-jpg/EngliMensh-Egypt`  
**Branch:** `main` (changes prepared on `fix/restore-p1-units-gemini-38`)  
**Scope:** this repository only. No other EngliMensh repository is included.

## Verified repository inventory

| Measure | Current indexed count |
|---|---:|
| Original PDF paths in `public/books/` | 34 |
| Books in the source index | 34 |
| Official student books | 15 |
| Official student-book unit records | 81 |
| Commercial supplementary books | 9 |
| Commercial-supplement unit records | 44 |
| Assessment PDFs | 9 |
| Reader PDFs | 1 |
| **Indexed lesson units after this update** | **125** |
| Independent sections per unit | 9 |
| Empty section slots | 1,125 |
| Teacher-approved units | 0 |

All source PDFs remain unchanged. The index is a catalog, not a claim that every book has been populated.

## Primary 1 source-index correction

The official Primary 1 Term 1 PDF is 128 physical pages. The previous index contained only Units 1–3, even though the extracted page records show three more unit openings. This also caused Unit 3 to be assigned an unsafe end range extending to the end of the PDF.

Restored the following units using the page-level OCR from the original PDF extraction artifact:

| Unit | Title | Opening PDF page |
|---:|---|---:|
| 1 | Welcome to My School | 7 |
| 2 | The Garden of Colors and Shapes | 25 |
| 3 | I Love My Family | 42 |
| 4 | My Body and My Senses | 65 |
| 5 | On the Farm | 84 |
| 6 | Animals Around Me | 103 |

The new index and unit-module manifest now agree on all six units. Connect Plus Primary 5 adds four commercial-guide units, raising the current indexed total to 125. Unit 3 is consequently delimited at PDF page 64; Units 4 and 5 are delimited by the following unit openings. Unit 6 extends to the end of the 128-page source PDF. These page locations are source-index evidence only: every unit and every item remains `needs_review`.

## Generation pipeline failure found and corrected

Two recent ordered batch attempts failed before producing curriculum drafts:

- [Batch run #42459874358](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/42459874358)
- [Batch run #42461664348](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/42461664348)

The logs show Gemini API HTTP 404: `gemini-2.5-flash` is no longer available to new users. The logs did not indicate an invalid API key.

Changes prepared on this branch:
- Set `gemini-3.8-flash` as the default model in the unit generator, batch runner, and workflow input.
- Added a model-retirement 404 detector so the generator proceeds to the next configured supported model instead of aborting on the first unavailable model.
- Updated automated tests for default selection, explicit model fallback, and retirement handling.
- Fixed batch-state persistence: source extraction outputs are temporarily copied outside the working tree before the workflow rebases/pushes generated drafts and queue state, then restored for artifact upload. This addresses the observed `git pull --rebase` failure caused by untracked extraction output.

No API keys or secrets were added to the repository. Existing GitHub Secrets are referenced by name only.

## Content status

- `unit-modules.draft.json` now contains 121 unit records × 9 sections. All 1,089 sections remain empty and `not_populated`.
- `lessons.draft.json` contains 26 legacy lesson records and 149 items; all remain `needs_review`.
- Four substantive unit-draft files were previously present (Primary 1 Units 1–3 and Baccalaureate Year 2 First Language Part 1 Unit 4). They are not approved and do not make those units complete.
- The generator must still pass the source-quality gate and complete all nine modules before a unit can be considered a complete draft.

## Books that still need their own indexing path

The following sources are catalogued but do not yet have unit/chapter records. Connect Plus Primary 5 has now been indexed as four units (PDF pages 8, 46, 89, 130), but its content remains unpopulated and needs review:
- Hello Plus Preparatory 2 commercial guide.
- Baccalaureate Year 1 reader: chapter/section indexing is still required.
- Nine assessment PDFs: these need a separate book/term exam-bank extraction path, not lesson-unit generation.

## Runtime and assessment limitations

- The application discovers native Capacitor or browser TTS voices and supports separate male/female preferences when the platform exposes usable voices. Voice-name-based gender classification is not reliable for every platform. No physical Android device voice inventory or male/female playback test is evidenced.
- Dialogue roles may carry `speakerGender`; unknown voices must remain unverified. No claim of gender-matched playback is made.
- No microphone recording implementation is currently verified. Listening scripts may use TTS but are not original recorded book audio.
- Current generated games use the supported multiple-choice interaction; varied game mechanics and speaking/listening game behavior remain incomplete.
- Unit comprehensive tests are generated as a separate section, but book/term review exams and their answer keys still require the assessment-PDF workflow.

## Validation status

The branch is prepared for pull-request validation. The following checks must pass before merge:
- source-index and unit-scaffold consistency (34 books, 121 units, nine sections per unit);
- JavaScript syntax and automated application tests;
- production web build.

A successful build will prove compilation only. It will not prove content completeness, academic approval, TTS behavior on a device, or that every section has been exercised with real approved curriculum data.

**Release status: NOT COMPLETE.** The next safe milestone is a successful post-fix generation run that writes resumable, source-linked drafts for the first Primary-first batch. All generated material remains unapproved until it passes automated checks and teacher review.
