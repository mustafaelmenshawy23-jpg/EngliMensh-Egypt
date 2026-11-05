# Pass 16 — visual review of OCR quality candidates

- Workflow run: [42127499147](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/42127499147)
- Rendered artifact: `englimensh-pass16-quality-240dpi` (20 pages, 9 source books, 240 DPI).
- Visual review dataset: `src/data/extracted/visual-recoveries-pass16.jsonl` (20 records).
- Physical PDF page numbers are 1-based and kept separate from printed page numbers.

## Review findings

All 20 rendered pages were visually inspected against the source images.

1. Official Primary 3, PDF p.39: Lesson 4 “Jobs in My Family”; picture vocabulary farmer, doctor, teacher, baker, pilot.
2. Official Primary 3, PDF p.68: Lesson 1 “How We Feel”; emotion words happy, sad, excited, angry.
3. Official Primary 3, PDF p.112: draw-yourself-practicing activity with sentence frame “I practiced ___ and felt proud.”
4. Official Primary 4, PDF p.72: Unit 4 place-description writing template with title/date and prompts about describing the place and why people should visit.
5. Official Primary 4, PDF p.53: conclusion writing prompt about what will happen if “we don’t save it”, followed by a blank animal drawing activity.
6. Official Primary 4, PDF p.112: Review 2 story-elements organizer (Moral, Setting, Characters) and a new-ending prompt beginning “Wanda’s family didn’t move to the big city...”.
7. Official Primary 5, PDF p.93: Story Vocabulary picture cards: canoe, The Earth, Everglades, alligator, owl, National Park, shell, scientist, swamp, splash.
8. Official Primary 1 assessment, PDF p.64 (printed p.63): General Revision picture-word exercise with 24 numbered images and blank answer lines.
9. Official Primary 1 assessment, PDF p.11 (printed p.10): Unit 1 Weekly Assessment (C), picture-supported unscramble and write, plus a look-and-write item.
10. Official Primary 1 assessment, PDF p.32 (printed p.31): Unit 2 Weekly Assessment (C), unscramble-and-write and count-and-write picture prompts, including butterflies and a bird.
11. Official Primary 2 assessment, PDF p.23 (printed p.22): Weekly Assessment (C), look-and-write pictures (tent, cup) and count-and-write pictures (eraser, books, cups).
12. Official Primary 2 assessment, PDF p.37 (printed p.36): Homework tracing and matching task for grandmother, father, brother, and mother.
13. Official Primary 2 assessment, PDF p.34 (printed p.33): nine picture prompts for writing a sentence under each picture.
14. Official Primary 4 assessment, PDF p.57 (printed p.56): classroom-performance quotation attribution and two home-performance comprehension questions about Wanda and the story.
15. Official Primary 5 assessment, PDF p.59 (printed p.58): five sentence-reordering homework prompts.
16. Official Primary 5 assessment, PDF p.55 (printed p.54): five statements for punctuation practice about helping others, water, living things, and resources.
17. Connect Plus Primary 2, PDF p.281 (printed p.287): “Dictation on lessons 9 & 10”; picture prompts yacht, canoe, ferry, ship, vet, wild. Rotated grid; incomplete letter strings are not treated as answers.
18. Connect Plus Primary 2, PDF p.285 (printed p.291): “Dictation on lessons 4, 5”; picture prompts wood, metal, cliff, stone, plastic, paper. Rotated grid; incomplete letter strings are not treated as answers.
19. Connect Plus Primary 2, PDF p.193 (printed p.199): Lessons 2 & 3 vocabulary page with the International Park, hotel, garden, meals, play tennis, island, library, train, and board game; several Arabic glosses are visible.
20. Connect Plus Primary 3, PDF p.71 (printed p.75): Lesson 6 phonics page contrasting long “oo” and short “oo”; visible examples include tool, mood, moon, room, food, roof, book, foot, cook, wood, and good.

## Interpretation and limitations

- The official textbook pages include vocabulary cards, drawing/writing frames, story organizers, and illustrated activity layouts. These are not missing continuous prose.
- Assessment pages contain blank prompts and picture-based questions. No answers or answer keys were inferred.
- The two Connect Plus Primary 2 dictation grids are rotated in the source scan. Picture labels are recorded, but incomplete/scrambled letter strings are not normalized into completed words.
- The Connect Plus vocabulary and phonics pages include Arabic glosses; only clearly readable English labels are summarized here.
- The 24-image General Revision page is described by its visible picture subjects; no target vocabulary answers are supplied because the page itself provides no labels.

## Validation status

- 20 unique recovery record IDs; 20 unique source-page pairs; 9 source books.
- Every record preserves the exact source filename and 1-based physical PDF page.
- Every record remains `reviewStatus: needs_review` and `academicStatus: not_academically_verified`.
- These are visual recovery candidates only. They do not overwrite `pages.jsonl`, certify academic accuracy, or automatically enter app lesson/question-bank data.
