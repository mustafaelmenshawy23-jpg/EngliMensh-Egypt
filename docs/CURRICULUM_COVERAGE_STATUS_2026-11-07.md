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
