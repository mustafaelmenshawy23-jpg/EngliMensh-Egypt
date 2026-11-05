# Pass 17 — visual review of OCR quality candidates

- Workflow run: [42128477043](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/42128477043) — completed successfully.
- Artifact: `englimensh-pass17-quality-240dpi` — 20 page renders from 10 source books at 240 DPI.
- Review dataset: `src/data/extracted/visual-recoveries-pass17.jsonl` — 20 candidate records.

## Findings

1. `Eng-L1-EB-Part1 (1).pdf` — PDF p.39: Unit 2 “Leisure Time” / Concept 2 “Experiences”; collage of leisure activities including digital media, art, basketball, guitar and hiking.
2. `Eng-L1-EB-Part1 (1).pdf` — PDF p.74: Unit 3 “Echoes of the Past” / Concept 3 “Identity”; student among museum displays.
3. `Eng-L1-EB-Part1 (1).pdf` — PDF p.102: Unit 4 “The Power of Choice” / Concept 4 “Consumption and Choice”; school/café and shopping scenes.
4. `Eng-L1-EB-Part2 (1).pdf` — PDF p.6: Unit 6 “The Space We Share” / Concept 6 “A World for All”; people cycling in a green park.
5. `Eng-L1-EB-Part2 (1).pdf` — PDF p.162: Rendered page is uniformly blank white; no text, illustration or printed page number visible.
6. `Eng-L2-EB-Part1 (1).pdf` — PDF p.4: Unit 1 “People & Friends”; two students working together at a desk.
7. `Eng-L2-EB-Part1 (1).pdf` — PDF p.37: Rendered page is uniformly blank white; no text, illustration or printed page number visible.
8. `Eng-L2-EB-Part1 (1).pdf` — PDF p.62: Lifestyle collage with labels “Exercise”, “Study & Learn”, “Family & Friends”, “Good Sleep”.
9. `English_1sec_t1 (1).pdf` — PDF p.121: “The Big Fish Bites”; fisherman in a small boat holding a fishing rod. Printed p.19.
10. `English_1sec_t1 (1).pdf` — PDF p.134: Story illustration of an older fisherman in a small sailing boat beside a very large fish.
11. `English_language_Sec3_tr1 (1).pdf` — PDF p.114: “Chapter 1”; two men facing one another at a waterfront town/harbour. Printed p.8.
12. `English_language_Sec3_tr1 (1).pdf` — PDF p.119: “A Treacherous Plot”; two men in period clothing at a harbour-side gathering. Printed p.13.
13. `English_language_Sec3_tr1 (1).pdf` — PDF p.129: “Betrayal and Arrest”; distressed man seated in a stone prison cell. Printed p.23.
14. `English_language_Sec3_tr1 (1).pdf` — PDF p.133: “The Prison of Château d’If”; young man meets elderly bearded man in a stone passage. Printed p.27.
15. `English_language_Sec3_tr1 (1).pdf` — PDF p.136: “Chapter 4”; elderly bearded man and young man in a stone passage. Printed p.30.
16. `English_Primary6_T1 (1).pdf` — PDF p.27: Lesson 3 “The Wonderful Nile River”; Nile in Cairo with sailboats and a prominent riverside tower/building.
17. `English_language_prep2_t1 (1).pdf` — PDF p.3: Rendered page is uniformly blank white; no text, illustration or printed page number visible.
18. `English_language_prep3_t1 (1).pdf` — PDF p.3: Rendered page is uniformly blank white; no text, illustration or printed page number visible.
19. `المعاصر_كونكت_بلس_1_ابتدائي_ترم_1_ذاكرولي1.pdf` — PDF p.69: “Writing Corner”; handwriting panels labelled ruler, pencil, pencil case, sharpener, eraser and whiteboard. Printed p.74.
20. `المعاصر_كونكت_بلس_2_ابتدائي_ترم_1_ذاكرولي.pdf` — PDF p.222: Unit 4: big/bigger, hot/hotter, fit/fitter; Unit 5: dolphin, phone, whale, wheel; Unit 6: glass, grass, cliff, coffee, shell, yellow. Printed p.228.

## Validation and limitations

- All 20 rendered images were visually inspected. There are 20 unique record IDs and 20 unique source-page pairs across 10 source books.
- Four pages (PDF pp.162, 37, and p.3 in each of the two preparatory source books) render as blank white pages; no content was inferred.
- Exact source filenames and 1-based physical PDF page numbers are preserved. Printed page numbers are recorded only where clearly visible.
- Every record remains `needs_review` and `not_academically_verified`.
- These are visual review candidates only. They do not overwrite machine OCR, `pages.jsonl`, or enter app curriculum/question-bank data. Academic verification is still required.
