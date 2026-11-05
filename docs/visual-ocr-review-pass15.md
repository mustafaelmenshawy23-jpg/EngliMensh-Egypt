# Pass 15 — visual review of OCR quality candidates

- Workflow run: [42126404771](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/42126404771)
- Rendered artifact: `englimensh-pass15-quality-240dpi` (20 pages, 14 source books, 240 DPI).
- Visual review dataset: `src/data/extracted/visual-recoveries-pass15.jsonl` (20 records).
- Physical PDF page numbers are 1-based and kept separate from printed page numbers.

## Review findings

All 20 rendered pages were visually inspected against the source images.

1. Eng-L1-EB Part 1, PDF p.12: Concept 1 “Well-being”; Unit 1 “Living Well in a Complex World” illustrated opener.
2. Official Secondary 2, PDF p.30: Unit 3 “Sustainable Development Goals (SDG)” photographic opener.
3. Official Primary 5, PDF p.22: Unit 1 Lesson 5 “My Restaurant Flyer!” blank flyer template.
4. Official Primary 3, PDF p.83: Lesson 1 “Teamwork & Chores”; picture vocabulary clean, tidy up the bed, share, care.
5. Official Secondary 3, PDF p.107: “The Count of Monte Cristo” title page, 3rd Sec, 1st Term.
6. Official Primary 4 assessment, PDF p.1: “English Language Performance Tasks and Assessments”, First Term cover.
7. Official Primary 5 assessment, PDF p.2: grayscale “English Language Performance Tasks and Assessments”, First Term cover.
8. Connect Plus Primary 3, PDF p.124: Theme 2 “The world around me (Taking care of our world)” opener.
9. Connect Plus Primary 3, PDF p.244: Fiction Reader “Fares and the Fish” / “فارس والسمكة” illustrated title page.
10. Official Primary 2, PDF p.85: “Draw your own home and label the rooms” blank drawing activity.
11. Connect Plus Primary 2, PDF p.292: General Revision picture-word vocabulary panels for Units 4–6. The left edge is partly clipped; the obscured label is not reconstructed.
12. Connect Plus Primary 2, PDF p.284 (printed p.290): “Dictation on lessons 2 & 3”, Unit 6; prompts meal, hotel, garden, island, train, library. The grid is rotated in the source scan.
13. Official Primary 3, PDF p.94: “I Help My Community!” picture-led page; captions about Ahmed and Mariam donating clothes and Laila planting a tree.
14. Official Primary 3, PDF p.100: “My Goal, My Dream”; vocabulary/listening prompts goal, try, step, plan.
15. Connect Plus Primary 1, PDF p.109: Theme 2, Unit Four “Writing Corner” section page in the Homework Interactive notebook.
16. Third Primary assessment book, PDF p.40 (printed p.40): sentence-reordering task with 11 scrambled-word items; answer lines remain blank.
17. Connect Plus Primary 5, PDF p.173: Fiction Reader “Jubari searches for home” illustrated title page.
18. Connect Plus Primary 1, PDF p.213 (printed p.218): “Look and listen” story dialogue; visible lines include “Yes! We can help!” and “Oh, no! It’s my cake.” Bottom word strip: yes / can / my with Arabic glosses.
19. Story-En-EB L1, PDF p.23: “The Lost World”, Chapter 4 “Into the Unknown” illustrated chapter opener.
20. Story-En-EB L1, PDF p.16: “The Lost World”, Chapter 3 “The Expedition Is Chosen” illustrated chapter opener.

## Interpretation and limitations

- Several low-text OCR candidates are structural unit/theme openers, covers, blank activity templates, fiction title pages, or illustrated chapter openers—not missing prose.
- The two assessment/worksheet pages contain unanswered prompts. No sentence answers, missing words, or answer keys were inferred.
- The Connect Plus Primary 2 General Revision page has a clipped left edge; uncertain/obscured text remains untranscribed.
- The dictation grid on Connect Plus Primary 2 PDF p.284 is rotated. Picture prompts are recorded, but incomplete and scrambled strings are not normalized into answers.
- The illustrated story page records only clearly readable dialogue and vocabulary-strip items; it does not claim to recover the associated audio.

## Validation status

- 20 unique recovery record IDs; 20 unique source-page pairs; 14 source books.
- Every record preserves the exact source filename and 1-based physical PDF page.
- Every record remains `reviewStatus: needs_review` and `academicStatus: not_academically_verified`.
- These are visual recovery candidates only. They do not overwrite `pages.jsonl`, certify academic accuracy, or automatically enter app lesson/question-bank data.
