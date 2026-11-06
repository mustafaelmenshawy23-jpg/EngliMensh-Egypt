# EngliMensh-Egypt — Site completion roadmap

**Working branch:** `main`  
**Scope:** the 33 indexed source books only. The excluded 34th book is out of scope.  
**Source integrity:** files under `public/books/` are immutable. Never rename, recompress, replace, or rewrite them.

## Completion standard

The site is complete only when a learner can reliably move from stage to grade to pathway to source book to unit to lesson/activity; every published academic item has a verified source filename and physical PDF page; no unreviewed OCR/transcription is presented as approved teaching content; and the production build, navigation, source links, and data-integrity checks pass.

## Phase 0 — Baseline and safeguards

- [x] Confirm repository and target branch.
- [x] Confirm the indexed source set contains 33 books.
- [x] Confirm the source-review policy and immutable-PDF rule.
- [x] Confirm the latest validation workflow succeeds.
- [x] Confirm the latest Pages deployment workflow succeeds.
- [ ] Verify the deployed site in a real browser/device; automated deployment success is not a visual/runtime test.

## Phase 1 — Navigation and catalogue

- [x] Render stage, grade, and pathway selectors from curriculum data.
- [x] Connect indexed source books to grade/pathway selection.
- [x] Keep official curriculum pathways separate from commercial supplementary references.
- [x] Provide original-PDF preview and indexed unit-page links where a page is known.
- [ ] Complete responsive, keyboard, and screen-reader checks.
- [ ] Verify every stage/grade/pathway combination against the source index.
- [ ] Resolve missing unit start pages only when supported by source evidence.

## Phase 2 — Source-linked lesson workspace

- [x] Provide a unit workspace for indexed unit metadata.
- [x] Display pending transcriptions as review candidates, not approved lessons.
- [x] Keep candidate records out of tests and answer keys.
- [ ] Define a stable lesson/activity schema with source filename, physical PDF page, content type, and review status.
- [ ] Build lesson sections only from source-backed records: vocabulary, grammar, reading, listening, speaking, writing, exercises, and assessments where present.
- [ ] Add previous/next lesson navigation only after lesson ordering is evidenced.
- [ ] Add explicit unavailable/not-indexed states instead of inferred content.

## Phase 3 — Extraction and academic approval

- [x] Preserve page-level extraction provenance and review flags in the existing pipeline.
- [x] Keep OCR and manual recovery candidates separate from approved content.
- [ ] Select one suitable source book and one unit as the pilot.
- [ ] Audit only the exact pages needed for that pilot; no broad visual-review pass.
- [ ] Verify each pilot item against its source page and mark approval explicitly.
- [ ] Validate the pilot schema and provenance automatically.
- [ ] Expand to other books only after the pilot workflow passes.

## Phase 4 — Practice and assessment

- [ ] Build question-bank records separately from source transcription.
- [ ] Require source references and explicit review/approval for every source-derived question and answer.
- [ ] Label generated supplementary practice clearly as generated, never as verbatim textbook content.
- [ ] Add scoring, feedback, retry, and progress tracking after content integrity is established.
- [ ] Test answer-key correctness and prevent pending items from entering learner assessments.

## Phase 5 — Quality, accessibility, and release

- [ ] Add automated tests for every navigation combination and source-link construction.
- [ ] Add data-integrity checks for duplicate IDs, missing source files, invalid page numbers, and unapproved content leakage.
- [ ] Test mobile layouts, keyboard navigation, focus states, and accessible labels.
- [ ] Test PDF viewing and fallback links on Android and desktop browsers.
- [ ] Verify GitHub Pages base paths and deployed assets.
- [ ] Confirm production build and validation workflows pass on the same commit.
- [ ] Publish a release checklist and record known limitations.

## Current measured catalogue snapshot

Computed from `data/curriculum/source-book-index.draft.json` on 2026-11-06:

| Pathway | Books | Indexed units | Units with a known PDF start page |
|---|---:|---:|---:|
| Primary — General | 12 | 29 | 25 |
| Preparatory — General | 5 | 18 | 18 |
| Secondary — General | 3 | 18 | 12 |
| Egyptian Baccalaureate — First-language pathway | 3 | 10 | 6 |
| Egyptian Baccalaureate — Second-language pathway | 1 | 3 | 3 |
| Commercial supplementary references | 9 | 40 | 34 |
| **Total** | **33** | **118** | **98** |

These counts describe index records only. They do not mean the units or their contents have received academic approval. All source-book records currently retain their review status.

## Operating rules

1. Work only in `mustafaelmenshawy23-jpg/EngliMensh-Egypt` on `main`.
2. Never alter the original PDFs.
3. Do not add the excluded 34th book.
4. Do not start another broad OCR/visual-review pass unless explicitly requested.
5. Never invent curriculum details, answers, lesson order, or page references.
6. Keep each change small, testable, and tied to a completion criterion above.
