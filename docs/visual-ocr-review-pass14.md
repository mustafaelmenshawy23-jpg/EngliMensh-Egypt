# Pass 14 — visual review of OCR quality candidates

- Workflow run: [42125253453](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/42125253453)
- Rendered artifact: `englimensh-pass14-quality-240dpi` (20 pages, 9 source books, 240 DPI).
- Visual review dataset: `src/data/extracted/visual-recoveries-pass14.jsonl` (20 records).
- Physical PDF page numbers are 1-based and are kept separate from printed page numbers.

## Review findings

The 20 candidates were visually inspected against their rendered source pages.

1. Connect Plus Primary 4, PDF p.251: illustrated “El-Moasser Homework Interactive” cover; structural page, not lesson text.
2. Hello Plus Prep 3, PDF p.310: ruled Notes page; no lesson text.
3. Connect Plus Primary 6, PDF p.12: Theme 1 “I discover myself” opener.
4. Connect Plus Primary 2, PDF p.244: repeated “El-Moasser Homework Interactive” cover.
5. Connect Plus Primary 1, PDF p.236 (printed p.241): “Dictation on lesson 8”, Unit 3; prompts yellow, boat, coat, rope, nose, throw; Read / Complete / Unscramble / Write grid.
6. Official Primary 1 assessment, PDF p.1: “Primary 1 English Language Performance Tasks and Assessment”, First Term cover.
7. Hello Plus Prep 1, PDF p.246: “The Prince and the Pauper”, Unit Six, Part (A), by Mark Twain; illustrated reader title page.
8. Connect Plus Primary 1, PDF p.228 (printed p.233): “Dictation on lesson 8”, Unit 2; prompts ship, chair, child, teacher, short, shake hands.
9. Hello Plus Prep 3, PDF p.293: Part Two “Skills” divider; Speaking, Reading, Writing skill sections and page references.
10. Connect Plus Primary 1, PDF p.233 (printed p.238): “Dictation on lessons 2 & 3”; prompts letter, read, write, sleep, listen, sing.
11. Connect Plus Primary 2, PDF p.273 (printed p.279): “Dictation on lessons 5 & 6”; weather prompts sunny, cloudy, foggy, snowy, windy, rainy.
12. Connect Plus Primary 1, PDF p.112 (printed p.117): Lessons 2 & 3 Animals / Reading vocabulary; verbs, colors, and extra vocabulary with Arabic glosses.
13. Eng-L1-EB Part 2, PDF p.40: Concept 7 “Passion & Purpose”, Unit 7 “Discovering Your Passion”.
14. Eng-L1-EB Part 2, PDF p.126: Concept 10 “Invisible Consumption”, Unit 10 “Behind the Buy”.
15. Hello Plus Prep 1, PDF p.372: Part One “Skills” divider; Speaking, Reading, Writing.
16. Connect Plus Primary 1, PDF p.130 (printed p.135): Lesson 9 phonics; ai /eɪ/ (rain, tail), ay /eɪ/ (play, hay), a-e /eɪ/ (cake, gate).
17. Official Primary 4, PDF p.96: Unit 6 Story Vocabulary; dress, closet, playground, competition, drawings, medal, sign, letter, announce, winner.
18. Connect Plus Primary 1, PDF p.178 (printed p.183): “Writing Corner”; six writing frames labelled beach, forest, desert, museum, hotel, city.
19. Connect Plus Primary 1, PDF p.207: “The Little Red Hen”, by Mary Harrington; illustrated story page.
20. Hello Plus Prep 3, PDF p.254: Unit Six “The Prisoner of Zenda”, by Anthony Hope; illustrated reader title page.

## Interpretation and limitations

- Several poor OCR pages were actually structural covers, Notes pages, section dividers, or illustrated reader title pages. They should not be treated as missing lesson prose.
- The dictation grids contain printed picture prompts and incomplete/scrambled letter strings. The visual review records the prompts and layout but does not solve, normalize, or replace the source strings.
- The vocabulary and phonics items are recorded as visible page content only. They have not been checked against the official curriculum or an answer key.
- Small captions embedded in illustrations and any uncertain letter fragments were not reconstructed.
- The visual recovery JSONL contains 20 records; every record remains `reviewStatus: needs_review` and `academicStatus: not_academically_verified`.
- No machine-generated `pages.jsonl` text was overwritten, and no academic approval is claimed.

