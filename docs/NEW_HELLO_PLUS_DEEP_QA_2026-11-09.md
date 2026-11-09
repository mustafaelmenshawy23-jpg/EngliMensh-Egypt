# New Hello Plus deep structural QA — 9 November 2026

Branch: `content-import/prep-new-hello-hello-plus`

Scope: all 18 imported New Hello Plus HTML files (six units for each preparatory grade). This is a structural/content-integrity audit, not an official-source approval.

## Verified assessment inventory

| Grade | Unit | Vocabulary cards | Vocabulary MCQs | Grammar MCQs | Reading MCQs | Listening MCQs | Unit exam MCQs |
|---|---:|---:|---:|---:|---:|---:|---:|
| Prep 1 Plus | 1–6 | 22 each | 30 each | 30 each | 5 each | 5 each | 20 each |
| Prep 2 Plus | 1–6 | 25 each | 25 each | 30 each | 5 each | 5 each | 20 each |
| Prep 3 Plus | 1–6 | 22 each | 30 each | 30 each | 5 each | 5 each | 20 each |

Counts above were read from the embedded data arrays in each of the 18 HTML files. They do not establish that every question is correct, unique, aligned to the unit, or sourced from the official book.

## Confirmed high-priority defects / gaps

1. **Prep 2 Plus grammar bank is duplicated verbatim across all six units.** Each file contains 30 grammar questions, but the complete `grammarQuizData` array is byte-for-byte identical in Units 1–6. This means the six units do not have distinct grammar practice banks. Do not accept the repeated bank as six completed units.
2. **Prep 3 Plus grammar bank is also duplicated verbatim across all six units.** The same 30-question `grammarQuizData` array appears in every unit. This is a separate pathway-wide duplication blocker.
3. **Speaking coverage is incomplete in the supplied HTML.** Speaking-related markup/text was found in Prep 1 Plus Units 1–3 and Prep 2 Plus Units 1–6; it was not found in Prep 1 Plus Units 4–6 or any Prep 3 Plus unit. Presence of a word or section reference is not proof of an interactive speaking task; actual task quality and execution still need review.
4. **No dedicated game activity was identified in any of the 18 files.** The source inventory should not claim that games are supplied by these files. App-level game templates may be separate, but they must be connected to unit-specific learning objectives and tested.
5. **No native recorded audio was found.** None of the 18 files contains an `<audio>` element. The pages use browser/device speech synthesis for reading/listening playback. There is no `getUserMedia` or `MediaRecorder` implementation in these HTML sources. Do not label synthesized playback as native/recorded listening audio or speaking assessment.
6. **All 18 files reference Google Fonts over the network.** The generated viewer copy removes remote font links, but the original HTML remains network-dependent if opened directly. Offline checks must include every other external asset/script as well.
7. **Official-source alignment remains unverified.** The files contain Ministry/official curriculum wording, but this audit did not verify each word, translation, grammar explanation, passage, question, answer key, or assessment against the corresponding official student book/teacher guide. Do not infer official approval from labels inside the HTML.

## Required remediation before this pathway can be marked complete

- Replace Prep 2 Plus and Prep 3 Plus duplicated grammar banks with unit-specific questions checked against the official grammar scope and answer keys.
- Add or explicitly document the intended speaking activity for every unit; make the activity usable without microphone permission where appropriate, and do not claim speech assessment unless recording/recognition is implemented and tested.
- Add unit-linked game activities or connect the app's existing game templates to each unit's actual vocabulary/grammar; test scoring and answer feedback.
- Verify whether recorded listening audio is required by the official materials. If no authorized audio is supplied, label TTS as a playback aid and keep transcripts optional.
- Audit all options for exactly one defensible correct answer; all learner questions must remain multiple-choice as requested.
- Cross-check the full content against official source pages and retain source-page references for each approved unit.
- Run Android WebView and offline tests for all 18 units before release.

## Status

The 18 files are present and their assessment-array counts have been inventoried. **New Hello Plus is not academically complete or release-ready.** The duplicated grammar banks in Prep 2 Plus and Prep 3 Plus, missing speaking coverage, absent dedicated game content, and unverified source alignment are explicit blockers. Original imported HTML files were not modified by this audit.
