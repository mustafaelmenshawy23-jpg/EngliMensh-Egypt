import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const candidatePath = path.join(root, 'src', 'data', 'extracted', 'manual-recovery-candidates.json');
const indexPath = path.join(root, 'data', 'curriculum', 'source-book-index.draft.json');
const candidateData = JSON.parse(await fs.readFile(candidatePath, 'utf8'));
const index = JSON.parse(await fs.readFile(indexPath, 'utf8'));
const books = new Map(index.books.map((book) => [book.sourceFile, book]));
const ids = new Set();
let errors = 0;

if (candidateData.datasetStatus !== 'candidate_only') {
  console.error('Candidate dataset must remain candidate_only.');
  errors += 1;
}
if (candidateData.sourceDataset !== 'manual-recoveries-pass7.jsonl') {
  console.error('Candidate dataset must identify its original JSONL source.');
  errors += 1;
}
if (!Array.isArray(candidateData.records) || candidateData.records.length === 0) {
  console.error('Candidate records must be a non-empty array.');
  errors += 1;
}

for (const [i, record] of (candidateData.records || []).entries()) {
  const label = `Record ${i + 1}`;
  if (!record.recordId || ids.has(record.recordId)) {
    console.error(`${label}: missing or duplicate recordId.`);
    errors += 1;
  }
  ids.add(record.recordId);
  if (!record.sourceFilename || record.source !== `public/books/${record.sourceFilename}`) {
    console.error(`${label}: source path does not match its exact filename.`);
    errors += 1;
  }
  if (!Number.isInteger(record.pdfPage) || record.pdfPage < 1) {
    console.error(`${label}: pdfPage must be a 1-based positive integer.`);
    errors += 1;
  }
  if (!books.has(record.sourceFilename)) {
    console.error(`${label}: source filename is not present in the source-book index.`);
    errors += 1;
  }
  if (record.reviewStatus !== 'needs_review' || record.transcriptionStatus !== 'candidate') {
    console.error(`${label}: candidate cannot be promoted without academic review.`);
    errors += 1;
  }
  if (record.answerKey !== null) {
    console.error(`${label}: answerKey must remain null.`);
    errors += 1;
  }
  const link = record.unitLink;
  if (!link || !['proposed_needs_review', 'cross_unit_reference', 'not_unit_based'].includes(link.status)) {
    console.error(`${label}: missing or invalid unit-link review status.`);
    errors += 1;
  } else if (Number.isInteger(link.unitNumber)) {
    const sourceBook = books.get(record.sourceFilename);
    const unit = sourceBook?.units?.find((item) => item.number === link.unitNumber);
    if (!unit || sourceBook.grade !== record.grade || link.status !== 'proposed_needs_review' || !link.evidence) {
      console.error(`${label}: proposed unit link must match the source book/grade and remain pending review.`);
      errors += 1;
    }
  } else if (link.status === 'cross_unit_reference') {
    const sourceBook = books.get(record.sourceFilename);
    const validUnits = Array.isArray(link.unitNumbers) && link.unitNumbers.length > 0 && link.unitNumbers.every((number) => sourceBook?.units?.some((unit) => unit.number === number));
    if (!validUnits || !link.evidence) {
      console.error(`${label}: cross-unit reference must point to existing units and include evidence.`);
      errors += 1;
    }
  } else if (link.status === 'not_unit_based' && !link.evidence) {
    console.error(`${label}: unassigned record must explain why no unit is linked.`);
    errors += 1;
  }
}
if (errors) {
  console.error(`Review-candidate validation failed: ${errors} issue(s).`);
  process.exit(1);
}
console.log(`Review-candidate validation passed: ${candidateData.records.length} unique, source-index-linked records remain unapproved.`);
