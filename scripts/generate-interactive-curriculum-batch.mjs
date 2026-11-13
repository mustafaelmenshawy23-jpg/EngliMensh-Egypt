import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { validateUnitSourceCoverage } from './lib/source-quality-gate.mjs';
import { validateUnitDraftQuality, REQUIRED_MODULE_TYPES } from './lib/content-quality-validator.mjs';

const index = JSON.parse(await fs.readFile('data/curriculum/source-book-index.draft.json', 'utf8'));

let manifest;
try {
  manifest = JSON.parse(await fs.readFile('src/data/extracted/manifest.json', 'utf8'));
} catch {
  manifest = { books: [] };
}

const startIndex = Number(process.env.START_INDEX || 0);
const batchSize = Number(process.env.BATCH_SIZE || 5);
const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

if (![process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_BACKUP, process.env.GEMINI_API_KEY_BACKUP_2, process.env.GEMINI_API_KEY_BACKUP_3].some(Boolean)) {
  throw new Error('At least one Gemini API key secret is required (primary or backup 1-3).');
}
if (!Number.isInteger(startIndex) || startIndex < 0 || !Number.isInteger(batchSize) || batchSize < 1 || batchSize > 10) {
  throw new Error('START_INDEX must be >= 0 and BATCH_SIZE must be 1..10.');
}

const candidates = [];
for (const book of index.books || []) {
  if (!['student_book', 'workbook', 'commercial_supplement'].includes(book.documentType)) continue;
  const units = [...(book.units || [])].sort((a, b) => a.number - b.number);
  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    const next = units[i + 1];
    if (!Number.isInteger(unit.startPdfPage)) continue;
    if (next && (!Number.isInteger(next.startPdfPage) || next.number !== unit.number + 1)) continue;
    const manifestBook = manifest.books?.find((b) => b.source?.endsWith('/' + book.sourceFile) || b.source === 'public/books/' + book.sourceFile);
    const end = next ? next.startPdfPage - 1 : manifestBook?.pages;
    if (!Number.isInteger(end) || end < unit.startPdfPage) continue;
    candidates.push({ bookId: book.id, unitNumber: unit.number, title: unit.title, start: unit.startPdfPage, end });
  }
}

candidates.sort((a, b) => a.bookId.localeCompare(b.bookId) || a.unitNumber - b.unitNumber);
await fs.mkdir('artifacts/unit-drafts', { recursive: true });

