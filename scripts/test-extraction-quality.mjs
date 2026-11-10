import assert from 'node:assert/strict';
import { findRepeatedShortTextPages } from './lib/extraction-quality.mjs';

const watermark = 'https://t.me/G5_Y5 me/G5_Y5 https://t.me/G5_Y5 https://t.me/G5_Y5';
const repeatedPages = Array.from({ length: 12 }, (_, index) => ({
  pdfPage: index + 1,
  text: watermark
}));
const repeated = findRepeatedShortTextPages(repeatedPages);
assert.equal(repeated.size, 12, 'Repeated short watermark-only text is queued for OCR');

const mixedPages = [
  ...Array.from({ length: 8 }, (_, index) => ({ pdfPage: index + 1, text: watermark })),
  ...Array.from({ length: 4 }, (_, index) => ({
    pdfPage: index + 9,
    text: 'This is a full lesson page with a unique reading passage, vocabulary and several complete sentences for learners.'
  }))
];
const mixed = findRepeatedShortTextPages(mixedPages);
assert.equal(mixed.size, 8, 'Only the repeated short-text pages are flagged');

const normalPages = Array.from({ length: 12 }, (_, index) => ({
  pdfPage: index + 1,
  text: `Page ${index + 1}: This lesson contains unique text and enough detail for students to read and answer questions.`
}));
assert.equal(findRepeatedShortTextPages(normalPages).size, 0,
  'Distinct meaningful lesson pages are not flagged');

const tooFewPages = Array.from({ length: 7 }, (_, index) => ({
  pdfPage: index + 1,
  text: watermark
}));
assert.equal(findRepeatedShortTextPages(tooFewPages).size, 0,
  'Small repeated sets do not trigger the conservative watermark rule');

console.log('Repeated watermark text detection tests passed.');


import { assessExtractionCoverage } from "./lib/extraction-cache-health.mjs";

const expectedSources = ["public/books/one.pdf", "public/books/two.pdf"];
const completeManifest = {
  books: [
    { source: "public/books/one.pdf", status: "processed", pages: 2 },
    { source: "public/books/two.pdf", status: "processed", pages: 1 }
  ]
};
const completeRows = [
  { source: "public/books/one.pdf", pdfPage: 1 },
  { source: "public/books/one.pdf", pdfPage: 2 },
  { source: "public/books/two.pdf", pdfPage: 1 }
];
assert.equal(assessExtractionCoverage({ expectedSources, manifest: completeManifest, pageRows: completeRows }).complete, true,
  "A cache is complete only when every PDF and every physical page is represented exactly once");

const partialManifest = {
  books: [
    { source: "public/books/one.pdf", status: "processed", pages: 2 },
    { source: "public/books/two.pdf", status: "lfs_pointer_not_downloaded", pages: 0 }
  ]
};
assert.equal(assessExtractionCoverage({ expectedSources, manifest: partialManifest, pageRows: completeRows.slice(0, 2) }).needsFullExtraction, true,
  "A restored cache with an LFS pointer must force a full extraction");

assert.equal(assessExtractionCoverage({
  expectedSources,
  manifest: completeManifest,
  pageRows: completeRows.slice(0, 2)
}).needsFullExtraction, true, "A missing physical page must invalidate the cache");

assert.equal(assessExtractionCoverage({
  expectedSources,
  manifest: completeManifest,
  pageRows: [...completeRows, { source: "public/books/one.pdf", pdfPage: 2 }]
}).needsFullExtraction, true, "Duplicate page records must invalidate the cache");

assert.equal(assessExtractionCoverage({
  expectedSources,
  manifest: completeManifest,
  pageRows: completeRows,
  pageParseErrors: 1
}).needsFullExtraction, true, "Malformed extraction records must invalidate the cache");

console.log("Full-book extraction cache coverage tests passed.");
