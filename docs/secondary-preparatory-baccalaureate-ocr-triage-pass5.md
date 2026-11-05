# Remaining Secondary, Preparatory, and Baccalaureate OCR Triage — Pass 5

**Repository:** `mustafaelmenshawy23-jpg/EngliMensh-Egypt`  
**Branch:** `main`  
**Source:** workflow #9 extracted artifact, `pages.jsonl`  
**Status:** technical triage only. All source page records remain `needs_review`.

## Scope

This pass inspected the exact flagged page numbers already listed in `docs/ocr-manual-review-queue.md` for the secondary/preparatory and Baccalaureate books. It examined extracted text snippets only; it did not visually inspect the original PDF page images. Therefore it does not certify blank pages or approve OCR text.

## 1. Pages with no extracted text

| Source PDF | PDF pages | Finding from extraction |
|---|---:|---|
| `English_1sec_t1 (1).pdf` | 101, 104 | Empty OCR text; page images must be checked |
| `English_language_2sec_t1 (1).pdf` | 59, 92 | Empty OCR text; page images must be checked |
| `English_language_prep2_t1 (1).pdf` | 3 | Empty OCR text; page image must be checked |
| `English_language_prep3_t1 (1).pdf` | 3 | Empty OCR text; page image must be checked |
| `English_language_Sec3_tr1 (1).pdf` | 108, 153, 254, 285 | Empty OCR text; page images must be checked |
| `English_Prep1_T1 (1).pdf` | 3 | Empty OCR text; page image must be checked |
| `Eng-L2-EB-Part1 (1).pdf` | 37, 62, 96 | Empty OCR text; page images must be checked |
| `Eng-L1-EB-Part1 (1).pdf` | 2 | Empty OCR text; page image must be checked |
| `Eng-L1-EB-Part2 (1).pdf` | 2, 162 | Empty OCR text; page images must be checked |

**Important:** empty OCR is not evidence that the original page is blank. No page in this table is marked blank.

## 2. Non-empty flagged pages — extraction snippets

| Source PDF | PDF page | Extracted snippet / structural clue | Next action |
|---|---:|---|---|
| `English_1sec_t1 (1).pdf` | 128 | “Chapter 4” and page marker 26 | Check whether this is a story/reader page; compare adjacent pages |
| same | 134 | “Chapter 5” | Check story structure and page sequence |
| `English_language_Sec3_tr1 (1).pdf` | 114 | “Chapter 1” and page marker 8 | Inspect page layout and surrounding story section |
| same | 122 | “Chapter 2” and page marker 16 | Inspect page layout and surrounding story section |
| same | 136 | “Chapter 4” and page marker 30 | Inspect page layout and surrounding story section |
| same | 281–283 | “Notes” | Likely note/template pages, but confirm from original page images before structural classification |
| `Eng-L1-EB-Part1 (1).pdf` | 39 | “Leisure Time” | OCR fragment appears to be a section/unit heading; compare with contents map |
| same | 74 | “Echoes of the Past” | OCR fragment appears to be a section/unit heading; compare with contents map |
| same | 102 | “The Power of Choice” | OCR fragment appears to be a unit heading; compare with contents map |
| `Eng-L1-EB-Part2 (1).pdf` | 6 | “The Space We Share” | OCR fragment appears to be a unit heading; compare with contents map |

These snippets are not full transcriptions and should not be used as lesson/question content without checking the original pages.

## 3. OCR recovery priorities

1. **High priority:** empty pages in official Student’s Books and Baccalaureate materials where the page may contain lesson content, diagrams, tables, or activities.
2. **Medium priority:** flagged story/reader pages in Secondary 1 and Secondary 3; preserve chapter continuity and page references.
3. **Structural classification:** “Notes” pages only after visual confirmation; preserve them as templates rather than discarding them.
4. **Baccalaureate contents reconciliation:** compare the fragments on Part 1 pp.39, 74, 102 and Part 2 p.6 with the contents pages, but do not infer missing headings or page starts.

## 4. What has not changed

- The original PDF is still the only source of truth.
- Every record retains its original source filename and 1-based PDF page number.
- OCR output remains `needs_review`.
- No blank-page status was assigned from empty OCR alone.
- No vocabulary, grammar, reading passage, or question was promoted into the application.
- The missing LFS object remains deferred until the 33 available books have been completed.

## Next pass

Render the page images for the empty-text pages above, starting with official Student’s Books. Record each visual finding and only then decide whether the page needs OCR retry, manual transcription, or a structural page type.