let extractedPages = [];
try {
  extractedPages = (await fs.readFile('src/data/extracted/pages.jsonl', 'utf8'))
    .split(/\\r?\\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
} catch {
  console.warn('src/data/extracted/pages.jsonl not found or empty.');
}

const selected = [];
const selectedIndexes = new Map();
const summary = {
  generatedAt: new Date().toISOString(),
  startIndex,
  batchSize,
  eligibleTotal: candidates.length,
  selected: 0,
  nextStartIndex: startIndex,
  scanned: 0,
  results: []
};

// Resume from the first incomplete unit. Completed drafts are skipped only after
// all nine modules, full page coverage and the current quality validator pass.
for (let candidateIndex = startIndex; candidateIndex < candidates.length && selected.length < batchSize; candidateIndex++) {
  const unit = candidates[candidateIndex];
  const file = path.join('artifacts/unit-drafts', unit.bookId + '-unit-' + unit.unitNumber + '.json');
  const sourceBook = index.books.find((b) => b.id === unit.bookId);
  const unitRows = extractedPages.filter((p) => p.sourceFilename === sourceBook?.sourceFile && p.pdfPage >= unit.start && p.pdfPage <= unit.end);
  summary.scanned++;
  summary.nextStartIndex = candidateIndex + 1;

  let complete = false;
  try {
    const prior = JSON.parse(await fs.readFile(file, 'utf8'));
    const sectionMap = new Map((prior.sections || []).map((section) => [section.type, section]));
    const allSectionsPopulated = REQUIRED_MODULE_TYPES.every((type) => Array.isArray(sectionMap.get(type)?.items) && sectionMap.get(type).items.length > 0);
    const expectedPages = unit.end - unit.start + 1;
    const coverage = new Set(prior.sourceCoverage || []);
    const completeCoverage = coverage.size === expectedPages && Array.from({ length: expectedPages }, (_, index) => unit.start + index).every((page) => coverage.has(page));
    const priorGate = validateUnitSourceCoverage(unitRows, unit.start, unit.end);
    const audit = allSectionsPopulated && completeCoverage && priorGate.status !== 'blocked'
      ? validateUnitDraftQuality(prior, { start: unit.start, end: unit.end }, unitRows)
      : { isValid: false };
    complete = prior.bookId === unit.bookId && prior.unitNumber === unit.unitNumber &&
      ['needs_review', 'ready_for_teacher_review', 'approved'].includes(prior.reviewStatus) &&
      allSectionsPopulated && completeCoverage && priorGate.status !== 'blocked' && audit.isValid;
  } catch {}

  if (complete) {
    summary.results.push({ ...unit, status: 'already_generated' });
    await fs.writeFile('artifacts/unit-drafts/progress.json', JSON.stringify(summary, null, 2) + '\\n');
    continue;
  }

  const gate = validateUnitSourceCoverage(unitRows, unit.start, unit.end);
  if (gate.status === 'blocked') {
    summary.results.push({
      ...unit,
      status: 'blocked_source_review',
      error: 'Source quality gate blocked: ' + gate.issues.join('; '),
      coveragePercentage: gate.coveragePercentage
    });
    console.warn('BLOCKED FOR SOURCE REVIEW ' + unit.bookId + ' Unit ' + unit.unitNumber + ': ' + gate.issues.join('; '));
    await fs.writeFile('artifacts/unit-drafts/progress.json', JSON.stringify(summary, null, 2) + '\\n');
    continue;
  }

  selected.push(unit);
  selectedIndexes.set(unit.bookId + ':' + unit.unitNumber, candidateIndex);
}

summary.selected = selected.length;

for (const unit of selected) {
  const file = path.join('artifacts/unit-drafts', unit.bookId + '-unit-' + unit.unitNumber + '.json');
  try {
    console.log('Generating ' + unit.bookId + ' Unit ' + unit.unitNumber + ': ' + unit.title + ' (PDF ' + unit.start + '-' + unit.end + ') using model ' + model);
    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['scripts/generate-interactive-unit.mjs'], {
        stdio: 'inherit',
        env: { ...process.env, BOOK_ID: unit.bookId, UNIT_NUMBER: String(unit.unitNumber), GEMINI_MODEL: model }
      });
      child.on('error', reject);
      child.on('exit', (code) => {
        if (code === 0) resolve();
        else reject(new Error('Generator exited with code ' + code));
      });
    });
    summary.results.push({ ...unit, status: 'generated', candidateIndex: selectedIndexes.get(unit.bookId + ':' + unit.unitNumber) });
  } catch (error) {
    const isBlocked = error.message.includes('BLOCKED_SOURCE_REVIEW') || error.message.includes('Source quality gate blocked');
    const isValidationFailure = error.message.includes('failed quality validation');
    const status = isBlocked ? 'blocked_source_review' : isValidationFailure ? 'failed_validation' : 'failed';
    summary.results.push({ ...unit, status, error: error.message, candidateIndex: selectedIndexes.get(unit.bookId + ':' + unit.unitNumber) });
    console.error('[' + status.toUpperCase() + '] ' + unit.bookId + ' Unit ' + unit.unitNumber + ': ' + error.message);
  }
  await fs.writeFile('artifacts/unit-drafts/progress.json', JSON.stringify(summary, null, 2) + '\\n');
}

await fs.writeFile('artifacts/unit-drafts/progress.json', JSON.stringify(summary, null, 2) + '\\n');
console.log(JSON.stringify({
  eligibleTotal: summary.eligibleTotal,
  selected: summary.selected,
  generated: summary.results.filter((x) => x.status === 'generated').length,
  skipped: summary.results.filter((x) => x.status === 'already_generated').length,
  blockedForReview: summary.results.filter((x) => x.status === 'blocked_source_review').length,
  failedValidation: summary.results.filter((x) => x.status === 'failed_validation').length,
  failed: summary.results.filter((x) => x.status === 'failed').length,
  progress: 'artifacts/unit-drafts/progress.json'
}, null, 2));

if (summary.results.some((x) => x.status === 'failed')) {
  process.exitCode = 1;
}
