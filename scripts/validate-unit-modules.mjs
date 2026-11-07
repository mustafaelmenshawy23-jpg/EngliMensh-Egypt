import fs from 'node:fs';

const index = JSON.parse(fs.readFileSync('data/curriculum/source-book-index.draft.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync('src/data/lessons/unit-modules.draft.json', 'utf8'));
const expectedTypes = ['vocabulary', 'vocabulary_questions', 'grammar', 'grammar_questions', 'reading', 'listening', 'speaking', 'games', 'comprehensive_test'];
const errors = [];
const expected = new Map();

for (const book of index.books) {
  for (const unit of book.units || []) {
    expected.set(`${book.id}-unit-${unit.number}`, { book, unit });
  }
}

if (manifest.bookCount !== index.books.length) errors.push('Manifest bookCount does not match the source index.');
if (manifest.unitCount !== expected.size) errors.push('Manifest unitCount does not match indexed units.');
if (JSON.stringify(manifest.sectionTypes) !== JSON.stringify(expectedTypes)) errors.push('Manifest sectionTypes are not the required nine independent modules.');

const seen = new Set();
for (const record of manifest.records || []) {
  const source = expected.get(record.unitId);
  if (!source) { errors.push(`Unknown or duplicate unit record: ${record.unitId}`); continue; }
  if (seen.has(record.unitId)) errors.push(`Duplicate unit record: ${record.unitId}`);
  seen.add(record.unitId);
  const { book, unit } = source;
  if (record.bookId !== book.id || record.sourceFilename !== book.sourceFile ||
      record.pathwayId !== (book.pathwayId ?? null) || record.grade !== (book.grade ?? null) ||
      record.documentType !== book.documentType || record.unitNumber !== unit.number ||
      record.title !== (unit.title ?? `Unit ${unit.number}`) ||
      record.startPdfPage !== (Number.isInteger(unit.startPdfPage) ? unit.startPdfPage : null)) {
    errors.push(`Source metadata mismatch: ${record.unitId}`);
  }
  const actualTypes = (record.sections || []).map(section => section.type);
  if (JSON.stringify(actualTypes) !== JSON.stringify(expectedTypes)) errors.push(`Incorrect module structure: ${record.unitId}`);
  for (const section of record.sections || []) {
    if (!Array.isArray(section.items) || section.items.length !== 0 || section.status !== 'not_populated') {
      errors.push(`Scaffold must remain empty and clearly unpopulated: ${record.unitId}/${section.type}`);
    }
  }
  if (record.reviewStatus !== 'needs_review') errors.push(`Unit must remain needs_review: ${record.unitId}`);
}
for (const id of expected.keys()) if (!seen.has(id)) errors.push(`Missing unit record: ${id}`);

if (errors.length) {
  console.error(errors.join('\\n'));
  process.exit(1);
}
console.log(`Validated ${index.books.length} indexed books and ${expected.size} unit scaffolds with nine separate empty modules each.`);
