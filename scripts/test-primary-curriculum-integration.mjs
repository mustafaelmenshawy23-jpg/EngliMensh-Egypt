import fs from 'node:fs';
import assert from 'node:assert/strict';

const data = JSON.parse(fs.readFileSync('./src/data/curriculum/primary-connect-html-2026-2027.json', 'utf8'));
const curriculum = JSON.parse(fs.readFileSync('./src/data/curriculum/structure.json', 'utf8'));
const main = fs.readFileSync('./src/main.js', 'utf8');
const html = fs.readFileSync('./src/data/curriculum/englimensh_primary_complete_all_units_2026_2027.html', 'utf8');

assert.deepEqual(data.tracks.map((track) => track.id).sort(), ['advanced', 'general']);
assert.equal(data.tracks.length, 2);
for (const track of data.tracks) {
  assert.equal(track.grades.length, 6, track.id + ' must include six grades');
  for (const grade of track.grades) {
    assert.ok(grade.units.length > 0, track.id + ' grade ' + grade.grade + ' must include units');
    for (const unit of grade.units) {
      assert.ok(unit.title && Array.isArray(unit.vocabulary), 'unit title and vocabulary are required');
      for (const group of [unit.vocabularyQuestions, unit.speakingQuestions, unit.grammar?.quiz, unit.examQuestions]) {
        assert.ok(Array.isArray(group), 'all imported question groups must be arrays');
        for (const question of group) {
          assert.ok(Array.isArray(question.opts) && question.opts.length >= 2, 'question must have at least two options');
          assert.ok(Number.isInteger(question.ans) && question.ans >= 0 && question.ans < question.opts.length, 'answer key must point to an existing option');
        }
      }
    }
  }
}
const primary = curriculum.stages.find((stage) => stage.id === 'primary');
assert.ok(primary, 'primary stage must exist');
assert.deepEqual(primary.paths.filter((path) => ['general', 'advanced'].includes(path.id)).map((path) => path.series).sort(), ['Connect', 'Connect Plus']);
assert.ok(main.includes("import primaryHtmlCurriculum from './data/curriculum/primary-connect-html-2026-2027.json'"));
assert.ok(main.includes('function renderPrimaryHtmlLibrary()'));
assert.ok(main.includes('data-primary-unit'));
assert.ok(main.includes('data-primary-back'));
assert.ok(main.includes("paths.filter((item) => ['general', 'advanced'].includes(item.id))"));
assert.ok(html.includes('Primary 2026/2027') || html.includes('المرحلة الابتدائية'), 'original imported HTML source must be retained');
console.log('Primary curriculum integration checks passed: two tracks, six grades each, unit data and answer-key integrity.');
