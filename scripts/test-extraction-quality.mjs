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
