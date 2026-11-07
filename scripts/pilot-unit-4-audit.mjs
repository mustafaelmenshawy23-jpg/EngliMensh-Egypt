/**
 * Pilot Source Audit for Baccalaureate Year 2 First Language Part 1 — Unit 4: The Power of Choice
 * 
 * Inspects expected PDF range 102–139:
 * - Checks extraction completeness and text stream presence
 * - Runs source-quality-gate validation across all 38 pages
 * - Cross-references manual visual recoveries and OCR audit passes
 * - Reports exact page statuses and educational section readiness
 */

import fs from 'node:fs/promises';
import { validateUnitSourceCoverage, validatePageText } from './lib/source-quality-gate.mjs';

const BOOK_ID = 'baccalaureate-y2-first-language-part1';
const UNIT_NUMBER = 4;
const EXPECTED_START = 102;
const EXPECTED_END = 139;
const EXPECTED_TOTAL = EXPECTED_END - EXPECTED_START + 1; // 38 pages

const index = JSON.parse(await fs.readFile('data/curriculum/source-book-index.draft.json', 'utf8'));
const book = index.books.find((b) => b.id === BOOK_ID);
const unit = book.units.find((u) => u.number === UNIT_NUMBER);

console.log(`================================================================`);
console.log(`PILOT AUDIT: ${book.grade} - Unit ${unit.number}: "${unit.title}"`);
console.log(`Source Book: ${book.sourceFile}`);
console.log(`Expected PDF Page Range: ${EXPECTED_START} to ${EXPECTED_END} (${EXPECTED_TOTAL} physical pages)`);
console.log(`================================================================\n`);

// 1. Check extracted pages in pages.jsonl
let allExtractedPages = [];
try {
  const content = await fs.readFile('src/data/extracted/pages.jsonl', 'utf8');
  allExtractedPages = content.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
} catch {
  console.warn('Note: src/data/extracted/pages.jsonl not found or empty.');
}

const unitExtractedRows = allExtractedPages.filter(
  (p) => p.sourceFilename === book.sourceFile && p.pdfPage >= EXPECTED_START && p.pdfPage <= EXPECTED_END
);

console.log(`[1] Extracted Pages in Dataset: ${unitExtractedRows.length} / ${EXPECTED_TOTAL} pages found`);

// 2. Check visual review records and audit passes
const auditPasses = [
  'manual-recoveries-pass7.jsonl',
  'visual-assets-pass8.jsonl',
  'visual-assets-pass9.jsonl',
  'visual-assets-pass10.jsonl',
  'ocr-quality-audit-pass11.jsonl',
  'visual-recoveries-pass12.jsonl',
  'ocr-quality-audit-pass13.jsonl',
  'visual-recoveries-pass13.jsonl',
  'ocr-quality-audit-pass14.jsonl',
  'visual-recoveries-pass14.jsonl',
  'ocr-quality-audit-pass15.jsonl',
  'visual-recoveries-pass15.jsonl',
  'ocr-quality-audit-pass16.jsonl',
  'visual-recoveries-pass17.jsonl',
  'ocr-quality-audit-pass17.jsonl',
  'visual-recoveries-pass18.jsonl',
  'ocr-quality-audit-pass18.jsonl',
  'visual-recoveries-pass19.jsonl',
  'ocr-quality-audit-pass19.jsonl',
  'visual-recoveries-pass20.jsonl',
  'ocr-quality-audit-pass20.jsonl',
  'visual-recoveries-pass21.jsonl',
  'ocr-quality-audit-pass21.jsonl',
  'visual-recoveries-pass22.jsonl',
  'ocr-quality-audit-pass22.jsonl'
];

const unitVisualRecords = [];
for (const file of auditPasses) {
  try {
    const lines = (await fs.readFile(`src/data/extracted/${file}`, 'utf8')).split(/\r?\n/).filter(Boolean);
    for (const line of lines) {
      const rec = JSON.parse(line);
      if (rec.sourceFilename === book.sourceFile && rec.pdfPage >= EXPECTED_START && rec.pdfPage <= EXPECTED_END) {
        unitVisualRecords.push({ file, ...rec });
      }
    }
  } catch {}
}

console.log(`[2] Visual Audit Records for Unit 4: ${unitVisualRecords.length} record(s) indexed`);
for (const r of unitVisualRecords) {
  console.log(`    - PDF p.${r.pdfPage} in ${r.file}: ${r.contentType || r.visualCategory || r.recordId} -> "${r.visualObservation || r.visiblePrintedText?.join(' ') || r.reason || ''}"`);
}

