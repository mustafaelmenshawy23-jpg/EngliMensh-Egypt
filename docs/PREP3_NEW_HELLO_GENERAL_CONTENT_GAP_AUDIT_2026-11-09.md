# Prep 3 New Hello (general track) — content gap audit
Date: 9 November 2026
Branch: `content-import/prep-new-hello-hello-plus`

## File and unit structure
The registered source is `content-imports/preparatory/new-hello/Prep_3_New_Hello_Units_1_to_6_Full_Curriculum.html`. The registry exposes six unit tabs from this combined file.

## Confirmed blocker
Units 3–6 currently call generic content generators:
- `generateUnitVocab` inserts placeholder Arabic meanings (`مفردة دراسية`), generic definitions, and identical classroom examples.
- `generateQuiz` inserts repeated placeholder stems and options such as “Correct Ministerial Option”.
- `generateReading` and `generateListening` create generic filler passages/dialogues and repeated questions.
These are not acceptable as completed curriculum content. The six unit tabs existing in the UI does not mean all six are content-complete.

Unit 1 and Unit 2 have authored vocabulary/reading/listening content, but their grammar banks contain repeated items and the Unit 1 exam bank uses generic placeholder questions. Those sections need a separate item-level review.

## Completed during this audit
- Removed 11 browser-injected temporary authentication scripts from the combined HTML source (10 matching the original marker form and one remaining variant).
- Added `scripts/validate-prep3-new-hello-security.mjs` to `npm test`. It fails if temporary injected authentication markers or token variables are reintroduced.

## Required remaining work
1. Replace generated placeholder content in Units 3–6 with unit-specific vocabulary, Arabic meanings, explanations, examples, grammar guides, MCQs, reading passages and listening dialogues.
2. Replace repeated grammar items and generic exam questions in Units 1–2.
3. Verify every answer key against the actual question and make all assessment items MCQ-only.
4. Compare the finished material with readable official textbook pages before labelling it official.

## Security note
The removed browser-injected script contained temporary authentication material. The file in the current branch no longer contains those markers. Because credentials/tokens may remain in Git history, the project owner should review the originating Firebase/Gemini session and revoke or rotate any exposed temporary credential where applicable. Do not reuse that token.


## Follow-up correction — 9 November 2026
- Removed unsupported wording that described the generated vocabulary, reading and exam practice as official or ministry-accredited. The generated reading is now labelled supplementary and pending textbook verification; the exam subtitle no longer claims alignment with ministry specifications.
- Reworded the generated vocabulary description and answer explanation so they do not imply official approval.
- **This is a wording/safety correction only. It does not resolve the curriculum-content blocker above.** Units 3–6 still use generic generated MCQs, reading and listening material; the vocabulary meanings/examples still require proper authored replacement. Units 1–2 still require item-level grammar/exam repair.
- Latest validation workflow for the follow-up source wording commit: run `42564641679` is in progress at the time of this report update. Do not treat it as passed until its conclusion is success.
