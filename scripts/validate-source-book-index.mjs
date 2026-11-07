import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const indexPath = path.join(root, 'data', 'curriculum', 'source-book-index.draft.json');
const index = JSON.parse(await fs.readFile(indexPath, 'utf8'));
const errors = [];
const ids = new Set();
const pathways = new Set((index.pathways || []).map((item) => item.id));

if (!Array.isArray(index.books) || index.books.length === 0) {
  errors.push('The source-book index has no books array.');
} else {
  for (const [i, book] of index.books.entries()) {
    const label = book.sourceFile || `book #${i + 1}`;
    if (!book.id || ids.has(book.id)) errors.push(`${label}: missing or duplicate book id.`);
    ids.add(book.id);
    if (!book.sourceFile) errors.push(`${label}: missing exact source filename.`);
    if (!pathways.has(book.pathwayId)) errors.push(`${label}: unknown pathway id ${book.pathwayId}.`);
    if (!book.grade) errors.push(`${label}: missing grade.`);
    const pdfPath = path.join(root, 'public', 'books', book.sourceFile || '');
    let bytes;
    try { bytes = await fs.readFile(pdfPath); }
    catch { errors.push(`${label}: source PDF is missing from public/books/.`); continue; }
    const isPdf = bytes.length >= 1024 && bytes.subarray(0, 5).toString('ascii') === '%PDF-';
    const isLfs = bytes.subarray(0, 120).toString('utf8').startsWith('version https://git-lfs.github.com/spec/v1');
    if (!isPdf && !isLfs) {
      errors.push(`${label}: source is neither a hydrated PDF nor a valid Git LFS pointer.`);
    }
    for (const [unitIndex, unit] of (book.units || []).entries()) {
      if (!Number.isInteger(unit.number) || unit.number < 1 || !unit.title) {
        errors.push(`${label}: invalid unit record #${unitIndex + 1}.`);
      }
      if (unit.startPdfPage !== null && (!Number.isInteger(unit.startPdfPage) || unit.startPdfPage < 1)) {
        errors.push(`${label}: unit ${unit.number} has an invalid 1-based PDF page.`);
      }
    }
  }
}
if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}
console.log(`Source index validation passed: ${index.books.length} books, ${ids.size} unique IDs, all original PDFs hydrated, and unit page references valid.`);
