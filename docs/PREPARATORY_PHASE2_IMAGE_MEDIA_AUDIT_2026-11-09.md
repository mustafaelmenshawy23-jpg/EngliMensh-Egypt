# Preparatory curriculum Phase 2 — image and media coverage audit
Date: 9 November 2026
Branch: `content-import/prep-new-hello-hello-plus`

## Scope
Reviewed the image extraction/build pipeline, the committed vocabulary data snapshot, and the asset directories on this branch.

## Current repository state
- `src/data/preparatory-vocabulary.json` currently contains an empty `units` object and an image report of zero units / zero words. It is a generated build output; `package.json` runs `scripts/build-preparatory-vocabulary.mjs` as `prebuild`, so the generated output must be checked after the build rather than assumed from this committed placeholder.
- The generator discovers words from the imported HTML and creates unit records for 36 combinations (3 grades × 2 pathways × 6 units). It can retain safe inline SVGs.
- The generator's photo enrichment is explicitly optional and is skipped unless `FETCH_PREPARATORY_IMAGES=1` is set. A normal build therefore does not guarantee any real photographs.
- The generator currently searches Openverse and falls back to Wikimedia Commons, retaining creator, source, and license metadata when a photo is successfully downloaded.
- The branch's `public/assets` directory contains `aistudio` and `vocab`; no committed `public/assets/preparatory-vocabulary` photo directory was found. The existing `public/assets/vocab` directory contains 10 SVG assets, which are generic primary vocabulary illustrations, not evidence of image coverage for all preparatory units.
- New Hello Plus Prep 3 vocabulary records include placeholder translations/definitions/examples as detailed in the separate Prep 3 report. Adding photographs alone would not make those records academically usable.

## Phase 2 acceptance requirements
1. Run the actual prebuild and verify that all 36 unit keys and expected word counts are generated. Do not infer this from the source inventory.
2. Produce a per-unit image manifest distinguishing real photo, meaningful original illustration, and missing image. Do not count a letter-in-circle placeholder as a real food/object photograph.
3. For any externally sourced photo, retain the source URL, creator, and license and verify the image bytes are actually included in the app package for offline use.
4. Do not silently substitute unrelated images or generic cartoons for the target vocabulary.
5. Resolve placeholder translations and definitions before using Meaning Quest or other definition-based games.
6. Test offline rendering in Android WebView after assets are bundled.

## Limitation and next work
This GitHub file interface can inspect and commit UTF-8 text, but it cannot create a valid binary image asset merely by writing a filename or a guessed URL. The image-enrichment script itself must run in the project build environment (or authorized image assets must be supplied) before image coverage can be claimed. The next verification is to inspect the generated 36-unit manifest and then repair only gaps supported by reliable source material.

## Status
Phase 2 image/media audit started. No original HTML was changed. No APK was built/shared and no merge to `main` was performed.


## Actual generated build output (verified 9 Nov 2026)
The production build's new postbuild validator ran successfully on commit `72703846eb735305b893566e433c28d5998c3ff6` and inspected the generated JSON after the prebuild extraction step.

| Measure | Verified count |
|---|---:|
| Unit records | 36 |
| Vocabulary records | 846 |
| Licensed photos downloaded in normal offline build | 0 |
| Safe SVG illustrations | 80 |
| Records with no image | 766 |
| Arabic fields still placeholder/missing | 231 |
| Definitions still generic/missing | 281 |
| Examples still generic/missing | 382 |

Interpretation:
- The generator successfully produces all 36 expected grade/pathway/unit records.
- Normal CI build intentionally skips external photo lookup, so zero photos is expected and no online image lookup was claimed.
- 766/846 vocabulary records have no image in the generated output. This is a release blocker for any requirement that every vocabulary item have a real image.
- Arabic/definition/example counts confirm that source placeholder text survives into the generated data. Those fields must be corrected from trustworthy source material, not filled with invented translations or examples.
- The 80 SVGs are classified separately from photographs; their presence does not imply photo coverage.
- These are automated content/media counts, not teacher approval or curriculum completion.

The validator is wired to run after every `npm run build` via `postbuild`, checks all 36 unit keys, verifies that every claimed photo has source/attribution/license metadata and an actual local file, classifies image coverage, and reports placeholder text. It warns about content gaps without falsely treating a structurally complete build as academically approved.
