import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const sourceRoot = path.join(root, 'content-imports/preparatory');
const sourceIndex = JSON.parse(await readFile(path.join(root, 'data/curriculum/source-book-index.draft.json'), 'utf8'));
const unitModules = JSON.parse(await readFile(path.join(root, 'src/data/lessons/unit-modules.draft.json'), 'utf8'));

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(full);
  }
  return files.sort();
}

function normalizeTitle(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

const files = await walk(sourceRoot);
assert.equal(files.length, 31, 'Expected all 31 preserved preparatory HTML source files.');

const records = [];
for (const file of files) {
  const html = await readFile(file, 'utf8');
  const relativeFile = path.relative(root, file).split(path.sep).join('/');
  const title = (html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '').replace(/\s+/g, ' ').trim();
  const flags = [];
  if (/مفردة دراسية|An essential curriculum term|Correct Ministerial Option|Incorrect Distractor|Official target vocabulary term|generateQuiz\(|generateReading\(|generateListening\(|generateUnitVocab\(/i.test(html)) {
    flags.push('synthetic_or_placeholder_content');
  }
  if (/data-bard-client-injected|__initial_auth_token|initialAuthToken/i.test(html)) {
    flags.push('injected_host_runtime_or_credential_marker');
  }
  if (/fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|unpkg\.com/i.test(html)) {
    flags.push('external_font_or_cdn_dependency');
  }
  const initialsVisualCount = (html.match(/<text[^>]*text-anchor=["']middle["'][^>]*>[A-Z]{1,3}<\/text>/gi) || []).length;
  if (initialsVisualCount) flags.push('placeholder_initials_visuals');

  const gradeMatch = path.basename(file).match(/Prep_(\d)_/i);
  const grade = gradeMatch ? Number(gradeMatch[1]) : null;
  const isPlus = /New_Hello_Plus/i.test(path.basename(file));
  const unitMatch = title.match(/\bUnit\s*(\d+)\s*:\s*(.*?)(?:\s*\|\s*EngliMensh)?$/i);
  const unitNumber = unitMatch ? Number(unitMatch[1]) : null;
  const sourceUnitTitle = unitMatch ? unitMatch[2].trim() : null;
  const pathwayId = isPlus ? 'commercial-reference-guides' : 'egypt-preparatory-general';
  const indexedBook = grade
    ? sourceIndex.books.find((book) => book.pathwayId === pathwayId && book.grade === `Preparatory ${grade}` &&
      (isPlus ? book.id.startsWith('helloplus-prep') : book.id.startsWith('prep') && book.documentType === 'student_book'))
    : null;
  const indexedUnit = indexedBook?.units?.find((unit) => unit.number === unitNumber);
  if (unitNumber && indexedBook && indexedUnit && normalizeTitle(sourceUnitTitle) !== normalizeTitle(indexedUnit.title)) {
    flags.push('unit_title_differs_from_indexed_source_book');
  }
  if (isPlus && unitNumber && (!indexedUnit || !indexedBook?.units?.length)) {
    flags.push('new_hello_plus_unit_mapping_missing');
  }
  if (!unitNumber && grade === 3 && !isPlus) flags.push('combined_source_requires_manual_unit_mapping');

  records.push({
    file: relativeFile,
    title,
    grade,
    pathway: isPlus ? 'New Hello Plus' : 'New Hello',
    unitNumber,
    sourceUnitTitle,
    indexedBookId: indexedBook?.id || null,
    indexedUnitTitle: indexedUnit?.title || null,
    flags,
    placeholderInitialsVisualCount: initialsVisualCount
  });
}

const nativePreparatoryModules = unitModules.records.filter((item) => String(item.grade || '').startsWith('Preparatory'));
const nativeSectionSlots = nativePreparatoryModules.flatMap((item) => item.sections || []);
const expectedNativePreparatoryUnits = 3 * 2 * 6;

const summary = {
  expectedNativePreparatoryUnits,
  nativePreparatoryUnitRecordsFound: nativePreparatoryModules.length,
  nativePreparatoryUnitRecordsMissing: Math.max(0, expectedNativePreparatoryUnits - nativePreparatoryModules.length),
  nativePreparatoryUnitsWithAnyContent: nativePreparatoryModules.filter((item) =>
    (item.sections || []).some((section) => Array.isArray(section.items) && section.items.length > 0)).length,
  nativePreparatorySectionSlots: nativeSectionSlots.length,
  populatedNativePreparatorySectionSlots: nativeSectionSlots.filter((section) =>
    Array.isArray(section.items) && section.items.length > 0).length,
  sourceFiles: records.length,
  filesWithFlags: records.filter((item) => item.flags.length).length,
  syntheticOrPlaceholderFiles: records.filter((item) => item.flags.includes('synthetic_or_placeholder_content')).length,
  injectedRuntimeOrCredentialFiles: records.filter((item) => item.flags.includes('injected_host_runtime_or_credential_marker')).length,
  externalDependencyFiles: records.filter((item) => item.flags.includes('external_font_or_cdn_dependency')).length,
  placeholderInitialsVisualFiles: records.filter((item) => item.flags.includes('placeholder_initials_visuals')).length,
  unitTitleMismatchFiles: records.filter((item) => item.flags.includes('unit_title_differs_from_indexed_source_book')).length,
  missingPlusUnitMapFiles: records.filter((item) => item.flags.includes('new_hello_plus_unit_mapping_missing')).length
};

const prep3General = records.find((item) => item.file.endsWith('Prep_3_New_Hello_Units_1_to_6_Full_Curriculum.html'));
assert.ok(prep3General?.flags.includes('injected_host_runtime_or_credential_marker'));
assert.ok(prep3General?.flags.includes('synthetic_or_placeholder_content'));
const prep3PlusFiles = records.filter((item) => /hello-plus\/Prep_3_New_Hello_Plus_Unit_\d+\.html$/.test(item.file));
assert.equal(prep3PlusFiles.length, 6, 'All six Prep 3 New Hello Plus sources must be audited.');
assert.ok(prep3PlusFiles.some((item) => item.flags.includes('synthetic_or_placeholder_content')));
assert.ok(records.some((item) => item.file.endsWith('Prep_1_New_Hello_Unit_1.html') &&
  item.flags.includes('unit_title_differs_from_indexed_source_book')),
  'Known Prep 1 general title mismatch must remain visible to QA.');
assert.ok(records.some((item) => item.file.endsWith('Prep_3_New_Hello_Plus_Unit_3.html') &&
  item.flags.includes('unit_title_differs_from_indexed_source_book')),
  'Known Prep 3 Plus title mismatch must remain visible to QA.');

console.log('Preparatory source and native-module audit (metadata only; no source scripts executed):');
console.log(JSON.stringify({ summary, records }, null, 2));
