# EngliMensh-Egypt — source approval and implementation policy

**Decision date:** 2026-11-06  
**Authority:** Project owner confirmation

## Approved source set

The project owner confirms that the source books were obtained from the Egyptian Ministry of Education website, personally reviewed, and are familiar teaching materials. For this project, the supplied source books are approved as the authoritative curriculum reference set.

This approval applies to the source books and their use as curriculum references. It does not claim that every OCR character, automatically extracted heading, or generated question has been individually checked.

## Immutable originals

- Treat files under `public/books/` as immutable source assets.
- Never edit, rename, replace, recompress, or otherwise rewrite an original PDF.
- Store indexes, OCR output, page metadata, corrections, and app-ready content separately.
- Any future extraction must read the originals and write new derived files only.

## Review scope

- Broad visual-review passes are stopped.
- Do not create additional image-review passes as routine work.
- When a concrete defect appears in the application, inspect only the affected source file and 1-based physical PDF page.
- Do not infer unreadable wording, missing exercise content, printed page numbers, or answer keys.
- Preserve exact source filename and PDF page provenance for every lesson, activity, and question.

## Implementation priority

1. Connect the existing approved source-book index to the app's grade and pathway navigation.
2. Populate the curriculum structure from existing source-backed index records; do not invent units or page references.
3. Build lesson/activity views with source-page provenance.
4. Add and validate question-bank content as a separate stage.
5. Test build, navigation, source links, and data integrity.

## Correction policy

A correction is made only when a specific mismatch is observed. Keep the original source unchanged, record the affected file and page, and update only the derived record or application component that depends on it.
