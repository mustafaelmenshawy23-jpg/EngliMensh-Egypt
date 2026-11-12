import assert from 'node:assert/strict';
import { validatePageText, validateUnitSourceCoverage } from './lib/source-quality-gate.mjs';

const readablePageWithOneOcrToken = [
  'Unit 2: The garden is full of flowers and green grass.',
  'Look at the beautiful butterfly near the tree.',
  'Students read the short passage and answer questions.',
  'This is an abnormallylongmergedocrwordthatshouldbereviewed but not hide the readable page.'
].join('\n');
const oneLongWord = validatePageText(readablePageWithOneOcrToken);
assert.equal(oneLongWord.status, 'needs_review',
  'one OCR-merged token on a readable page should be reviewable, not a unit-wide blocker');
assert.equal(oneLongWord.metrics.longWordCount, 1);
assert.equal(oneLongWord.metrics.severeLongWordCorruption, false);

const mostlyCorruptPage = 'abnormallylongmergedocrwordthatcannotberead';
assert.equal(validatePageText(mostlyCorruptPage).status, 'blocked',
  'a mostly unreadable page with one extremely long token must remain blocked');

const emptyPage = validatePageText('   ');
assert.equal(emptyPage.status, 'blocked', 'empty/image-only pages still require visual review');

const unit = validateUnitSourceCoverage([
  { pdfPage: 10, text: readablePageWithOneOcrToken },
  { pdfPage: 11, text: 'This is another complete readable page with enough clear English text for a student lesson.' }
], 10, 11);
assert.equal(unit.status, 'needs_review',
  'a unit with complete page coverage and a single review-level OCR token may be drafted but never auto-approved');
assert.equal(unit.coveragePercentage, 100);

console.log('Source quality gate severity tests passed.');
