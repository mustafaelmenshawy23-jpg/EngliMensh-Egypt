import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { validateUnitSourceCoverage } from './lib/source-quality-gate.mjs';
import { validateUnitDraftQuality } from './lib/content-quality-validator.mjs';
import { compareUnitCandidates } from './lib/curriculum-order.mjs';

const index = JSON.parse(await fs.readFile('data/curriculum/source-book-index.draft.json', 'utf8'));
const manifest = JSON.parse(await fs.readFile('src/data/extracted/manifest.json', 'utf8'));
const pageLines = (await fs.readFile('src/data/extracted/pages.jsonl', 'utf8')).split(/\r?\n/).filter(Boolean);
const pages = pageLines.map((line) => JSON.parse(line));
const startIndex = Number(process.env.START_INDEX || 0);
const batchSize = Number(process.env.BATCH_SIZE || 5);
const autoResume = process.env.AUTO_RESUME === 'true';
const retryBlocked = process.env.RETRY_BLOCKED === 'true';
const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const supported = new Set(['student_book', 'workbook', 'commercial_supplement']);
const progressPath = 'artifacts/unit-drafts/progress.json';

if (!Number.isInteger(startIndex) || startIndex < 0 ||
    !Number.isInteger(batchSize) || batchSize < 1 || batchSize > 10) {
  throw new Error('START_INDEX must be >= 0 and BATCH_SIZE must be 1..10.');
}

let priorProgress = {};
try { priorProgress = JSON.parse(await fs.readFile(progressPath, 'utf8')); } catch {}
const priorStates = new Map((priorProgress.unitStates || []).map((state) => [state.unitId, state]));
const manifestFor = (book) => (manifest.books || []).find((entry) =>
  entry.source?.endsWith('/' + book.sourceFile) || entry.source === 'public/books/' + book.sourceFile
);
const indexedFiles = new Set((index.books || []).map((book) => book.sourceFile));
const pdfFiles = (await fs.readdir('public/books')).filter((name) => name.toLowerCase().endsWith('.pdf')).sort();
const unindexedPdfFiles = pdfFiles.filter((name) => !indexedFiles.has(name));
const pagesBySource = new Map();
for (const page of pages) {
  if (!pagesBySource.has(page.sourceFilename)) pagesBySource.set(page.sourceFilename, []);
  pagesBySource.get(page.sourceFilename).push(page);
}

const bookInventory = [];
const unitStates = [];
const candidates = [];

for (const book of index.books || []) {
  const units = [...(book.units || [])].sort((a, b) => a.number - b.number);
  bookInventory.push({
    bookId: book.id,
    sourceFile: book.sourceFile,
    grade: book.grade || null,
    documentType: book.documentType,
    unitCount: units.length,
    status: !units.length
      ? 'no_unit_index_book_level_review_required'
      : supported.has(book.documentType) ? 'tracked_for_unit_generation' : 'book_level_or_reader_review_required'
  });

  for (let position = 0; position < units.length; position += 1) {
    const unit = units[position];
    const next = units[position + 1];
    const state = {
      unitId: book.id + '-unit-' + unit.number,
      bookId: book.id,
      sourceFilename: book.sourceFile,
      grade: book.grade || null,
      documentType: book.documentType,
      unitNumber: unit.number,
      title: unit.title || 'Unit ' + unit.number,
      start: Number.isInteger(unit.startPdfPage) ? unit.startPdfPage : null,
      end: null,
      status: 'not_eligible',
      reason: null
    };

    if (!supported.has(book.documentType)) {
      state.status = 'not_a_unit_generation_document';
      state.reason = 'Document type is not a student book, workbook, or commercial supplement.';
    } else if (!Number.isInteger(unit.startPdfPage)) {
      state.status = 'blocked_missing_start_page';
      state.reason = 'No verified 1-based PDF start page is recorded in the source index.';
    } else if (next && (!Number.isInteger(next.startPdfPage) || next.number !== unit.number + 1)) {
      state.status = 'blocked_ambiguous_boundary';
      state.reason = 'The next unit has no verified consecutive start page; the unit end cannot be delimited safely.';
    } else {
      const pdf = manifestFor(book);
      const end = next ? next.startPdfPage - 1 : pdf?.pages;
      if (!Number.isInteger(end) || end < unit.startPdfPage) {
        state.status = 'blocked_missing_pdf_manifest';
        state.reason = 'The PDF page count or unit end boundary could not be verified.';
      } else {
        state.end = end;
        state.status = 'queued';
        candidates.push(state);
      }
    }
    unitStates.push(state);
  }
}

candidates.sort(compareUnitCandidates);

