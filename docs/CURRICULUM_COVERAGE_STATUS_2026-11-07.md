# Curriculum coverage and generation status — 7 November 2026

Repository scope: `mustafaelmenshawy23-jpg/EngliMensh-Egypt` only. No other EngliMensh repository is included.

## Repository inventory

| Measure | Verified result |
|---|---:|
| PDF files in the Git tree | 34 |
| Books registered in the source index | 33 |
| Indexed student books | 15 |
| Indexed commercial supplements | 9 |
| Indexed assessment books | 8 |
| Indexed reader files | 1 |
| Indexed unit records | 118 |
| Units with verified PDF start pages | 99 |
| Units missing a verified PDF start page | 19 |
| Safely delimited generation candidates before OCR checks | 94 |
| Units with ambiguous next-unit boundaries | 5 |
| Approved units | 0 |

The source catalog reports 33 successfully processed PDFs and one additional LFS-backed file that was not hydrated: `Performance Tasks Prep 2-OnlineMaterials.PDF`. Original PDFs remain preserved. Assessment books and the reader currently have no indexed unit records.

## Latest batch

[Generate interactive curriculum batch #42344993034](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/42344993034)

- Extraction and OCR completed successfully.
- Five units were selected from the 94 safely delimited candidates.
- Baccalaureate Year 2, First Language Part 1, Unit 4 produced an incomplete draft: one vocabulary item and no content in the other required sections. It remains unapproved and is not considered complete.
- OCR/visual review blocked First Language Part 1 Unit 5 (PDF p170), First Language Part 2 Unit 10 (PDF p162), and Second Language Part 1 Unit 1 (PDF p37).
- First Language Part 2 Unit 9 failed because the Gemini fallback returned malformed JSON after 3.8 Flash 503/timeouts.
- Progress and the incomplete Unit 4 draft were saved to GitHub. No generated content was promoted into the learner app.

## Remaining work

1. Verify the 19 missing unit start pages and five ambiguous boundaries from the original PDFs/contents pages.
2. Recover the LFS object for `Performance Tasks Prep 2-OnlineMaterials.PDF`, or request that PDF again if the object cannot be restored.
3. Review the three blocked OCR pages listed above.
4. Regenerate the incomplete Unit 4 and malformed Unit 9; count a unit as generated only after all nine sections and quality checks pass.
5. Complete academic review for all source-linked and supplementary items. No unit is approved yet.
6. Test speaking TTS, listening playback, games, answer marking, and comprehensive tests on real Android/WebView devices. Platform voice availability and gender metadata vary; do not claim a gender-matched voice works unless detected or manually assigned and previewed.

## Release status

**Not complete.** The 33-book/118-unit index and extraction pipeline exist, but no fully populated, academically approved unit has been demonstrated. Build success alone does not prove curriculum completion.


## Detailed content and application audit

The current GitHub main branch was rechecked on 7 November 2026:

- All 118 indexed unit scaffolds exist, with nine independent sections each, but all 1,062 section slots are still empty.
- lessons.draft.json contains 26 lesson records and 149 items. All 26 records remain needs_review; the 149 items do not yet carry consistent item-level origin provenance, so none is counted as verified source content or approved material.
- The Unit 4 draft is incomplete and corrupted: its source coverage stops at PDF page 131 although the indexed range is 102–139. It is not a completed unit.
- No unit has been academically approved or demonstrated as fully working in the learner app.
- The app has a separate vocabulary module screen and device-dependent speaking TTS controls. TTS gender matching is not yet confirmed on a real Android/WebView device; voices depend on the device voice list or manual selection and preview. The current app does not expose a microphone recording workflow in this screen, so simultaneous microphone/TTS behaviour has not been device-tested.
- There are no approved playable game records yet. The listening TTS preview is generated speech, not an original recording from the book.

## Quality recovery work

The source/content quality validators and automated regression tests are being added to the GitHub pipeline. The generator will keep all output in draft status, require complete page coverage, distinguish source page references from supplementary context references, and reject corrupted OCR, incomplete modules, invalid answer keys, or missing role metadata.

The daily generation workflow is designed to resume from the first eligible unit that is not already a complete draft and to process a small batch. OCR/source blockers remain visible in the progress report rather than being silently skipped. The 19 missing start pages, five ambiguous boundaries, unindexed LFS PDF, reader, and assessment-only files remain separate inventory/review work; they are not silently treated as completed units.


---

## Superseding repository-wide audit — 7 November 2026

The Primary 1 page-boundary cross-check expanded the index from 118 to **121 units** and corrected the Primary 1 source starts. Current counts:

- 34 PDF files in the Git tree; 33 indexed; one unindexed LFS-backed PDF still unavailable.
- 33 indexed books: 15 student books, 9 commercial supplements, 8 assessment PDFs, and 1 reader.
- 121 indexed units: 81 student-book units and 40 commercial-supplement units.
- 102 units have a start page; 19 still lack one.
- 97 safely delimited candidates; 5 ambiguous next-unit boundaries.
- 0 teacher-approved units.
- 121 scaffolds × 9 modules = 1,089 empty module placeholders.
- 26 lesson records / 149 items remain `needs_review`; one existing Unit 4 artifact is incomplete.

The complete per-book/per-unit inventory, exact blockers, app/runtime limitations, and Actions evidence are in [the repository-wide inventory and pipeline audit](REPOSITORY_INVENTORY_AND_PIPELINE_AUDIT_2026-11-07.md). Earlier 118-unit figures in this file are superseded by this audit.
