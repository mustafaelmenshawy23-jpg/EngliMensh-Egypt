# Curriculum coverage and generation status — 8 November 2026

Repository scope: `mustafaelmenshawy23-jpg/EngliMensh-Egypt` only. No other EngliMensh repository is included.

## Verified inventory on main

| Measure | Verified result |
|---|---:|
| PDF file pointers in the Git tree | 34 |
| Books registered in the source index | 33 |
| Indexed student books | 15 |
| Indexed commercial supplements | 9 |
| Indexed assessment books | 8 |
| Indexed reader files | 1 |
| Indexed unit records | 118 |
| Units with a recorded PDF start page | 99 |
| Units missing a recorded PDF start page | 19 |
| Safely delimited candidates before OCR checks | 94 |
| Units with ambiguous next-unit boundaries | 5 |
| Unit scaffolds | 118 |
| Sections per scaffold after this update | 9 |
| Empty scaffold slots after this update | 1,062 |
| Teacher-approved units | 0 |

The 34 PDF paths are present as Git LFS pointer files in the Git tree; the extraction/generation workflow must hydrate the original binaries with Git LFS before processing. One PDF is not in the source index: `Performance Tasks Prep 2-OnlineMaterials.PDF`. It must be classified and indexed only after its contents are inspected. The original PDFs are not modified.

The current source index is authoritative for this count: it contains **118 units, not 121**. The previous 121-unit statement in an earlier draft report was not reflected in the committed source index and is withdrawn.

## Content state

- The source index has 33 books and 118 unit records. Nineteen unit starts remain unknown; five additional unit boundaries cannot safely be delimited because the following unit start is unknown.
- All 118 scaffolds were empty before this run. This run added the missing Speaking slot to each scaffold, so the manifest now contains nine empty sections per unit. No curriculum text was added by this structural change.
- `src/data/lessons/lessons.draft.json` contains 26 lesson records and 149 items. All 26 records remain `needs_review`; these items are not counted as approved.
- Existing unit draft artifacts include Primary 1 Units 1–3 and Baccalaureate Year 2 First Language Part 1 Unit 4. They remain drafts; Unit 4 is incomplete and must not be counted as complete.
- The current learner workspace in `src/main.js` has dedicated rendering paths for Primary 1 Units 1–3 only. Other units do not yet have a proven generic content-rendering path.
- The current TTS implementation calls the native Capacitor TextToSpeech plugin or browser speech synthesis with a default English voice. It does not select a male/female voice per dialogue role. No real Android device voice inventory or gender-matched playback has been verified.
- The current app has no tested microphone-recording workflow for speaking. Do not claim simultaneous microphone/TTS handling has been validated.
- Existing game implementations are primarily hard-coded to the Primary 1 Unit 1 screen. Generated game metadata alone is not evidence that games for all units are playable.

## Generation workflow evidence

The latest generation run visible on the repository before this update was [Generate interactive curriculum batch #4](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/42344993034), created 7 November 2026. It failed after selecting five candidates: one draft was written, three candidates were blocked by source OCR review, and one candidate failed generation. The workflow did persist the draft artifact, but the workflow itself has no scheduled trigger and the batch script does not yet have a reliable persistent queue cursor.

The latest successful app validation/build before this update was [Validate EngliMensh app](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/42389926318) and [Android preview build](https://github.com/mustafaelmenshawy23-jpg/EngliMensh-Egypt/actions/runs/42389926300), both on commit `c7bd40f`. These prove automated validation/build only, not curriculum completion or on-device testing.

## Work performed in this run

- Added a separate empty Speaking section to all 118 indexed unit scaffolds.
- Updated the scaffold validator to require all nine sections, including Speaking.
- Corrected this report to match the committed source index count (118 units) and the actual app/TTS limitations.
- The generation scheduler and resumable queue still require validation by a new GitHub Actions run after the workflow changes.

## Remaining work

1. Verify the 19 missing unit start pages and five ambiguous boundaries from the original PDFs/contents pages.
2. Recover or inspect the unindexed LFS-backed Performance Tasks PDF before adding it to the index.
3. Run OCR and visual source review on blocked/scanned pages; OCR is not academic approval.
4. Generate source-linked drafts for the 94 safely delimited candidates, keeping all drafts unapproved.
5. Build a generic learner workspace that loads all approved unit drafts; do not expose unreviewed drafts as approved content.
6. Add real dialogue voice selection only after the target platforms expose a selectable voice list and the voices are previewed. Until then, record gender metadata as unverified.
7. Add playable unit-specific games and term/book review tests, then test them in the app.
8. Complete teacher review of every source and supplementary item before approval.

## Release status

**Not complete.** The nine-section structure is now consistent across all 118 indexed units, but the content is not populated, no unit is teacher-approved, and generic all-unit rendering, per-role TTS voice matching, games, and device testing remain incomplete.
