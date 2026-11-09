# Preparatory curriculum and app-wide QA checkpoint
Date: 9 November 2026
Branch: `content-import/prep-new-hello-hello-plus`
Updated through audit commit: `a9662897897b8b7ae63a9b62396e8ac9765e806a`

## 1. Automated validation status
- Earlier validation run `42572086234` passed on an earlier branch head, including the production Vite build and listed Node tests.
- The Prep 3 general validator was subsequently strengthened in commit `9b460a1fba617e620934d080f43d9d887f614b14`, then the current Prep 3 audit was refreshed in `a9662897897b8b7ae63a9b62396e8ac9765e806a`.
- GitHub Actions run **#637** (`42579271042`) completed successfully on commit `28db57ea2fc5daeb5dbf6095ac12efe6516c8c9e`: the full automated test script passed, the production Vite build passed, and the production build artifact was uploaded. The latest subsequent commits in the current branch are documentation-only QA reconciliations; no new CI run is currently confirmed for the exact latest head.
- Three earlier runs (#634–#636) failed in Prep 3 Plus vocabulary parsing. The subsequent #637 success confirms that failure was corrected on its tested commit.
- A web/PWA build does not prove Android APK packaging or physical-device runtime behavior.

## 2. New Hello general — three preparatory grades
- Prep 1: six units have 22 vocabulary cards each, Arabic meanings/definitions/examples, 30 unique vocabulary MCQs per unit, 20-question final tests, and distinct grammar banks (30 in Units 1–2; 20 in Units 3–6). Structural validation exists; full answer-by-answer academic verification against official pages remains open.
- Prep 2: six units have an app-facing Arabic vocabulary review layer (149 unique headwords across 150 cards), expanded Arabic grammar guides, known answer-key/duplicate-choice repairs and interactive question handling. Reading/listening comprehension is converted to selectable MCQs and scripts can be played with device TTS. Original imported HTML remains separate from the review overlay. Full semantic review of every prompt, distractor, key and translation remains open.
- Prep 3: Units 1 and 2 currently contain 75 and 70 MCQ records respectively; a structural scan found unique stems, four distinct options, valid answer indices, and explanations. Units 3–6 have later teacher-authored runtime overrides for vocabulary, grammar, reading, listening and exams. The strengthened validator checks 305 authored MCQs, the Unit 1/2 inventories, and the presence/completeness of the Units 3–6 overrides. These are teacher-prepared draft materials, not official textbook transcriptions. See `docs/PREP3_NEW_HELLO_CONTENT_AUDIT_2026-11-09.md`.

## 3. New Hello Plus — three preparatory grades
- Prep 1 Plus: repeated vocabulary and grammar prompts were removed; current validators check distinct stems, options, answer-key shape and score labels. Semantic correctness and unit-scope alignment still require teacher/source verification.
- Prep 2 Plus: the identical grammar bank was replaced with six separate 12-question unit-focused banks (72 total). Six supplementary reading passages and listening dialogues with MCQs were added. Structural validators exist; every distractor/key and grammar scope still needs teacher/source verification.
- Prep 3 Plus: all six units received 22 vocabulary records each with Arabic meanings, definitions and contextual examples; 22 vocabulary MCQs per unit; 12 unit-focused grammar MCQs per unit; supplementary reading/listening passages with five MCQs each; and 20-question mixed practice tests. The validator was hardened to extract balanced JSON arrays safely (including escaped quotes and embedded SVG text); direct current-source parsing confirmed the full six-unit inventory. Official-source alignment remains unverified.

## 4. App functionality — current source findings
### Implemented in the preparatory flow
- Grade/path/unit navigation and imported lesson routing.
- Nine preparatory learning modules, including a dedicated optional speaking-practice module.
- Six preparatory game mechanics: picture match, picture quiz, word jumble, meaning quest, open the box and flashcards.
- Local progress persistence with defensive storage validation.
- Device/browser TTS playback and selectable speaker voices. Speaking practice is oral repetition with optional model playback; it does not record, recognize, or score pronunciation.
- PWA/app icon preparation and production web build configuration.

### Still missing from current runtime source
- These features are **not yet present on PR #3's preparatory branch**, but they are implemented on the separate PR #1 branch (`feature/primary-connect-connect-plus-2026-2027`): student profile creation/editing, camera/gallery photo selection, profile-specific progress storage, 90% per-unit certificates, direct PDF saving to Downloads, and four persistent themes (Classic Cream, Ocean Blue, Forest Green, Lavender).
- The two branches have diverged substantially (PR #1 is 199 commits ahead and 462 behind PR #3 in the current comparison). A wholesale merge would risk replacing the preparatory curriculum work. Port these approved features selectively and reconcile dependencies/tests; do not merge either PR wholesale.
- Full-stage game coverage beyond the separate preparatory game pathway is also still a separate integration concern.

These features exist in the repository's parallel development branch, but they are not yet integrated and verified together with the preparatory branch. The approved certificate-template and teacher-portrait JPEG assets have now been copied into PR #3; the profile manager, certificate logic/PDF export, theme controls/CSS, dependencies and tests still need selective porting. Do not describe the combined app as complete until selective porting and regression tests pass.

## 5. Media and offline gaps
- The generated vocabulary build was previously verified at 36 unit records and 846 vocabulary records.
- The successful #637 CI build did **not** run external image discovery: `scripts/build-preparatory-vocabulary.mjs` only calls Openverse/Wikimedia when `FETCH_PREPARATORY_IMAGES=1`, and the workflow does not set that opt-in variable. The 630 figure is the number of unique vocabulary headwords eligible for image enrichment, not 630 completed network lookups. The generated artifact therefore contained 0 fetched photos, 80 existing SVG illustrations, and 766 records classified without an image. It also reported 100 placeholder Arabic meanings, 150 placeholder definitions, and 250 placeholder examples across 36 unit records. These are real output gaps, but the CI result does not establish that Openverse/Wikimedia searches failed.
- Normal builds intentionally skip external photo enrichment to remain deterministic/offline. A separate controlled enrichment pass must be run, audited for licensing/attribution and local asset availability, then followed by the output validator; successful packaging alone does not imply real-photo coverage.
- All external image assets must have verified source/creator/license metadata and be included locally for offline use. SVGs and generic placeholders must not be counted as real photos.

## 6. Source-verification and runtime limits
- The official source PDFs are Git LFS pointers in the repository checkout, so the current GitHub file endpoint cannot read the source pages for line-by-line textbook comparison.
- Existing navigation/storage/game/TTS tests are primarily source/Node checks. They do not replace full end-to-end Android WebView testing on a device.
- TTS voice-selection tests do not establish natural pronunciation quality on all Android devices.
- Game source checks do not prove full device play-through, accessibility, score persistence, or empty-data behavior.
- Profile, certificate and theme regression tests remain to be added after implementation.

## 7. Release decision and next sequence
1. Continue detailed academic review across all three preparatory grades and both pathways; correct only verified defects and keep generated material labelled as draft until source review.
2. Complete the profile, photo, per-student data, 90% certificate, and four-theme features.
3. Verify vocabulary/media coverage, offline behavior, games, speaking/TTS, navigation, persistence, and no regressions.
4. Resolve the media/data gap (licensed offline photos plus missing Arabic meanings, definitions and examples), then run Android WebView/device QA and build/inspect a fresh real debug APK.
5. Keep PR #3 open and unmerged. Do not merge to `main` or distribute an APK before all gates pass and the owner explicitly approves.
