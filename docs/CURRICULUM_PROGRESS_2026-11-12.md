# Curriculum generation progress — 2026-11-12

Snapshot: 2026-11-12 10:53 Asia/Riyadh. All repository work in this report is limited to `mustafaelmenshawy23-jpg/EngliMensh-Egypt`, branch `main`.

## Repository inventory

- Indexed source records: 34 books/PDFs.
- Indexed lesson units: 125, distributed across 23 books with lesson-unit records.
- Assessment books and the separate reader are not yet processed by the lesson-unit generator; they require dedicated assessment/reader workflows.
- Original PDFs remain unchanged.

## Resumable generation state

| State | Units |
|---|---:|
| Validated draft awaiting teacher review | 26 |
| Blocked by source/OCR review | 59 |
| Failed transiently (quota, timeout, API/model availability, etc.) | 25 |
| Failed validation or unusable model output | 15 |
| Approved | 0 |
| Candidates currently eligible for retry/generation | 39 |
| Candidates waiting for retry time | 1 |

The 26 drafts are spread across 8 books: Primary 1, Preparatory 2, Preparatory 3, Secondary 1, Secondary 2, Secondary 3, and the two Baccalaureate Year 2 First Language parts. All 26 have nine populated sections according to the current validator. They remain drafts and are not approved or published into the student workspace.

## Section coverage in the 26 validated drafts

| Section | Units with items | Items | Validator-valid items |
|---|---:|---:|---:|
| Vocabulary | 26 | 142 | 142 |
| Vocabulary questions | 26 | 78 | 78 |
| Grammar | 26 | 41 | 41 |
| Grammar questions | 26 | 78 | 78 |
| Reading | 26 | 54 | 54 |
| Listening | 26 | 53 | 53 |
| Speaking | 26 | 26 | 26 |
| Games | 26 | 53 | 53 |
| Comprehensive tests | 26 | 260 | 260 |

These counts prove schema/quality-gate coverage only. They do not prove academic accuracy, complete transcription of every source passage, real TTS voice matching, or that the drafts are integrated into the live student workspace.

## Source extraction snapshot

- Source books indexed in extraction manifest: 34.
- OCR processed pages: 4,399.
- OCR reliable pages: 3,847.
- OCR unreliable pages: 468.
- OCR empty pages: 84.
- OCR processing errors: 0.
- The manifest conservatively marks 4,399 pages for visual review; this flag is not equivalent to saying every page is unreadable.
- The unit source gate currently blocks 59 units. Their page-level issues must be visually resolved before generation is retried.

## Validation failure patterns

The 40 failed attempts include overlapping issues:
- Gemini quota/timeouts/model availability.
- Malformed/truncated JSON.
- Missing Arabic meanings or English examples.
- Missing or malformed options and answer explanations.
- Duplicate question prompts/options or answer text not matching an option.
- Empty practice question banks.
- Missing reading/listening comprehension questions.
- Game items that do not satisfy the supported playable multiple-choice schema.

Failed drafts are not promoted. They must be regenerated and pass validation.

A continuation trigger was committed on `main` at [4d0fb894](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/commit/4d0fb8949f2b9afa995def566cf28282413cc236), resuming from the saved cursor (index 6) with a 10-unit batch. At report time, the new run had not yet written a newer progress timestamp, so its start/completion is not claimed.

## Voice and provenance limitations

- Sampled Primary 1 Unit 2 and Unit 3 drafts have all nine sections and valid page references, but dialogue turns are marked `speakerGender: unknown`; no gender-matched voice is claimed for those turns.
- The app queries native Android voices through `TextToSpeech.getSupportedVoices()` and browser voices through `speechSynthesis.getVoices()`. It identifies gender only when the voice name/URI explicitly contains `male` or `female`; unknown voices are never assigned to a gendered role.
- Separate male/female voice selectors are present and save preferences. Dialogue replay is sequential. Speaking practice calls `stopAudio()` before opening speech recognition, preventing TTS and microphone capture from intentionally running together.
- If no verified matching voice is exposed, the app uses the platform default and explicitly warns that gender matching is unverified. A sampled Preparatory 3 dialogue has male/female labels, but no actual Android device voice test has been completed.
- The content validator checks the declared `origin` and page range but does not independently prove that every item marked `source` is an exact transcription. Teacher/source review remains mandatory.
- Listening scripts must remain clearly supplementary when no printed transcript exists.

## Next work

1. Continue from the saved batch cursor and retry eligible candidates with the configured Gemini fallback models.
2. Resolve the 59 source/OCR blockers using page-image review; do not infer missing text.
3. Process the assessment PDFs and the separate reader through dedicated extraction and indexing workflows.
4. Review and approve drafts before any student-workspace integration.
5. Verify TTS voice matching on Android and verify the speaking/listening UI, games, and tests at runtime.

## Repository records

- [Source book index](../data/curriculum/source-book-index.draft.json)
- [Batch progress](../artifacts/unit-drafts/progress.json)
- [Resumable batch state](../artifacts/unit-drafts/batch-state.json)
- [Unit draft directory](../artifacts/unit-drafts/)
- [Generation workflow](../.github/workflows/generate-interactive-unit.yml)
