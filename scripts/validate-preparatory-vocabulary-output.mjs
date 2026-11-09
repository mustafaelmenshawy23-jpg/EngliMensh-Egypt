import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dataPath = path.join(root, 'src/data/preparatory-vocabulary.json');
const data = JSON.parse(await readFile(dataPath, 'utf8'));
const expectedKeys = [];
for (const grade of [1, 2, 3]) for (const pathway of ['general', 'advanced']) for (let unit = 1; unit <= 6; unit += 1) expectedKeys.push(grade + ':' + pathway + ':' + unit);
const actualKeys = Object.keys(data.units || {});
assert.equal(actualKeys.length, 36, 'Expected exactly 36 preparatory grade/path/unit records after prebuild.');
for (const key of expectedKeys) assert.ok(data.units[key], 'Missing generated preparatory unit: ' + key);

let words = 0;
let photos = 0;
let illustrations = 0;
let missingImages = 0;
let placeholderArabic = 0;
let placeholderDefinitions = 0;
let placeholderExamples = 0;
const issues = [];
for (const [unitKey, unit] of Object.entries(data.units)) {
  assert.ok(Array.isArray(unit.words) && unit.words.length > 0, 'Unit has no generated vocabulary: ' + unitKey);
  for (const item of unit.words) {
    words += 1;
    assert.ok(typeof item.word === 'string' && item.word.trim(), 'Blank vocabulary headword in ' + unitKey);
    assert.ok(['photo', 'svg-illustration', 'missing'].includes(item.imageType), 'Unknown image classification for ' + unitKey + ': ' + item.word);
    if (item.imageType === 'photo') {
      photos += 1;
      assert.ok(item.image && item.imageSource && item.sourceUrl && item.creator && item.license && item.licenseUrl, 'Photo lacks attribution/license metadata: ' + item.word);
      const relative = item.image.replace(/^\\//, '');
      await access(path.join(root, 'public', relative));
    } else if (item.imageType === 'svg-illustration') {
      illustrations += 1;
      assert.ok(typeof item.svg === 'string' && item.svg.includes('<svg'), 'SVG classification has no SVG data: ' + item.word);
    } else {
      missingImages += 1;
      if (item.image) issues.push('Missing image incorrectly has image path: ' + item.word);
    }
    if (!item.arabic || item.arabic === 'مفردة دراسية') placeholderArabic += 1;
    if (!item.definition || /essential curriculum term relating to/i.test(item.definition)) placeholderDefinitions += 1;
    if (!item.example || /word .* is essential when studying/i.test(item.example)) placeholderExamples += 1;
  }
}
assert.equal(issues.length, 0, issues.join('\\n'));
const report = { units: actualKeys.length, words, photos, illustrations, missingImages, placeholderArabic, placeholderDefinitions, placeholderExamples };
console.log('Preparatory vocabulary/media output validation:', JSON.stringify(report));
if (missingImages || placeholderArabic || placeholderDefinitions || placeholderExamples) console.warn('Content/media gaps remain; counts above are not academic approval.');
