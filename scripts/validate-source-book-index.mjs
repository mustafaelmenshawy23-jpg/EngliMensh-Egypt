import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const indexPath = path.join(root, 'data', 'curriculum', 'source-book-index.draft.json');
const index = JSON.parse(await fs.readFile(indexPath, 'utf8'));
const errors = [];
const ids = new Set();
const indexedFiles = new Set();
let diskPdfCount = 0;
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
    if (indexedFiles.has(book.sourceFile)) errors.push(`${label}: duplicate source filename in the index.`);
    indexedFiles.add(book.sourceFile);
    const pdfPath = path.join(root, 'public', 'books', book.sourceFile || '');
    let bytes;
    try { bytes = await fs.readFile(pdfPath); }
    catch { errors.push(`${label}: source PDF is missing from public/books/.`); continue; }
    const isPdf = bytes.length >= 1024 && bytes.subarray(0, 5).toString('ascii') === '%PDF-';
    const pointerText = bytes.toString('utf8');
    const isLfsPointer = pointerText.startsWith('version https://git-lfs.github.com/spec/v1\\n') &&
      /^oid sha256:[a-f0-9]{64}$/m.test(pointerText) &&
      /^size [1-9][0-9]*$/m.test(pointerText);
    if (!isPdf && !isLfsPointer) {
      errors.push(`${label}: source is neither a hydrated PDF nor a structurally valid Git LFS pointer.`);
    }
    const unitNumbers = new Set();
    const startPages = new Set();
    for (const [unitIndex, unit] of (book.units || []).entries()) {
      if (!Number.isInteger(unit.number) || unit.number < 1 || !unit.title) {
        errors.push(`${label}: invalid unit record #${unitIndex + 1}.`);
      }
      if (unitNumbers.has(unit.number)) errors.push(`${label}: duplicate unit number ${unit.number}.`);
      unitNumbers.add(unit.number);
      if (unit.startPdfPage !== null && (!Number.isInteger(unit.startPdfPage) || unit.startPdfPage < 1)) {
        errors.push(`${label}: unit ${unit.number} has an invalid 1-based PDF page.`);
      }
      if (Number.isInteger(unit.startPdfPage)) {
        if (startPages.has(unit.startPdfPage)) errors.push(`${label}: duplicate unit start page ${unit.startPdfPage}.`);
        startPages.add(unit.startPdfPage);
      }
    }
  }
  const booksDirectory = path.join(root, 'public', 'books');
  const diskPdfs = (await fs.readdir(booksDirectory)).filter((name) => /\\.pdf$/i.test(name));
  diskPdfCount = diskPdfs.length;
  for (const filename of diskPdfs) {
    if (!indexedFiles.has(filename)) errors.push(`${filename}: PDF exists in public/books/ but is not indexed.`);
  }
  for (const filename of indexedFiles) {
    if (!diskPdfs.includes(filename)) errors.push(`${filename}: indexed source PDF is not present in public/books/.`);
  }
}
if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}
console.log(`Source index validation passed: ${index.books.length} indexed books, ${diskPdfCount} PDFs accounted for, ${ids.size} unique IDs, valid PDF/LFS pointers, and unit page references checked.`);
