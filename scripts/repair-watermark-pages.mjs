import fs from 'node:fs/promises';
import path from 'node:path';
import { findRepeatedShortTextPages } from './lib/extraction-quality.mjs';

const dataDir = path.join(process.cwd(), 'src', 'data', 'extracted');
const pagesPath = path.join(dataDir, 'pages.jsonl');
const manifestPath = path.join(dataDir, 'manifest.json');
const sourceListPath = path.join(dataDir, 'watermark-repair-sources.txt');

const lines = (await fs.readFile(pagesPath, 'utf8')).split(/\r?\n/).filter(Boolean);
const records = lines.map((line) => JSON.parse(line));
const bySource = new Map();
for (const record of records) {
  if (!bySource.has(record.source)) bySource.set(record.source, []);
  bySource.get(record.source).push(record);
}

const detectedBySource = new Map();
for (const [source, pages] of bySource) {
  const candidates = findRepeatedShortTextPages(pages);
  let detected = 0;
  for (const page of pages) {
    if (!candidates.has(page.pdfPage)) continue;
    if (page.extractionStatus !== 'extracted_needs_review') continue;
    const originalText = String(page.text || '');
    if (!originalText) continue;
    page.preOcrText = page.preOcrText || originalText;
    page.text = '';
    page.extractionStatus = 'empty_or_scanned_needs_ocr';
    page.ocrReason = 'repeated_short_watermark_text';
    page.reviewStatus = 'needs_review';
    detected++;
  }
  if (detected) detectedBySource.set(source, detected);
}

const tempPages = pagesPath + '.tmp';
await fs.writeFile(tempPages, records.map((record) => JSON.stringify(record)).join('\n') + '\n', 'utf8');
await fs.rename(tempPages, pagesPath);

const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
for (const book of manifest.books || []) {
  book.watermarkDetectedPages = detectedBySource.get(book.source) || 0;
  book.ocrQueuePages = records.filter((page) => page.source === book.source &&
    page.extractionStatus === 'empty_or_scanned_needs_ocr').length;
}
manifest.watermarkDetection = {
  algorithm: 'repeated_short_text_within_pdf',
  maxShortTextChars: 250,
  minimumRepeatedPages: 8,
  repeatedPageRatio: 0.25,
  detectedPages: [...detectedBySource.values()].reduce((sum, count) => sum + count, 0),
  detectedSources: [...detectedBySource.keys()],
  generatedAt: new Date().toISOString(),
  policy: 'Repeated short text is preserved in preOcrText, cleared from text, and re-queued for OCR; all OCR output remains needs_review.'
};
manifest.totals = manifest.totals || {};
manifest.totals.watermarkDetectedPages = manifest.watermarkDetection.detectedPages;
manifest.totals.pagesNeedingOcrOrReview = records.filter((page) =>
  page.extractionStatus === 'empty_or_scanned_needs_ocr').length;
const tempManifest = manifestPath + '.tmp';
await fs.writeFile(tempManifest, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
await fs.rename(tempManifest, manifestPath);

const sources = [...detectedBySource.keys()].sort();
await fs.writeFile(sourceListPath, sources.join('\n') + (sources.length ? '\n' : ''), 'utf8');
console.log(JSON.stringify({
  detectedSources: sources,
  detectedPages: manifest.watermarkDetection.detectedPages,
  queuedForOcr: manifest.totals.pagesNeedingOcrOrReview
}, null, 2));
