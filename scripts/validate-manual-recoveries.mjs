import fs from 'node:fs/promises';
import path from 'node:path';

const file = path.join(process.cwd(), 'src', 'data', 'extracted', 'manual-recoveries-pass7.jsonl');
const lines = (await fs.readFile(file, 'utf8')).split(/\r?\n/).filter(Boolean);
const ids = new Set();
let errors = 0;

for (let i = 0; i < lines.length; i += 1) {
  let record;
  try { record = JSON.parse(lines[i]); }
  catch { console.error(`Line ${i + 1}: invalid JSON`); errors += 1; continue; }

  const required = ['recordId', 'source', 'sourceFilename', 'grade', 'documentType', 'contentType'];
  for (const key of required) {
    if (typeof record[key] !== 'string' || !record[key].trim()) {
      console.error(`Line ${i + 1}: missing ${key}`); errors += 1;
    }
  }
  if (!Number.isInteger(record.pdfPage) || record.pdfPage < 1) {
    console.error(`Line ${i + 1}: pdfPage must be a 1-based positive integer`); errors += 1;
  }
  if (record.source !== `public/books/${record.sourceFilename}`) {
    console.error(`Line ${i + 1}: source path does not match sourceFilename`); errors += 1;
  }
  if (record.reviewStatus !== 'needs_review' || record.transcriptionStatus !== 'candidate') {
    console.error(`Line ${i + 1}: manual recovery must remain an unapproved candidate`); errors += 1;
  }
  if (record.answerKey !== null) {
    console.error(`Line ${i + 1}: answerKey must remain null until independently verified`); errors += 1;
  }
  if (ids.has(record.recordId)) {
    console.error(`Line ${i + 1}: duplicate recordId ${record.recordId}`); errors += 1;
  }
  ids.add(record.recordId);
}

if (errors) {
  console.error(`Manual recovery validation failed: ${errors} issue(s) across ${lines.length} records.`);
  process.exit(1);
}
console.log(`Manual recovery validation passed: ${lines.length} unique provenance-linked candidates remain needs_review.`);
