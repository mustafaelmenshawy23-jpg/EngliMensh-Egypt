import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { validateUnitSourceCoverage } from './lib/source-quality-gate.mjs';
import { validateUnitDraftQuality } from './lib/content-quality-validator.mjs';
import { sortUnitCandidates } from './lib/curriculum-order.mjs';

const index = JSON.parse(await fs.readFile('data/curriculum/source-book-index.draft.json', 'utf8'));

let manifest;
try {
  manifest = JSON.parse(await fs.readFile('src/data/extracted/manifest.json', 'utf8'));
} catch {
  manifest = { books: [] };
}

const requestedStart = process.env.START_INDEX?.trim();
const batchSize = Number(process.env.BATCH_SIZE || 5);
const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY secret is required. No offline curriculum fallback is used by the batch workflow.');
}
if ((requestedStart && (!Number.isInteger(Number(requestedStart)) || Number(requestedStart) < 0)) ||
    !Number.isInteger(batchSize) || batchSize < 1 || batchSize > 10) {
  throw new Error('START_INDEX must be empty or >= 0, and BATCH_SIZE must be 1..10.');
}

const candidates = [];
const excludedUnits = [];
for (const book of index.books || []) {
  if (!['student_book', 'workbook', 'commercial_supplement'].includes(book.documentType)) {
    if ((book.units || []).length) excludedUnits.push({ bookId: book.id, reason: 'documentType ' + book.documentType + ' is not a lesson-generation source' });
    continue;
  }
  const units = [...(book.units || [])].sort((a, b) => a.number - b.number);
  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    const next = units[i + 1];
    if (!Number.isInteger(unit.startPdfPage)) {
      excludedUnits.push({ bookId: book.id, unitNumber: unit.number, title: unit.title, reason: 'missing_verified_start_page' });
      continue;
    }
    if (next && (!Number.isInteger(next.startPdfPage) || next.number !== unit.number + 1)) {
      excludedUnits.push({ bookId: book.id, unitNumber: unit.number, title: unit.title, reason: 'ambiguous_next_unit_boundary' });
      continue;
    }
    const manifestBook = manifest.books?.find((b) => b.source?.endsWith('/' + book.sourceFile) || b.source === 'public/books/' + book.sourceFile);
    const end = next ? next.startPdfPage - 1 : manifestBook?.pages;
    if (!Number.isInteger(end) || end < unit.startPdfPage) {
      excludedUnits.push({ bookId: book.id, unitNumber: unit.number, title: unit.title, reason: 'missing_verified_end_page' });
      continue;
    }
    candidates.push({
      bookId: book.id,
      unitNumber: unit.number,
      title: unit.title,
      grade: book.grade || '',
      documentType: book.documentType,
      sourceFilename: book.sourceFile,
      start: unit.startPdfPage,
      end
    });
  }
}

const orderedCandidates = sortUnitCandidates(candidates);
const totalCandidates = orderedCandidates.length;
const stateFile = 'artifacts/unit-drafts/batch-state.json';
const progressFile = 'artifacts/unit-drafts/progress.json';
await fs.mkdir('artifacts/unit-drafts', { recursive: true });

let batchState = { schemaVersion: 1, cursorIndex: 0, attempts: {} };
try {
  const saved = JSON.parse(await fs.readFile(stateFile, 'utf8'));
  if (saved && typeof saved === 'object') {
    batchState = {
      schemaVersion: 1,
      cursorIndex: Number.isInteger(saved.cursorIndex) ? saved.cursorIndex : 0,
      attempts: saved.attempts && typeof saved.attempts === 'object' ? saved.attempts : {}
    };
  }
} catch {}

let extractedPages;
try {
  extractedPages = (await fs.readFile('src/data/extracted/pages.jsonl', 'utf8'))
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
} catch (error) {
  throw new Error('Extraction file src/data/extracted/pages.jsonl is missing or invalid: ' + error.message);
}

const sourceCache = new Map();
const blockedCandidates = [];
const completedCandidates = [];
const eligibleCandidates = [];