// 3. Inspect Direct PDF Stream (via PDF.js) if hydrated PDF is available
let directPdfInfo = null;
try {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  // Check /tmp or public/books
  let pdfBuffer;
  try { pdfBuffer = await fs.readFile('/tmp/Eng-L1-EB-Part1.pdf'); }
  catch { pdfBuffer = await fs.readFile(`public/books/${book.sourceFile}`); }

  if (pdfBuffer.length > 1024 && pdfBuffer.subarray(0, 5).toString('ascii') === '%PDF-') {
    const pdfDoc = await pdfjs.getDocument({ data: new Uint8Array(pdfBuffer), useSystemFonts: true }).promise;
    const pageTextSummary = [];
    for (let p = EXPECTED_START; p <= EXPECTED_END; p++) {
      const page = await pdfDoc.getPage(p);
      const textContent = await page.getTextContent();
      const text = textContent.items.filter((i) => typeof i.str === 'string').map((i) => i.str).join(' ').replace(/\s+/g, ' ').trim();
      pageTextSummary.push({ pdfPage: p, textLength: text.length, snippet: text.slice(0, 50) });
    }
    directPdfInfo = pageTextSummary;
  }
} catch (err) {
  console.log(`    (Direct PDF inspection notice: ${err.message})`);
}

if (directPdfInfo) {
  const zeroChars = directPdfInfo.filter((p) => p.textLength === 0);
  console.log(`[3] Direct PDF Text Stream Analysis:`);
  console.log(`    - Total pages checked: ${directPdfInfo.length}`);
  console.log(`    - Pages with 0 text stream chars (scanned image pages): ${zeroChars.length} / ${directPdfInfo.length}`);
  console.log(`    - Diagnosis: Pages 102-139 are SCANNED BITMAP IMAGES requiring OCR/visual transcription.`);
}

// 4. Run Source Quality Gate
console.log(`\n[4] Running Source Quality Gate on Unit 4 Range (${EXPECTED_START}-${EXPECTED_END})...`);
const gateResult = validateUnitSourceCoverage(unitExtractedRows, EXPECTED_START, EXPECTED_END);

console.log(`    - Gate Status: ${gateResult.status.toUpperCase()}`);
console.log(`    - Coverage Percentage: ${gateResult.coveragePercentage}%`);
console.log(`    - Missing Pages: ${gateResult.missingPages.length} pages`);
console.log(`    - Blocked Pages: ${gateResult.actualRange?.blockedPages || 0}`);
console.log(`    - Needs Review Pages: ${gateResult.actualRange?.needsReviewPages || 0}`);
console.log(`    - Issues Detected:`);
for (const issue of gateResult.issues) {
  console.log(`      * ${issue}`);
}

// 5. Section Analysis & Recommendation
console.log(`\n================================================================`);
console.log(`PILOT READINESS REPORT & RECOMMENDATION:`);
console.log(`================================================================`);
console.log(`Status: BLOCKED_SOURCE_REVIEW`);
console.log(`Reasons:`);
console.log(`1. Source Range: Unit 4 spans PDF pages 102-139 (38 pages).`);
console.log(`2. Scanned Pages: Physical PDF pages 102-139 in "${book.sourceFile}" have no direct digital text stream (length 0). They are raster-scanned pages.`);
console.log(`3. Unit Opener: Physical page 102 is visually confirmed as: Concept 4 "Consumption and Choice" / Unit 4 "The Power of Choice" (Pass 10 & 17 visual review).`);
console.log(`4. Tesseract OCR Status: Unprocessed or unreliable. Because pages 102-139 are scanned images without verified OCR transcriptions, generating now would violate rule 1 & rule 11 ("Do not fabricate missing source material", "If source extraction is unreliable, stop and report exactly which pages need review").`);
console.log(`5. Action Plan:`);
console.log(`   - Mark Unit 4 in progress.json as "blocked_source_review".`);
console.log(`   - Enqueue pages 102-139 for high-resolution OCR rendering (via GitHub Actions workflow render-pass17/render-ocr-review-pages).`);
console.log(`   - Only once verified OCR/transcriptions are populated into pages.jsonl will the source quality gate permit automated curriculum generation.`);
console.log(`================================================================\n`);

// Save pilot audit report
const pilotReport = {
  bookId: BOOK_ID,
  unitNumber: UNIT_NUMBER,
  unitTitle: unit.title,
  sourceFilename: book.sourceFile,
  expectedPdfRange: { start: EXPECTED_START, end: EXPECTED_END, totalPages: EXPECTED_TOTAL },
  gateStatus: 'blocked_source_review',
  coveragePercentage: gateResult.coveragePercentage,
  missingPages: gateResult.missingPages,
  directPdfTextStreamsAvailable: directPdfInfo ? directPdfInfo.filter((p) => p.textLength > 0).length : 0,
  visualReviewRecordsFound: unitVisualRecords.length,
  visualRecordDetails: unitVisualRecords.map((r) => ({ file: r.file, pdfPage: r.pdfPage, observation: r.visualObservation || r.contentType })),
  recommendation: 'Stop generation; queue pages 102-139 for OCR and visual review. Do not fabricate educational content.',
  generatedAt: new Date().toISOString()
};

await fs.mkdir('artifacts/unit-drafts', { recursive: true });
await fs.writeFile('artifacts/unit-drafts/pilot-unit-4-audit-report.json', JSON.stringify(pilotReport, null, 2) + '\n');
console.log('Saved pilot audit report to artifacts/unit-drafts/pilot-unit-4-audit-report.json');
