import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dataPath = path.join(root, 'src', 'data', 'extracted', 'visual-recoveries-pass22.jsonl');
const indexPath = path.join(root, 'data', 'curriculum', 'source-book-index.draft.json');
const lines = (await fs.readFile(dataPath, 'utf8')).split(/\r?\n/).filter((line) => line.trim());
const index = JSON.parse(await fs.readFile(indexPath, 'utf8'));
const knownSources = new Set(index.books.map((book) => book.sourceFile));
const ids = new Set();
const sourcePages = new Set();
let errors = 0;

for (const [i, line] of lines.entries()) {
  const label = `Record ${i + 1}`;
  let record;
  try {
    record = JSON.parse(line);
  } catch {
    console.error(`${label}: invalid JSON.`);
    errors += 1;
    continue;
  }

  if (!record.recordId || ids.has(record.recordId)) {
    console.error(`${label}: missing or duplicate recordId.`);
    errors += 1;
  }
  ids.add(record.recordId);

  if (!record.sourceFilename || record.source !== `public/books/${record.sourceFilename}` || !knownSources.has(record.sourceFilename)) {
    console.error(`${label}: source path must match a filename in the source-book index.`);
    errors += 1;
  }
  if (!Number.isInteger(record.pdfPage) || record.pdfPage < 1) {
    console.error(`${label}: pdfPage must be a 1-based positive integer.`);
    errors += 1;
  }
  const sourcePage = `${record.sourceFilename}#${record.pdfPage}`;
  if (sourcePages.has(sourcePage)) {
    console.error(`${label}: duplicate source PDF/page pair.`);
    errors += 1;
  }
  sourcePages.add(sourcePage);

  if (!record.visualCategory || !record.visualObservation || record.visualReviewDpi !== 300) {
    console.error(`${label}: visual category, observation, and 300-DPI provenance are required.`);
    errors += 1;
  }
  if (record.reviewStatus !== 'needs_review' || record.academicStatus !== 'not_academically_verified') {
    console.error(`${label}: visual observations must remain unapproved.`);
    errors += 1;
  }
  if (!record.provenanceNote?.includes('42217082502') || !record.provenanceNote.includes('1-based physical PDF page')) {
    console.error(`${label}: provenance must identify the render workflow and physical page numbering.`);
    errors += 1;
  }
}

if (errors) {
  console.error(`Pass 22 visual-recovery validation failed: ${errors} issue(s).`);
  process.exit(1);
}
console.log(`Pass 22 visual-recovery validation passed: ${lines.length} unique source-page observations remain unapproved.`);