const sourceRowsByUnit = new Map();
const sourceAudits = new Map();
for (const unit of candidates) {
  const allBookPages = pagesBySource.get(unit.sourceFilename) || [];
  const rows = allBookPages.filter((page) => page.pdfPage >= unit.start && page.pdfPage <= unit.end);
  const audit = validateUnitSourceCoverage(rows, unit.start, unit.end);
  const fingerprint = createHash('sha256')
    .update(rows.map((page) => [
      page.pdfPage,
      page.text || '',
      page.ocrConfidence ?? '',
      page.extractionStatus || ''
    ].join(':')).join('\n'))
    .digest('hex');
  sourceRowsByUnit.set(unit.unitId, rows);
  sourceAudits.set(unit.unitId, audit);

  const state = unitStates.find((item) => item.unitId === unit.unitId);
  const prior = priorStates.get(unit.unitId);
  const draftPath = path.join('artifacts/unit-drafts', unit.unitId + '.json');
  let draft = null;
  try { draft = JSON.parse(await fs.readFile(draftPath, 'utf8')); } catch {}

  if (!audit.ok) {
    state.status = 'blocked_source_review';
    state.reason = 'Source quality/coverage gate failed: ' + JSON.stringify({
      missingPages: audit.missingPages,
      duplicatePages: audit.duplicatePages,
      outOfRangePages: audit.outOfRangePages,
      outOfOrderPages: audit.outOfOrderPages,
      pageIssues: audit.pageIssues.map((item) => ({ pdfPage: item.pdfPage, reasons: item.reasons }))
    });
  } else if (draft?.reviewStatus === 'approved') {
    state.status = 'approved';
    state.reason = 'Draft is marked approved; no automatic publication is performed by this workflow.';
  } else if (draft && validateUnitDraftQuality(draft, { rows, start: unit.start, end: unit.end, grade: unit.grade }).ok) {
    state.status = 'draft_needs_teacher_review';
    state.reason = 'A complete quality-checked draft exists and still requires academic approval.';
  } else if (prior?.status === 'blocked_source_review' &&
             prior.sourceFingerprint === fingerprint && !retryBlocked) {
    state.status = 'blocked_source_review';
    state.reason = 'Previously blocked source pages have not changed; set RETRY_BLOCKED=true only after OCR or visual-review data changes.';
  } else {
    state.status = 'queued';
    state.reason = draft ? 'An earlier draft failed quality validation and will be regenerated.' : 'Eligible and awaiting a generation slot.';
  }
  state.sourceFingerprint = fingerprint;
}

const queue = candidates.filter((unit) => {
  const state = unitStates.find((item) => item.unitId === unit.unitId);
  return state && state.status === 'queued';
});
const selected = autoResume
  ? queue.slice(0, batchSize)
  : candidates.slice(startIndex, startIndex + batchSize).filter((unit) =>
      unitStates.find((state) => state.unitId === unit.unitId)?.status === 'queued'
    );
const results = [];
const runStartedAt = new Date().toISOString();

const progress = {
  schemaVersion: 2,
  generatedAt: runStartedAt,
  run: { startIndex, batchSize, autoResume, model, startedAt: runStartedAt },
  inventorySnapshot: {
    pdfFilesInGitTree: pdfFiles.length,
    indexedBooks: (index.books || []).length,
    indexedUnits: unitStates.length,
    indexedSourcePdfFiles: indexedFiles.size,
    unindexedPdfFiles,
    processedPdfs: (manifest.books || []).filter((book) => book.status === 'processed').length,
    manifestOnlyPdfFiles: (manifest.books || []).filter((book) => !indexedFiles.has(path.basename(book.source || ''))).map((book) => path.basename(book.source || '')),
    unitsWithVerifiedStartPage: unitStates.filter((unit) => Number.isInteger(unit.start)).length,
    unitsMissingVerifiedStartPage: unitStates.filter((unit) => !Number.isInteger(unit.start)).length,
    safelyDelimitedCandidates: candidates.length,
    ambiguousBoundaries: unitStates.filter((unit) => unit.status === 'blocked_ambiguous_boundary').length,
    approvedUnits: unitStates.filter((unit) => unit.status === 'approved').length
  },
  books: bookInventory,
  eligibleTotal: candidates.length,
  selected: selected.length,
  results,
  unitStates,
  statusCounts: {}
};

function refreshCounts() {
  const counts = {};
  for (const state of unitStates) counts[state.status] = (counts[state.status] || 0) + 1;
  progress.statusCounts = counts;
  progress.inventorySnapshot.approvedUnits = counts.approved || 0;
  progress.draftsAwaitingTeacherReview = counts.draft_needs_teacher_review || 0;
  progress.blockedSourceReview = counts.blocked_source_review || 0;
  progress.failedValidation = counts.failed_validation || 0;
  progress.failedGeneration = counts.failed_generation || 0;
  progress.generatedAt = new Date().toISOString();
}

async function saveProgress() {
  refreshCounts();
  await fs.mkdir(path.dirname(progressPath), { recursive: true });
  await fs.writeFile(progressPath, JSON.stringify(progress, null, 2) + '\n', 'utf8');
}

