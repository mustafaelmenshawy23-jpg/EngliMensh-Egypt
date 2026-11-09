import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const builder = await readFile(new URL('./build-preparatory-vocabulary.mjs', import.meta.url), 'utf8');
const app = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
const prep2 = await readFile(new URL('./prep2-interactive-enhancement.js', import.meta.url), 'utf8');
const store = await readFile(new URL('../src/lib/student-profile-store.mjs', import.meta.url), 'utf8');
const lessonPattern = /^Prep_(1|2|3)_New_Hello(_Plus)?_Unit_(\d+)(?:_Complete)?\.html$/i;
const supported = [
  ...Array.from({ length: 6 }, (_, i) => `Prep_1_New_Hello_Unit_${i + 1}.html`),
  ...Array.from({ length: 6 }, (_, i) => `Prep_2_New_Hello_Unit_${i + 1}_Complete.html`),
  ...[1, 2, 3].flatMap((grade) => Array.from({ length: 6 }, (_, i) => `Prep_${grade}_New_Hello_Plus_Unit_${i + 1}.html`))
];
for (const file of supported) assert.ok(lessonPattern.test(file), `Expected standalone assessment lesson: ${file}`);
assert.equal(lessonPattern.test('Prep_2_New_Hello_Unit_1_Complete.html'), true, 'Prep 2 general lessons are recognized and use their separate four-section reporting protocol');
assert.equal(lessonPattern.test('Prep_3_New_Hello_Units_1_to_6_Full_Curriculum.html'), false, 'combined Prep 3 general file uses its own assessment bridge');
assert.match(builder, /const isPrep3Combined = path\.basename\(file\) === 'Prep_3_New_Hello_Units_1_to_6_Full_Curriculum\.html'/);
assert.match(builder, /window\.checkAnswer = function\(quizType/);
assert.match(builder, /grade: 3,/);
assert.match(builder, /correct: userScores\.exam/);

assert.match(builder, /const hasLegacyAssessment = Boolean\(lessonMatch && \/function\\s\+handleQuizAnswer\//);
assert.match(builder, /type: 'englimensh:prep-assessment-progress'/);
assert.match(builder, /grade: \$\{lessonGrade\}/);
assert.match(builder, /path: '\$\{lessonPath\}'/);
assert.match(builder, /unitNumber: \$\{lessonUnitNumber\}/);
assert.match(builder, /attempted: answered\.exam\.size/);
assert.match(builder, /correct: scores\.exam/);
assert.match(app, /event\.source !== frame\.contentWindow/);
assert.match(app, /studentProfiles\.issueCertificate\(profile\.id/);
assert.match(prep2, /englimensh:prep-assessment-section-progress/);
assert.match(prep2, /sectionId: sectionType/);
assert.match(app, /studentProfiles\.recordAssessmentSection\(profile\.id/);
assert.match(app, /if \(result\.sectionCount < 4\)/);
assert.match(store, /recordAssessmentSection\(id, context, sectionId, result\)/);
console.log('Preparatory assessment bridge contract checks passed (all 31 preparatory units now have an assessment-reporting route (Prep 3 general uses its combined source's unit-specific exam)).');
