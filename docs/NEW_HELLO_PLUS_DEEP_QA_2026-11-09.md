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

1. **Prep 1 Plus also contains repeated practice items inside every unit.** Each unit's 30-question vocabulary quiz has only 27 distinct prompts (3 duplicates), and each 30-question grammar quiz has only 20 distinct prompts (10 duplicates). This does not by itself prove the repeated items are incorrect, but the advertised question count overstates the number of distinct practice questions and requires editorial review.
2. **Prep 2 Plus grammar bank is duplicated verbatim across all six units.** Each file contains 30 grammar questions, but the complete `grammarQuizData` array is byte-for-byte identical in Units 1–6. The bank itself mixes several unrelated topics (including Past Continuous, modals, Second Conditional, gerunds/infinitives, passive voice, and used to), rather than providing the unit-specific practice implied by the unit topic map. Do not accept the repeated bank as six completed units.
3. **Prep 3 Plus has severe repeated placeholder-style assessment items.** Each unit's 30-question vocabulary quiz uses the same generic “Which term best matches the visual illustration” prompt 30 times (the unit theme is substituted, but no individual word is asked for). The 20-question unit exam contains only 6–7 distinct prompts; a generic “Identify the word illustrated” prompt is repeated 10 times, while several grammar questions are copied into the exam. The grammar bank has only 10 distinct prompts repeated three times within each 30-question array, and that entire array is repeated unchanged across Units 1–6. These are not 30 unique vocabulary questions or 30 unique grammar questions.
4. **No dedicated learner speaking activity was verified in the 18 supplied HTML files.** The word “speaking” appears only in ordinary vocabulary/examples, dialogue text, or grammar options (for example, “is speaking”); those occurrences are not speaking tasks. No microphone capture or speaking assessment flow was found.
5. **No dedicated game activity was identified in any of the 18 files.** The source inventory should not claim that games are supplied by these files. App-level game templates may be separate, but they must be connected to unit-specific learning objectives and tested.
6. **No native recorded audio was found.** None of the 18 files contains an `<audio>` element. The pages use browser/device speech synthesis for reading/listening playback. There is no `getUserMedia` or `MediaRecorder` implementation in these HTML sources. Do not label synthesized playback as native/recorded listening audio or speaking assessment.
7. **All 18 files reference Google Fonts over the network.** The generated viewer copy removes remote font links, but the original HTML remains network-dependent if opened directly. Offline checks must include every other external asset/script as well.
8. **Official-source alignment remains unverified, and the repository PDFs are currently Git LFS pointers rather than readable PDFs through the repository file endpoint.** The relevant stored objects are large: Prep 1 Hello Plus 64.8 MB, Prep 2 Hello Plus 109.6 MB, Prep 3 Hello Plus 379.1 MB; the general Prep 1/2/3 English books are also LFS pointers (about 86.7/92.7/87.8 MB). The GitHub file fetch returns only the LFS pointer metadata, not the book pages. The HTML files contain Ministry/official curriculum wording, but that does not substitute for checking every word, translation, grammar explanation, passage, question, answer key, or assessment against the corresponding official student book/teacher guide. Do not infer official approval from labels inside the HTML.

## Required remediation before this pathway can be marked complete

- Remove duplicated Prep 1 Plus vocabulary/grammar prompts and ensure every retained question adds a distinct learning check.
- Replace Prep 2 Plus and Prep 3 Plus duplicated grammar banks with unit-specific, non-repeated questions checked against the official grammar scope and answer keys. Prep 3 Plus must contain 30 genuinely distinct items if 30 are retained.
- Rebuild Prep 3 Plus vocabulary quizzes and unit exams so each question targets a specific word or learning objective, not a generic illustration placeholder; remove duplicated prompts and ensure 20/30 questions are genuinely distinct if those counts are retained.
- Add or explicitly document a learner speaking activity for every unit; make it usable without microphone permission where appropriate, and do not claim speech assessment unless recording/recognition is implemented and tested.
- Add unit-linked game activities or connect the app's existing game templates to each unit's actual vocabulary/grammar; test scoring and answer feedback.
- Verify whether recorded listening audio is required by the official materials. If no authorized audio is supplied, label TTS as a playback aid and keep transcripts optional.
- Audit all options for exactly one defensible correct answer; all learner questions must remain multiple-choice as requested.
- Make the actual LFS PDF objects available to the review workflow (or provide accessible source page exports), then cross-check the full content against official source pages and retain source-page references for each approved unit.
- Run Android WebView and offline tests for all 18 units before release.

## Status

The 18 HTML files are present and their assessment-array counts have been inventoried. The corresponding official PDFs are tracked as Git LFS objects and were not readable from the repository content endpoint in this audit. **New Hello Plus is not academically complete or release-ready.** The repeated items in Prep 1 Plus, duplicated grammar banks in Prep 2 Plus and Prep 3 Plus, placeholder-style Prep 3 Plus vocabulary quizzes/exams, absent dedicated speaking and game content, and unverified source alignment are explicit blockers. Original imported HTML files were not modified by this audit.