await saveProgress();
if (selected.length && !process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is required for selected generation work. No backup key rotation is used for quota exhaustion.');
}

console.log(JSON.stringify({
  indexedBooks: progress.inventorySnapshot.indexedBooks,
  indexedUnits: progress.inventorySnapshot.indexedUnits,
  pdfFiles: progress.inventorySnapshot.pdfFilesInGitTree,
  eligibleUnits: candidates.length,
  selected: selected.length,
  autoResume,
  statusCounts: progress.statusCounts,
  unindexedPdfFiles
}, null, 2));

let pauseReason = null;
for (const unit of selected) {
  const state = unitStates.find((item) => item.unitId === unit.unitId);
  const rows = sourceRowsByUnit.get(unit.unitId) || [];
  const audit = sourceAudits.get(unit.unitId);
  if (!audit?.ok) {
    state.status = 'blocked_source_review';
    state.reason = 'Source quality/coverage gate failed before generation.';
    results.push({ unitId: unit.unitId, status: state.status, reason: state.reason });
    await saveProgress();
    continue;
  }

  state.status = 'processing';
  state.reason = 'Generation started; output remains an unapproved draft.';
  await saveProgress();

  const childEnv = {
    ...process.env,
    BOOK_ID: unit.bookId,
    UNIT_NUMBER: String(unit.unitNumber),
    GEMINI_MODEL: model
  };

  try {
    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['scripts/generate-interactive-unit.mjs'], {
        stdio: 'inherit',
        env: childEnv
      });
      child.on('error', reject);
      child.on('exit', (code) => code === 0
        ? resolve()
        : reject(new Error('Generator exited with code ' + code)));
    });

    const draftPath = path.join('artifacts/unit-drafts', unit.unitId + '.json');
    const draft = JSON.parse(await fs.readFile(draftPath, 'utf8'));
    const quality = validateUnitDraftQuality(draft, {
      rows,
      start: unit.start,
      end: unit.end,
      grade: unit.grade
    });
    state.qualityScore = quality.score;
    state.qualityStatus = quality.status;
    state.status = quality.ok && draft.reviewStatus === 'needs_review'
      ? 'draft_needs_teacher_review'
      : 'failed_validation';
    state.reason = quality.ok
      ? 'Complete draft saved; teacher review is still mandatory.'
      : quality.errors.join(' | ');
    results.push({
      unitId: unit.unitId,
      status: state.status,
      qualityScore: quality.score,
      qualityErrors: quality.errors
    });
    await saveProgress();
    if (!quality.ok) {
      pauseReason = 'A generated draft failed content validation; stopping this batch for diagnosis.';
      break;
    }
  } catch (error) {
    const message = String(error?.message || error);
    const draftPath = path.join('artifacts/unit-drafts', unit.unitId + '.json');
    let failedDraft = null;
    try { failedDraft = JSON.parse(await fs.readFile(draftPath, 'utf8')); } catch {}
    if (failedDraft?.generationStatus === 'failed_validation' ||
        failedDraft?.qualityAudit?.status === 'failed_validation') {
      state.status = 'failed_validation';
      state.qualityScore = failedDraft.qualityAudit?.score ?? null;
    } else {
      state.status = 'failed_generation';
    }
    state.reason = message;
    results.push({ unitId: unit.unitId, status: state.status, error: message });
    await saveProgress();

    if (/429|RESOURCE_EXHAUSTED|quota|rate limit/i.test(message)) {
      state.status = 'paused_quota';
      state.reason = 'Gemini quota/rate limit reached. The batch stopped without rotating API keys or models.';
      results[results.length - 1].status = 'paused_quota';
      results[results.length - 1].error = state.reason;
      pauseReason = state.reason;
      await saveProgress();
      break;
    }
    if (/503|timeout|timed out|fetch failed|temporarily unavailable/i.test(message)) {
      pauseReason = 'Gemini service was unavailable or timed out; remaining units stay queued for the next run.';
      break;
    }
    if (state.status === 'failed_validation') {
      pauseReason = 'A draft failed validation; remaining units stay queued until the failure is reviewed.';
      break;
    }
  }
}

progress.results = results;
progress.run.completedAt = new Date().toISOString();
progress.run.pauseReason = pauseReason;
await saveProgress();

console.log(JSON.stringify({
  run: progress.run,
  inventorySnapshot: progress.inventorySnapshot,
  eligibleTotal: progress.eligibleTotal,
  selected: progress.selected,
  statusCounts: progress.statusCounts,
  draftsAwaitingTeacherReview: progress.draftsAwaitingTeacherReview,
  blockedSourceReview: progress.blockedSourceReview,
  failedValidation: progress.failedValidation,
  failedGeneration: progress.failedGeneration,
  results
}, null, 2));

if (results.some((result) => result.status === 'failed_validation' || result.status === 'failed_generation')) {
  process.exitCode = 1;
}
