# Visual OCR Review — Pass 10: Additional unit and section metadata

## Scope

This pass revisits the 73-page visual-review artifact from workflow run #1 using its contact sheets and page-level 120-DPI images. It records additional visible titles and document structures that were not represented as distinct records in the earlier pass-7/pass-8/pass-9 datasets.

- Page numbers are 1-based physical PDF page numbers.
- Every record retains the exact source filename and `public/books/` path.
- The new JSONL file is `src/data/extracted/visual-assets-pass10.jsonl`.
- All records remain `needs_review`; these are visual metadata candidates, not academic approvals or lesson-text transcriptions.

## Newly captured titles

| Source filename | PDF page | Visible title(s) |
|---|---:|---|
| `Eng-L1-EB-Part1 (1).pdf` | 39 | Concept 2 — Experiences; Unit 2 — Leisure Time |
| same | 74 | Concept 3 — Identity; Unit 3 — Echoes of the Past |
| same | 102 | Concept 4 — Consumption and Choice; Unit 4 — The Power of Choice |
| `Eng-L1-EB-Part2 (1).pdf` | 6 | Concept 6 — A World for All; Unit 6 — The Space We Share |
| `English_language_prim1_t1.pdf` | 1 | English — Primary 1 — Term 1 cover |
| Connect Plus Primary 1 | 103 | Theme 2 — The world around me |
| Connect Plus Primary 2 | 121 | Theme 2 — The world around me |
| Connect Plus Primary 4 | 8 | Theme 1 — I discover myself |
| same | 117 | Theme 2 — Myself and others |
| Connect Plus Primary 5 | 7 | Theme 1 — I discover myself |
| Connect Plus Primary 6 | 92 | Theme 2 — Myself and others |
| El-Moasser Hello Plus Prep 1 | 292 | A Week is Enough |
| same | 370 | Master Your Skills |

The exact source filenames for the commercial supplements are preserved in the JSONL records; the short names in this table are display labels only.

## Visual interpretation and restrictions

- Concept/theme openers carry useful unit or theme metadata even when body-text OCR is empty.
- Hello Plus pages 292 and 370 are illustrated section covers, not lesson pages. Their headings should be retained as document structure and must not be converted into lesson paragraphs.
- The Primary 1 official cover is metadata, not curriculum content.
- Previously indexed story illustrations, the Primary 6 water poster, Connect Plus reader title pages, and the Pass 9 phonics chart are not duplicated here.
- The visual transcription does not infer any content from pictures, audio mappings, answer keys, or adjacent pages.
- No record is promoted to `approved`; no machine OCR output is overwritten.

## Remaining verification

The blank/low-content pages identified in prior passes remain candidates until checked against source PDFs and adjacent pagination. The 73-page visual queue remains a triage set, not a claim that all 73 pages are missing lesson text. The postponed `Performance Tasks Prep 2-OnlineMaterials.PDF` remains excluded.
