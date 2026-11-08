import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const sourceRoot = path.join(root, 'content-imports/preparatory');
const main = await readFile(path.join(root, 'src/main.js'), 'utf8');

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

const files = await walk(sourceRoot);
assert.equal(files.length, 31, 'All 31 original preparatory source files must be preserved.');
const names = files.map((file) => path.basename(file));
for (const grade of [1, 2, 3]) {
  const general = grade === 3
    ? names.includes('Prep_3_New_Hello_Units_1_to_6_Full_Curriculum.html')
    : Array.from({ length: 6 }, (_, i) => { const suffix = grade === 2 ? '_Complete' : ''; return names.includes(`Prep_${grade}_New_Hello_Unit_${i + 1}${suffix}.html`); }).every(Boolean);
  assert.ok(general, `New Hello general source coverage exists for Prep ${grade}.`);
  assert.ok(Array.from({ length: 6 }, (_, i) => names.includes(`Prep_${grade}_New_Hello_Plus_Unit_${i + 1}.html`)).every(Boolean), `New Hello Plus source coverage exists for Prep ${grade}.`);
}

assert.ok(!/<iframe\b[^>]*src=["'][^"']*\.html(?:[?#][^"']*)?["']/i.test(main), 'The shipped app must not embed imported HTML documents in an iframe. PDF source previews remain permitted.');
assert.ok(!/content-imports\/preparatory\/.*\.html/i.test(main), 'The shipped app must not load HTML source documents directly.');

const prep2u1 = await readFile(path.join(sourceRoot, 'new-hello/Prep_2_New_Hello_Unit_1_Complete.html'), 'utf8');
const prep2u6 = await readFile(path.join(sourceRoot, 'new-hello/Prep_2_New_Hello_Unit_6_Complete.html'), 'utf8');
const prep3Combined = await readFile(path.join(sourceRoot, 'new-hello/Prep_3_New_Hello_Units_1_to_6_Full_Curriculum.html'), 'utf8');
const vocabularySection = prep2u1.split(/<h2>2\. Vocabulary Quiz/i)[0];
const successCount = (vocabularySection.match(/<strong>\s*\d+\.\s*Success\s*<\/strong>/gi) || []).length;
assert.equal(successCount, 2, 'The known duplicated Success source item must remain visible to QA until verified against the book.');
assert.ok(/<h2>4\. Grammar Quiz \(30 Questions\)/i.test(prep2u6), 'Prep 2 Unit 6 source heading is preserved for question-count audit.');
assert.ok(prep3Combined.includes('Correct Ministerial Option') && prep3Combined.includes('generateQuiz('), 'Synthetic placeholder content in combined Prep 3 general source must remain flagged for exclusion.');
console.log('Preparatory source integrity passed: 31 files, 6 pathways, no iframe runtime. Known source defects are explicitly flagged for academic recovery.');
