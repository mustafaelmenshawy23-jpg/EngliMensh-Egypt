# OCR Quality Audit — Pass 11

## Source artifact and scope

This audit uses the completed extraction artifact from GitHub Actions run **42090067057** (artifact `englimensh-extracted-books`, generated 2026-11-05). The manifest records 5,626 physical PDF pages across 34 listed books: 33 processed and one postponed LFS pointer. Tesseract OCR at 150 DPI produced text for 4,038 pages; 73 pages remained empty/manual-review candidates. The manifest explicitly says printed page numbers are null unless independently verified and all output remains `needs_review`.

This is a quality audit of the machine output, not a new OCR run and not a curriculum approval.

## Confirmed OCR incompleteness against existing visual candidates

Eight pages already manually inspected in Pass 7 were cross-checked against their machine-extracted page records. The machine output is materially incomplete on all eight:

| Source filename | PDF page | Machine OCR excerpt | Existing visual candidate |
|---|---:|---|---|
| `English_language_prim2_t1 (1).pdf` | 32 | `32` | Classroom Actions vocabulary |
| `English_language_prim3_t1 (1).pdf` | 45 | `UNIT ®` | Picture-listening activity and printed labels |
| `English_language_prim3_t1 (1).pdf` | 69 | `bored 69` | Feelings vocabulary and pair dialogue |
| `English_prim1_t1_Assmt (1).pdf` | 42 | `Weekly Assessment` | Picture-based assessment; ambiguous printed strings intentionally preserved |
| `English_Primary6_T1 (1).pdf` | 86 | `hallway pipe drop` | Nine-item water vocabulary page |
| Connect Plus Primary 1 (`المعاصر_كونكت_بلس_1_ابتدائي_ترم_1_ذاكرولي1.pdf`) | 42 | `corner ilies` | Family vocabulary list |
| same | 86 | `91` | OW/OA/O-E phonics patterns and examples |
| same | 270 | empty | Six-unit phonics reference chart |

**Handling:** the original machine records remain untouched. Their related manual visual candidates remain supplemental and `needs_review`. The candidate transcriptions must not be treated as approved or inserted into question banks automatically.

## Additional short/fragmentary OCR candidates

The JSONL sidecar records 20 further pages where OCR is short or visibly fragmented despite capturing an activity instruction, vocabulary prompt, or assessment task. These are prioritized for original-page rendering and comparison, not automatically declared failures:

- Official Primary 1: `English_language_prim1_t1.pdf`, pp.13, 30, 69, 78, 82, 99, 102, 108.
- Official Primary 2: `English_language_prim2_t1 (1).pdf`, pp.9, 15, 90.
- Official Primary 3: `English_language_prim3_t1 (1).pdf`, pp.21, 41, 44.
- Official Primary 4: `English_language_prim4_t1 (1).pdf`, p.76.
- Primary 1 assessment: `English_prim1_t1_Assmt (1).pdf`, pp.10, 15, 19, 35, 50.

Short text alone does not prove OCR loss: some pages may be sparse, image-led, or contain only a short instruction. Each page must be visually checked before recovery.

## Files and record policy

- `src/data/extracted/ocr-quality-audit-pass11.jsonl` contains 27 provenance-linked audit records: 8 direct comparisons and 19 short/fragmentary OCR candidates.
- Each record includes exact source filename, `public/books/` path, and 1-based physical PDF page.
- All records remain `needs_review`.
- This sidecar does not alter `pages.jsonl`, source PDFs, OCR text, or answer keys.
- No inferred answers, missing word completions, printed page numbers, or curriculum text have been added.
- `Performance Tasks Prep 2-OnlineMaterials.PDF` remains postponed and excluded.

## Next quality-control step

Render the 19 additional candidates from their original PDFs and inspect at page level. Only transcribe what is visibly legible, preserve uncertain strings literally, and link each candidate to the exact page. If original PDF bytes are not available to the workflow, stop and report that limitation rather than guessing from OCR fragments.
