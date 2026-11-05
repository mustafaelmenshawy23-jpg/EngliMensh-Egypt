import fs from 'node:fs/promises';
import path from 'node:path';

const file = path.join(process.cwd(), 'src', 'data', 'extracted', 'pages.jsonl');
let content;
try { content = await fs.readFile(file, 'utf8'); }
catch {
  console.error('Missing pages.jsonl. Run npm run extract:books first.');
  process.exit(1);
}
const lines = content.split(/\r?\n/).filter(Boolean);
let errors = 0;
for (let i = 0; i < lines.length; i += 1) {
  let page;
  try { page = JSON.parse(lines[i]); }
  catch { console.error(`Line ${i + 1}: invalid JSON`); errors += 1; continue; }
  if (!page.sourceFilename || !page.source || !Number.isInteger(page.pdfPage) || page.pdfPage < 1) {
    console.error(`Line ${i + 1}: missing source filename/path or valid 1-based PDF page`);
    errors += 1;
  }
  if (page.reviewStatus !== 'needs_review') {
    console.error(`Line ${i + 1}: extracted content must remain needs_review`);
    errors += 1;
  }
  if (typeof page.text !== 'string') {
    console.error(`Line ${i + 1}: page text must be a string`);
    errors += 1;
  }
}
if (errors) {
  console.error(`Validation failed: ${errors} issue(s) across ${lines.length} page records.`);
  process.exit(1);
}
console.log(`Validation passed: ${lines.length} page records have source and page references and remain needs_review.`);