for (let i = 0; i < orderedCandidates.length; i++) {
  const unit = orderedCandidates[i];
  const unitId = unit.bookId + '-unit-' + unit.unitNumber;
  const rows = extractedPages.filter(
    (page) => page.sourceFilename === unit.sourceFilename && page.pdfPage >= unit.start && page.pdfPage <= unit.end
  );
  const sourceSignature = createHash('sha256')
    .update(JSON.stringify(rows.map((page) => [page.pdfPage, page.text || ''])))
    .digest('hex');
  const gate = validateUnitSourceCoverage(rows, unit.start, unit.end);
  const file = path.join('artifacts/unit-drafts', unit.bookId + '-unit-' + unit.unitNumber + '.json');
  const priorAttempt = batchState.attempts[unitId];

  if (gate.status === 'blocked') {
    const blocker = {
      unitId,
      bookId: unit.bookId,
      unitNumber: unit.unitNumber,
      title: unit.title,
      expectedRange: { start: unit.start, end: unit.end },
      coveragePercentage: gate.coveragePercentage,
      issues: gate.issues,
      sourceSignature
    };
    blockedCandidates.push(blocker);
    if (priorAttempt?.status !== 'blocked_source_review' || priorAttempt?.sourceSignature !== sourceSignature) {
      batchState.attempts[unitId] = {
        status: 'blocked_source_review',
        sourceSignature,
        lastAttemptAt: new Date().toISOString(),
        issues: gate.issues
      };
    }
    sourceCache.set(unitId, { ...unit, unitId, rows, gate, sourceSignature, file, index: i, eligible: false });
    continue;
  }

  let priorDraft = null;
  try {
    priorDraft = JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {}

  if (priorDraft?.reviewStatus === 'approved') {
    completedCandidates.push({ unitId, status: 'approved_preserved' });
    batchState.attempts[unitId] = {
      ...(priorAttempt || {}),
      status: 'approved_preserved',
      sourceSignature,
      lastAttemptAt: priorAttempt?.lastAttemptAt || null
    };
    sourceCache.set(unitId, { ...unit, unitId, rows, gate, sourceSignature, file, index: i, eligible: false });
    continue;
  }

  if (priorDraft && Array.isArray(priorDraft.sections)) {
    const audit = validateUnitDraftQuality(priorDraft, { start: unit.start, end: unit.end }, rows);
    if (audit.isValid) {
      completedCandidates.push({ unitId, status: 'complete_draft_needs_review', qualityScore: audit.score });
      batchState.attempts[unitId] = {
        ...(priorAttempt || {}),
        status: 'complete_draft_needs_review',
        sourceSignature,
        lastAttemptAt: priorAttempt?.lastAttemptAt || null,
        qualityScore: audit.score
      };
      sourceCache.set(unitId, { ...unit, unitId, rows, gate, sourceSignature, file, index: i, eligible: false });
      continue;
    }
  }

  const retryAt = priorAttempt?.retryAfter ? Date.parse(priorAttempt.retryAfter) : 0;
  if (priorAttempt?.sourceSignature === sourceSignature && retryAt > Date.now()) {
    sourceCache.set(unitId, { ...unit, unitId, rows, gate, sourceSignature, file, index: i, eligible: false, waitingForRetry: true });
    continue;
  }

  const entry = { ...unit, unitId, rows, gate, sourceSignature, file, index: i, eligible: true };
  sourceCache.set(unitId, entry);
  eligibleCandidates.push(entry);
}

const startIndex = requestedStart
  ? Number(requestedStart) % Math.max(1, totalCandidates)
  : batchState.cursorIndex % Math.max(1, totalCandidates);

const selected = [];
let scanned = 0;
while (totalCandidates > 0 && scanned < totalCandidates && selected.length < batchSize) {
  const candidateIndex = (startIndex + scanned) % totalCandidates;
  scanned++;
  const candidate = sourceCache.get(orderedCandidates[candidateIndex].bookId + '-unit-' + orderedCandidates[candidateIndex].unitNumber);
  if (candidate?.eligible) selected.push(candidate);
}
batchState.cursorIndex = totalCandidates > 0 ? (startIndex + scanned) % totalCandidates : 0;

const summary = {
  generatedAt: new Date().toISOString(),
  repository: 'mustafaelmenshawy23-jpg/EngliMensh-Egypt',
  indexedBooks: index.books.length,
  indexedUnits: (index.books || []).reduce((sum, book) => sum + (book.units || []).length, 0),
  safeGenerationCandidates: totalCandidates,
  selected: selected.length,
  cursorIndex: startIndex,
  nextCursorIndex: batchState.cursorIndex,
  batchSize,
  model,
  completedDrafts: completedCandidates.filter((item) => item.status === 'complete_draft_needs_review').length,
  approvedPreserved: completedCandidates.filter((item) => item.status === 'approved_preserved').length,
  blockedSourceReview: blockedCandidates.length,
  excludedUnits: excludedUnits.length,
  pendingCandidates: eligibleCandidates.length,
  results: [],
  blocked: blockedCandidates.map(({ sourceSignature, ...item }) => item),
  excluded: excludedUnits
};

const persist = async () => {
  await fs.writeFile(stateFile, JSON.stringify(batchState, null, 2) + '\n');
  await fs.writeFile(progressFile, JSON.stringify(summary, null, 2) + '\n');
};
await persist();

for (const unit of selected) {
  try {
    console.log('Generating ' + unit.bookId + ' Unit ' + unit.unitNumber + ': ' + unit.title + ' (PDF ' + unit.start + '-' + unit.end + ') using ' + model);
    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['scripts/generate-interactive-unit.mjs'], {
        stdio: 'inherit',
        env: {
          ...process.env,
          BOOK_ID: unit.bookId,
          UNIT_NUMBER: String(unit.unitNumber),
          SOURCE_SIGNATURE: unit.sourceSignature,
          GEMINI_MODEL: model
        }
      });
      child.on('error', reject);
      child.on('exit', (code) => {
        if (code === 0) resolve();
        else reject(new Error('Generator exited with code ' + code));
      });
    });

    const draft = JSON.parse(await fs.readFile(unit.file, 'utf8'));
    const audit = validateUnitDraftQuality(draft, { start: unit.start, end: unit.end }, unit.rows);
    if (!audit.isValid) {
      throw new Error('Post-generation quality validation failed: ' + audit.criticalFailures.join('; '));
    }

    summary.results.push({
      unitId: unit.unitId,
      status: 'generated_needs_review',
      qualityScore: audit.score,
      itemCount: audit.report.itemTotals.totalItems,
      sections: audit.report.sections
    });
    batchState.attempts[unit.unitId] = {
      status: 'generated_needs_review',
      sourceSignature: unit.sourceSignature,
      lastAttemptAt: new Date().toISOString(),
      qualityScore: audit.score
    };
  } catch (error) {
    const status = error.message.includes('BLOCKED_SOURCE_REVIEW')
      ? 'blocked_source_review'
      : error.message.includes('failed quality validation') || error.message.includes('Post-generation quality validation')
        ? 'failed_validation'
        : 'failed';
    const prior = batchState.attempts[unit.unitId];
    const retryHours = Math.min(168, 24 * Math.max(1, Number(prior?.attemptCount || 0) + 1));
    summary.results.push({ unitId: unit.unitId, status, error: error.message });
    batchState.attempts[unit.unitId] = {
      status,
      sourceSignature: unit.sourceSignature,
      lastAttemptAt: new Date().toISOString(),
      retryAfter: new Date(Date.now() + retryHours * 60 * 60 * 1000).toISOString(),
      attemptCount: Number(prior?.attemptCount || 0) + 1,
      error: error.message
    };
    console.error('[' + status + '] ' + unit.unitId + ': ' + error.message);
  }
  await persist();
}

