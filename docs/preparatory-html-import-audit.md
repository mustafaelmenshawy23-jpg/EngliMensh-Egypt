# Preparatory HTML import audit (2026/2027)

Audit scope: `content-imports/preparatory/` on branch `content-import/prep-new-hello-hello-plus`.

## Inventory confirmed

There are 31 HTML source files:
- New Hello (General): Prep 1 has 6 unit files; Prep 2 has 6 unit files; Prep 3 is supplied as one combined Units 1–6 HTML file.
- New Hello Plus (Advanced): Prep 1, Prep 2, and Prep 3 each have 6 unit files (18 total).

The original imported HTML files are retained unchanged in this import area. This audit does not approve the academic correctness of the content or answer keys.

## Findings requiring implementation decisions

1. **Prep 1 New Hello and all sampled New Hello Plus pages** use a consistent full lesson layout with vocabulary, vocabulary practice, grammar, grammar practice, reading/comprehension, listening, comprehensive unit evaluation, and a certificate area. They include inline JavaScript and use external Google Fonts; some also use external CDN resources.
2. **Prep 2 New Hello (General)** is a different, static HTML format. The inspected files contain vocabulary, vocabulary quizzes, grammar explanations/quizzes, reading and listening sections, but have no script tags or form controls. Correct answers are visibly emphasized in the markup. They must not be described as fully interactive until a separate interaction layer is added and tested.
3. **Prep 3 New Hello (General)** is one combined multi-unit HTML document rather than six independent unit files. It includes unit navigation and JavaScript, and references external CDN resources (including Tailwind and JSZip). Verify all six unit datasets and make its dependencies suitable for the app's offline expectations before production use.
4. HTML pages are source documents, not yet integrated into the native app navigation or its structured lesson/question registry. Uploading these files does not make them visible in the app.
5. The imported pages use external font/CDN references. Offline behavior must be tested; external resources should be removed, bundled, or given safe local fallbacks before claiming offline readiness.

## Concrete content QA findings

The six Prep 2 New Hello (General) files were counted by section:
- Units 1–5 each contain 25 vocabulary questions, 30 grammar questions, 5 reading questions, and 5 listening questions (65 total).
- Unit 6 contains 29 grammar questions despite its heading claiming 30 (64 total).
- Prep 2 New Hello Unit 1 repeats the vocabulary item **Success** twice in its 25-word bank.

These are source-package defects to resolve against the intended lesson content before marking this pathway academically complete. The imported source HTML remains unchanged; do not silently invent a replacement question or vocabulary item.

## Safe integration plan

- Map New Hello to Preparatory → General and New Hello Plus to Preparatory → Advanced.
- Preserve all source HTML files unchanged; add app-facing registry/navigation separately.
- Render imported documents in an isolated embedded view, or convert content into app-native sections after verifying source structure.
- Do not evaluate untrusted imported scripts in the main application document.
- Add interaction support for static Prep 2 New Hello quizzes without changing the source files.
- Test all six grades/pathway combinations, unit navigation, mobile layout, offline behavior, quiz answer handling, and Android packaging.

## Merge gate

Keep this PR as Draft until:
- all 31 files are accounted for;
- the different Prep 2 and Prep 3 packaging formats are handled;
- content/navigation integration is implemented;
- tests/build pass and a preview APK is checked.

No original PDF under `public/books/` is modified by this import.
