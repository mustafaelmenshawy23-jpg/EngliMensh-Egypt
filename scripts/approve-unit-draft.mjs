import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { validateUnitSourceCoverage } from './lib/source-quality-gate.mjs';
import { validateUnitDraftQuality, REQUIRED_MODULE_TYPES } from './lib/content-quality-validator.mjs';

const bookId = String(process.env.BOOK_ID || '').trim();
const unitNumber = Number(process.env.UNIT_NUMBER);
const reviewerName = String(process.env.REVIEWER_NAME || '').trim();
const confirmVisualReview = process.env.CONFIRM_VISUAL_REVIEW === 'true';
const replaceApproved = process.env.REPLACE_APPROVED === 'true';

if (!/^[a-z0-9-]+$/.test(bookId) || !Number.isInteger(unitNumber) || unitNumber < 1) {
  throw new Error('BOOK_ID and UNIT_NUMBER must identify one indexed curriculum unit.');
}
if (reviewerName.length < 2 || reviewerName.length > 120) {
  throw new Error('REVIEWER_NAME must contain 2–120 characters.');
}
if (!confirmVisualReview) {
  throw new Error('Manual visual review confirmation is required. Set confirm_visual_review=true only after checking the original PDF pages.');
}

const index = JSON.parse(await fs.readFile('data/curriculum/source-book-index.draft.json', 'utf8'));
const book = index.books.find((item) => item.id === bookId);
if (!book) throw new Error(`Unknown bookId: ${bookId}`);
const orderedUnits = [...(book.units || [])].sort((a, b) => a.number - b.number);
const unitIndex = orderedUnits.findIndex((item) => item.number === unitNumber);
const unit = orderedUnits[unitIndex];
if (!unit || !Number.isInteger(unit.startPdfPage)) {
  throw new Error('This unit has no verified PDF start page and cannot be approved.');
}
const next = orderedUnits[unitIndex + 1];
if (next && (!Number.isInteger(next.startPdfPage) || next.number !== unitNumber + 1)) {
  throw new Error('The next unit boundary is ambiguous. Resolve the source index before approval.');
}
const manifest = JSON.parse(await fs.readFile('src/data/extracted/manifest.json', 'utf8'));
const manifestBook = manifest.books?.find((item) =>
  item.source?.endsWith('/' + book.sourceFile) || item.source === 'public/books/' + book.sourceFile
);
const start = unit.startPdfPage;
const end = next ? next.startPdfPage - 1 : manifestBook?.pages;
if (!Number.isInteger(end) || end < start) throw new Error('Could not verify this unit PDF end page.');

const pagesText = await fs.readFile('src/data/extracted/pages.jsonl', 'utf8');
const rows = pagesText.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line))
  .filter((page) => page.sourceFilename === book.sourceFile && page.pdfPage >= start && page.pdfPage <= end);
const sourceFingerprint = createHash('sha256')
  .update(JSON.stringify(rows.map((page) => [page.pdfPage, page.text || ''])))
  .digest('hex');

const draftPath = path.join('artifacts/unit-drafts', `${bookId}-unit-${unitNumber}.json`);
const draft = JSON.parse(await fs.readFile(draftPath, 'utf8'));
if (draft.datasetStatus !== 'draft' || !['needs_review', 'ready_for_teacher_review'].includes(draft.reviewStatus)) {
  throw new Error('Only a draft awaiting teacher review can be approved.');
}
if (draft.bookId !== bookId || draft.unitNumber !== unitNumber || draft.sourceFilename !== book.sourceFile) {
  throw new Error('Draft source metadata does not match the indexed book and unit.');
}
if (draft.sourceFingerprint !== sourceFingerprint) {
  throw new Error('Source fingerprint changed since generation. Regenerate this unit before approval.');
}
if (draft.sourcePdfRange?.start !== start || draft.sourcePdfRange?.end !== end) {
  throw new Error('Draft PDF range does not match the current verified unit boundaries.');
}

const sourceGate = validateUnitSourceCoverage(rows, start, end);
if (sourceGate.status === 'blocked') {
  throw new Error('Source quality gate is blocked: ' + sourceGate.issues.join('; '));
}
const audit = validateUnitDraftQuality(draft, { start, end }, rows);
if (!audit.isValid) {
  throw new Error('Unit quality validation failed: ' + audit.criticalFailures.join('; '));
}
if (!Array.isArray(draft.sections) || REQUIRED_MODULE_TYPES.some((type) => !draft.sections.some((section) => section.type === type))) {
  throw new Error('The draft must contain all nine required learning sections.');
}
if (draft.sections.some((section) => !Array.isArray(section.items) || section.items.some((item) => item.reviewStatus === 'rejected'))) {
  throw new Error('Rejected or malformed items must be corrected before approval.');
}

const reviewedAt = new Date().toISOString();
const approved = {
  ...draft,
  datasetStatus: 'approved',
  reviewStatus: 'approved',
  reviewedBy: reviewerName,
  reviewedAt,
  approval: {
    method: 'manual_teacher_review',
    confirmedVisualReview: true,
    reviewerName,
    reviewedAt,
    sourceFingerprint,
    sourceGateStatus: sourceGate.status,
    sourceGateIssues: sourceGate.issues,
    qualityScore: audit.score,
    qualityWarnings: audit.warnings
  },
  sections: draft.sections.map((section) => ({
    ...section,
    items: section.items.map((item) => ({ ...item, reviewStatus: 'approved' }))
  }))
};

const outputDirectory = 'src/data/approved-unit-drafts';
await fs.mkdir(outputDirectory, { recursive: true });
const outputPath = path.join(outputDirectory, `${bookId}-unit-${unitNumber}.json`);
try {
  await fs.access(outputPath);
  if (!replaceApproved) throw new Error('An approved copy already exists. Set replace_existing=true only after a deliberate re-review.');
} catch (error) {
  if (error.message.includes('An approved copy already exists')) throw error;
}
await fs.writeFile(outputPath, JSON.stringify(approved, null, 2) + '\n');
const itemCount = approved.sections.reduce((sum, section) => sum + section.items.length, 0);
console.log(JSON.stringify({
  status: 'approved',
  bookId,
  unitNumber,
  unitTitle: approved.unitTitle,
  sourcePdfRange: { start, end },
  sourceGateStatus: sourceGate.status,
  qualityScore: audit.score,
  warnings: audit.warnings,
  sections: approved.sections.map((section) => ({ type: section.type, items: section.items.length })),
  itemCount,
  reviewedBy: reviewerName,
  outputPath
}, null, 2));
