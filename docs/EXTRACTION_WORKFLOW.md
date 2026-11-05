# PDF extraction workflow

This project treats the uploaded PDF books as the only source of curriculum content.

## 1. Prepare the files

Keep the original PDFs in \`public/books/\`. If Git LFS is used, make sure the actual LFS objects are available locally, not only the small pointer files.

## 2. Install the extractor

From the repository root:

\`\`\`bash
python3 -m pip install -r requirements-extraction.txt
\`\`\`

## 3. Extract page text

\`\`\`bash
python3 scripts/extract-pdfs.py
\`\`\`

Generated files:

- \`public/books/catalog.json\`: inventory, file hashes, page counts and filename hints.
- \`src/data/extracted/pages.jsonl\`: one JSON record per PDF page.
- \`src/data/extracted/extraction-report.json\`: extraction counts, empty pages and errors.

To regenerate outputs after changing source PDFs:

\`\`\`bash
python3 scripts/extract-pdfs.py --force
\`\`\`

## 4. Review before curriculum use

Every page record is marked \`needs_review\`. Filename-derived grade, stage, pathway and term fields are hints only and also marked \`needs_review\`. Verify them against the actual book cover and contents pages before approving.

Pages with no embedded text are marked \`needs_ocr\`. This tool does not perform OCR, translate, summarize, correct, or invent missing content.

## 5. Content record contract

Each page record includes:

- \`sourceFilename\` and \`sourcePath\`
- \`sourceSha256\` to detect changed source files
- \`pageNumber\` (one-based PDF page number)
- \`text\` (raw extracted page text)
- \`extractionStatus\`
- \`reviewStatus\`

Future lesson, vocabulary, grammar, reading and question records must retain the source filename and page number. A question or answer must not be marked approved unless checked against the original page.

## Important

This script is a local extraction pipeline. GitHub's web interface and GitHub Pages do not execute it automatically. Run it on a computer with the repository cloned and the actual PDF files downloaded from Git LFS where applicable, then commit the generated JSON files.