const attemptStatuses = Object.values(batchState.attempts);
summary.stateTotals = {
  generatedNeedsReview: attemptStatuses.filter((item) => item.status === 'generated_needs_review' || item.status === 'complete_draft_needs_review').length,
  approved: attemptStatuses.filter((item) => item.status === 'approved_preserved').length,
  blockedSourceReview: attemptStatuses.filter((item) => item.status === 'blocked_source_review').length,
  failed: attemptStatuses.filter((item) => item.status === 'failed' || item.status === 'failed_validation').length
};
summary.pendingCandidates = Math.max(0, totalCandidates - summary.stateTotals.generatedNeedsReview - summary.stateTotals.approved - summary.stateTotals.blockedSourceReview);
await persist();

console.log(JSON.stringify({
  indexedBooks: summary.indexedBooks,
  indexedUnits: summary.indexedUnits,
  safeGenerationCandidates: totalCandidates,
  selected: summary.selected,
  generated: summary.results.filter((item) => item.status === 'generated_needs_review').length,
  blockedSourceReview: summary.blockedSourceReview,
  completedDrafts: summary.completedDrafts,
  pendingCandidates: summary.pendingCandidates,
  nextCursorIndex: summary.nextCursorIndex,
  progress: progressFile,
  state: stateFile
}, null, 2));

if (summary.results.some((item) => item.status === 'failed' || item.status === 'failed_validation')) {
  process.exitCode = 1;
}
