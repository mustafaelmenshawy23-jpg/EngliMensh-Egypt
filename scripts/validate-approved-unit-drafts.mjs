import fs from 'node:fs/promises';
import path from 'node:path';
import { validateUnitDraftQuality, REQUIRED_MODULE_TYPES } from './lib/content-quality-validator.mjs';

const index = JSON.parse(await fs.readFile('data/curriculum/source-book-index.draft.json', 'utf8'));
const books = new Map(index.books.map((book) => [book.id, book]));
const directory = 'src/data/approved-unit-drafts';
let files = [];
try { files = (await fs.readdir(directory)).filter((name) => name.endsWith('.json')); } catch {}
const errors = [];
const seenUnits = new Set();

for (const filename of files) {
  const draft = JSON.parse(await fs.readFile(path.join(directory, filename), 'utf8'));
  const label = `${draft.bookId || 'unknown'} Unit ${draft.unitNumber || '?'}`;
  const book = books.get(draft.bookId);
  const unit = book?.units?.find((item) => item.number === draft.unitNumber);
  if (!book || !unit) errors.push(`${label}: book/unit is not present in the source index.`);
  if (seenUnits.has(`${draft.bookId}-unit-${draft.unitNumber}`)) errors.push(`${label}: duplicate approved unit file.`);
  seenUnits.add(`${draft.bookId}-unit-${draft.unitNumber}`);
  if (draft.datasetStatus !== 'approved' || draft.reviewStatus !== 'approved') errors.push(`${label}: dataset and review statuses must both be approved.`);
  if (!draft.reviewedBy || !draft.reviewedAt || draft.approval?.confirmedVisualReview !== true) errors.push(`${label}: missing named reviewer, timestamp, or manual visual-review confirmation.`);
  if (!draft.sourceFingerprint || draft.approval?.sourceFingerprint !== draft.sourceFingerprint) errors.push(`${label}: missing or mismatched source fingerprint.`);
  if (draft.sourceFilename !== book?.sourceFile) errors.push(`${label}: source filename does not match the indexed book.`);
  const start = draft.sourcePdfRange?.start;
  const end = draft.sourcePdfRange?.end;
  if (!Number.isInteger(start) || !Number.isInteger(end) || end < start || start !== unit?.startPdfPage) errors.push(`${label}: invalid or stale source PDF range.`);
  const types = (draft.sections || []).map((section) => section.type);
  if (types.length !== REQUIRED_MODULE_TYPES.length || new Set(types).size !== REQUIRED_MODULE_TYPES.length ||
      !REQUIRED_MODULE_TYPES.every((type) => types.includes(type))) errors.push(`${label}: all nine unique learning sections are required.`);
  for (const section of draft.sections || []) {
    if (!Array.isArray(section.items)) errors.push(`${label}: section ${section.type} items must be an array.`);
    for (const item of section.items || []) {
      if (item.reviewStatus !== 'approved') errors.push(`${label}: item ${item.itemId || '(missing id)'} is not approved.`);
    }
  }
  if (Number.isInteger(start) && Number.isInteger(end)) {
    const audit = validateUnitDraftQuality(draft, { start, end }, []);
    if (!audit.isValid) errors.push(`${label}: quality validation failed: ${audit.criticalFailures.join('; ')}`);
  }
}
if (errors.length) {
  console.error(errors.map((error) => '- ' + error).join('\n'));
  process.exit(1);
}
console.log(`Approved curriculum validation passed: ${files.length} approved unit(s); unapproved drafts are not bundled.`);
