import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { validateUnitSourceCoverage, summarizeUnitSourceGate } from './lib/source-quality-gate.mjs';
import { validateUnitDraftQuality } from './lib/content-quality-validator.mjs';
import { sortUnitCandidates } from './lib/curriculum-order.mjs';
import { getConfiguredGeminiKeys, getSupportedGeminiModels } from './lib/gemini-config.mjs';
import { isTransientGenerationError, summarizeCandidateProgress } from './lib/curriculum-batch-progress.mjs';

const index = JSON.parse(await fs.readFile('data/curriculum/source-book-index.draft.json', 'utf8'));

let manifest;
try {
  manifest = JSON.parse(await fs.readFile('src/data/extracted/manifest.json', 'utf8'));
} catch {
  manifest = { books: [] };
}

const requestedStart = process.env.START_INDEX?.trim();
const batchSize = Number(process.env.BATCH_SIZE || 5);
const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

function retryDelayFor(error, attemptCount, status = 'failed') {
  const attempts = Math.max(1, Number(attemptCount) || 1);
  const message = String(error?.message || error || '');
  if (status === 'failed_validation' || /failed quality validation|Post-generation quality validation|no structured content/i.test(message)) {
    return attempts === 1 ? 0 : 24 * 60 * 60 * 1000;
  }
  if (isTransientGenerationError(message)) {
    const minutes = Math.min(60, 5 * (2 ** Math.min(attempts - 1, 4)));
    return minutes * 60 * 1000;
  }
  return Math.min(168, 24 * attempts) * 60 * 60 * 1000;
}

