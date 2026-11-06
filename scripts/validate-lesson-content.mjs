import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dataPath = path.join(root, 'src', 'data', 'lessons', 'lessons.draft.json');
const indexPath = path.join(root, 'data', 'curriculum', 'source-book-index.draft.json');
const data = JSON.parse(await fs.readFile(dataPath, 'utf8'));
const index = JSON.parse(await fs.readFile(indexPath, 'utf8'));
const booksById = new Map(index.books.map((book) => [book.id, book]));
const booksByFile = new Map(index.books.map((book) => [book.sourceFile, book]));
const lessonIds = new Set();
const errors = [];

if (data.schemaVersion !== 1 || !['draft', 'review'].includes(data.datasetStatus) || !Array.isArray(data.records)) {
  errors.push('Lesson dataset must use schemaVersion 1, a draft/review status, and a records array.');
}

for (const [i, lesson] of (data.records || []).entries()) {
  const label = lesson.lessonId || `lesson #${i + 1}`;
  if (!lesson.lessonId || lessonIds.has(lesson.lessonId)) errors.push(`${label}: missing or duplicate lessonId.`);
  lessonIds.add(lesson.lessonId);
  const book = booksById.get(lesson.bookId);
  if (!book || booksByFile.get(lesson.sourceFilename) !== book) {
    errors.push(`${label}: bookId and exact sourceFilename must resolve to the same indexed book.`);
    continue;
  }
  if (book.grade !== lesson.grade || book.pathwayId !== lesson.pathwayId) errors.push(`${label}: grade/pathway do not match the indexed source book.`);
  if (!Number.isInteger(lesson.pdfPage) || lesson.pdfPage < 1) errors.push(`${label}: physical PDF page must be a positive 1-based integer.`);
  if (!book.units?.some((unit) => unit.number === lesson.unitNumber)) errors.push(`${label}: unitNumber is not present in the indexed source book.`);
  if (!['primary', 'preparatory', 'secondary', 'egyptian-baccalaureate'].includes(lesson.stage)) errors.push(`${label}: invalid stage.`);
  if (!['needs_review', 'approved', 'rejected'].includes(lesson.reviewStatus)) errors.push(`${label}: invalid reviewStatus.`);
  if (!Array.isArray(lesson.sections)) errors.push(`${label}: sections must be an array.`);
  const sectionIds = new Set();
  for (const section of lesson.sections || []) {
    if (!section.sectionId || sectionIds.has(section.sectionId)) errors.push(`${label}: missing or duplicate sectionId.`);
    sectionIds.add(section.sectionId);
    if (!['vocabulary', 'vocabulary_questions', 'grammar', 'grammar_questions', 'reading', 'listening', 'games', 'speaking', 'writing', 'exercises', 'assessments', 'phonics'].includes(section.type)) errors.push(`${label}: unsupported section type.`);
    if (!Array.isArray(section.items)) errors.push(`${label}: section items must be an array.`);
    const itemIds = new Set();
    for (const item of section.items || []) {
      if (!item.itemId || itemIds.has(item.itemId)) errors.push(`${label}: missing or duplicate itemId in ${section.sectionId}.`);
      itemIds.add(item.itemId);
      if (!['needs_review', 'approved', 'rejected'].includes(item.reviewStatus)) errors.push(`${label}: invalid item reviewStatus.`);
      if (item.sourcePdfPage !== undefined && (!Number.isInteger(item.sourcePdfPage) || item.sourcePdfPage < 1)) errors.push(`${label}: invalid item sourcePdfPage.`);
      if (lesson.reviewStatus === 'approved' && item.reviewStatus !== 'approved') errors.push(`${label}: approved lesson contains an unapproved item.`);
    }
  }
  if (lesson.reviewStatus === 'approved' && (!lesson.reviewedBy || !lesson.reviewedAt || !(lesson.sections || []).some((section) => section.items.length))) {
    errors.push(`${label}: approval requires reviewer, timestamp, and at least one reviewed content item.`);
  }
}
if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}
console.log(`Lesson-content validation passed: ${(data.records || []).length} source-linked lesson record(s); no unapproved item can sit inside an approved lesson.`);