const configuredGeminiKeys = getConfiguredGeminiKeys();
if (!configuredGeminiKeys.length) {
  throw new Error('At least one Gemini secret is required: GEMINI_API_KEY, GEMINI_API_KEY_BACKUP, GEMINI_API_KEY_BACKUP_2, or GEMINI_API_KEY_BACKUP_3. No offline curriculum fallback is used by the batch workflow.');
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

let batchState = { schemaVersion: 1, cursorIndex: 0, chainDepth: 0, attempts: {} };
try {
  const saved = JSON.parse(await fs.readFile(stateFile, 'utf8'));
  if (saved && typeof saved === 'object') {
    batchState = {
      schemaVersion: 1,
      cursorIndex: Number.isInteger(saved.cursorIndex) ? saved.cursorIndex : 0,
      chainDepth: Number.isInteger(saved.chainDepth) ? saved.chainDepth : 0,
      attempts: saved.attempts && typeof saved.attempts === 'object' ? saved.attempts : {}
    };
  }
} catch {}

const requestedChainDepth = Number(process.env.CHAIN_DEPTH ?? batchState.chainDepth ?? 0);
batchState.chainDepth = Number.isInteger(requestedChainDepth) && requestedChainDepth >= 0 ? requestedChainDepth : 0;
const modelSequence = getSupportedGeminiModels(model);

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
    const diagnostics = summarizeUnitSourceGate(gate);
    const blocker = {
      unitId,
      bookId: unit.bookId,
      unitNumber: unit.unitNumber,
      title: unit.title,
      expectedRange: { start: unit.start, end: unit.end },
      ...diagnostics,
      sourceSignature
    };
    blockedCandidates.push(blocker);
    if (priorAttempt?.status !== 'blocked_source_review' || priorAttempt?.sourceSignature !== sourceSignature) {
      batchState.attempts[unitId] = {
        status: 'blocked_source_review',
        sourceSignature,
        lastAttemptAt: new Date().toISOString(),
        issues: diagnostics.issues,
        blockedPageCount: diagnostics.blockedPageCount,
        needsReviewPageCount: diagnostics.needsReviewPageCount,
        missingPages: diagnostics.missingPages
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
        qualityScore: audit.score,
        itemCount: audit.report.itemTotals.totalItems,
        sections: audit.report.sections
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
  sourceExtraction: {
    indexedSourceBooks: manifest.books?.length || 0,
    totalPages: manifest.totals?.totalPages ?? null,
    ocrProcessedPages: manifest.totals?.ocrProcessedPages ?? 0,
    ocrReliablePages: manifest.totals?.ocrReliablePages ?? 0,
    ocrUnreliablePages: manifest.totals?.ocrUnreliablePages ?? 0,
    ocrEmptyPages: manifest.totals?.ocrEmptyPages ?? 0,
    ocrErrorPages: manifest.totals?.ocrErrorPages ?? 0,
    pagesNeedingManualVisualReview: manifest.totals?.pagesNeedingManualVisualReview ?? 0
  },
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
    const previousAttempts = Number(batchState.attempts[unit.unitId]?.attemptCount || 0);
    const unitModel = modelSequence[Math.min(previousAttempts, modelSequence.length - 1)] || model;
    console.log('Generating ' + unit.bookId + ' Unit ' + unit.unitNumber + ': ' + unit.title + ' (PDF ' + unit.start + '-' + unit.end + ') using ' + unitModel);
    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['scripts/generate-interactive-unit.mjs'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          BOOK_ID: unit.bookId,
          UNIT_NUMBER: String(unit.unitNumber),
          SOURCE_SIGNATURE: unit.sourceSignature,
          GEMINI_MODEL: unitModel
        }
      });
      let stderrTail = '';
      child.stdout.on('data', (chunk) => process.stdout.write(chunk));
      child.stderr.on('data', (chunk) => {
        const output = chunk.toString();
        process.stderr.write(output);
        stderrTail = (stderrTail + output).slice(-5000);
      });
      child.on('error', reject);
      child.on('exit', (code, signal) => {
        if (code === 0) resolve();
        else {
          const detail = stderrTail.slice(-3500);
          reject(new Error('Generator exited with code ' + code + (signal ? ' (signal ' + signal + ')' : '') + (detail ? ': ' + detail : '')));
        }
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
      qualityScore: audit.score,
      itemCount: audit.report.itemTotals.totalItems,
      sections: audit.report.sections
    };
  } catch (error) {
    const status = error.message.includes('BLOCKED_SOURCE_REVIEW')
      ? 'blocked_source_review'
      : isTransientGenerationError(error.message)
        ? 'failed'
        : 'failed_validation';
    const prior = batchState.attempts[unit.unitId];
    const attemptCount = Number(prior?.attemptCount || 0) + 1;
    const retryDelayMs = retryDelayFor(error, attemptCount, status);
    summary.results.push({ unitId: unit.unitId, status, error: error.message });
    batchState.attempts[unit.unitId] = {
      status,
      sourceSignature: unit.sourceSignature,
      lastAttemptAt: new Date().toISOString(),
      retryAfter: new Date(Date.now() + retryDelayMs).toISOString(),
      attemptCount,
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
const progressState = summarizeCandidateProgress(
  orderedCandidates.map((candidate) => ({ unitId: candidate.bookId + '-unit-' + candidate.unitNumber })),
  batchState.attempts,
  Date.now()
);
summary.pendingCandidates = progressState.pendingCandidates;
summary.waitingForRetry = progressState.waitingForRetry;
summary.stateTotals.waitingForRetry = progressState.waitingForRetry;

const bookProgress = new Map();
for (const candidate of orderedCandidates) {
  const row = bookProgress.get(candidate.bookId) || { bookId: candidate.bookId, totalUnits: 0, statuses: {} };
  row.totalUnits++;
  const status = batchState.attempts[candidate.bookId + '-unit-' + candidate.unitNumber]?.status || 'pending';
  row.statuses[status] = (row.statuses[status] || 0) + 1;
  bookProgress.set(candidate.bookId, row);
}
summary.bookProgress = [...bookProgress.values()].sort((a, b) => a.bookId.localeCompare(b.bookId));

const sectionCoverage = {};
for (const attempt of Object.values(batchState.attempts)) {
  for (const [sectionType, section] of Object.entries(attempt.sections || {})) {
    const row = sectionCoverage[sectionType] || { unitsWithItems: 0, totalItems: 0, validItems: 0 };
    if ((section.itemCount || 0) > 0) row.unitsWithItems++;
    row.totalItems += Number(section.itemCount || 0);
    row.validItems += Number(section.validItems || 0);
    sectionCoverage[sectionType] = row;
  }
}
summary.sectionCoverage = sectionCoverage;

const chainDepth = batchState.chainDepth;
const shouldAutoContinue = summary.pendingCandidates > 0 && chainDepth < 9;
if (shouldAutoContinue) {
  batchState.chainDepth = chainDepth + 1;
  const trigger = {
    repository: 'mustafaelmenshawy23-jpg/EngliMensh-Egypt',
    nextCursorIndex: batchState.cursorIndex,
    chainDepth: batchState.chainDepth,
    pendingCandidates: summary.pendingCandidates,
    generatedAt: new Date().toISOString()
  };
  await fs.writeFile('artifacts/unit-drafts/batch-trigger.json', JSON.stringify(trigger, null, 2) + '\n');
  summary.autoContinuation = { scheduled: true, chainDepth: batchState.chainDepth, reason: 'eligible candidates remain; the trigger commit will queue the next main-branch run' };
} else {
  summary.autoContinuation = { scheduled: false, chainDepth, reason: summary.pendingCandidates === 0 ? 'no eligible candidates remain; waiting-for-retry items stay saved' : 'automatic chain safety cap reached' };
}
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
  waitingForRetry: summary.waitingForRetry,
  nextCursorIndex: summary.nextCursorIndex,
  autoContinuation: summary.autoContinuation,
  progress: progressFile,
  state: stateFile
}, null, 2));

// Per-unit API and quality failures are saved with retry metadata; they must not stop later units in the batch.
