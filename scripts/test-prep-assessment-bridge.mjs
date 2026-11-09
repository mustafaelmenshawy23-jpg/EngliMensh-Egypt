import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const builder = await readFile(new URL('./build-preparatory-vocabulary.mjs', import.meta.url), 'utf8');
const app = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
const reviewLayer = JSON.parse(await readFile(new URL('../src/data/prep2-new-hello-reviewed-layer.json', import.meta.url), 'utf8'));
const prep2 = await readFile(new URL('./prep2-interactive-enhancement.js', import.meta.url), 'utf8');
const store = await readFile(new URL('../src/lib/student-profile-store.mjs', import.meta.url), 'utf8');
const prep2Unit6 = await readFile(new URL('../content-imports/preparatory/new-hello/Prep_2_New_Hello_Unit_6_Complete.html', import.meta.url), 'utf8');
const prep3Source = await readFile(new URL('../content-imports/preparatory/new-hello/Prep_3_New_Hello_Units_1_to_6_Full_Curriculum.html', import.meta.url), 'utf8');
const lessonPattern = /^Prep_(1|2|3)_New_Hello(_Plus)?_Unit_(\d+)(?:_Complete)?\.html$/i;
const supported = [
  ...Array.from({ length: 6 }, (_, i) => `Prep_1_New_Hello_Unit_${i + 1}.html`),
  ...Array.from({ length: 6 }, (_, i) => `Prep_2_New_Hello_Unit_${i + 1}_Complete.html`),
  ...[1, 2, 3].flatMap((grade) => Array.from({ length: 6 }, (_, i) => `Prep_${grade}_New_Hello_Plus_Unit_${i + 1}.html`))
];
for (const file of supported) assert.ok(lessonPattern.test(file), `Expected standalone assessment lesson: ${file}`);
assert.equal(lessonPattern.test('Prep_2_New_Hello_Unit_1_Complete.html'), true, 'Prep 2 general lessons are recognized and use their separate four-section reporting protocol');
assert.equal(lessonPattern.test('Prep_3_New_Hello_Units_1_to_6_Full_Curriculum.html'), false, 'combined Prep 3 general file uses its own assessment bridge');
assert.ok(builder.includes("const marker = /<\\/body>/i;"), "viewer builder must inject bridge scripts before the HTML body closes");
assert.match(builder, /const isPrep3Combined = path\.basename\(file\) === 'Prep_3_New_Hello_Units_1_to_6_Full_Curriculum\.html'/);
assert.match(builder, /window\.checkAnswer = function\(quizType/);
assert.match(builder, /window\.selectUnit\(unitNumber\)/);
assert.match(builder, /window\.switchSubTab\('exam'\)/);
assert.match(builder, /grade: 3,/);
assert.match(builder, /correct: userScores\.exam/);
assert.match(prep3Source, /function checkAnswer\(quizType/);
assert.match(prep3Source, /let currentUnit = 1/);
assert.match(prep3Source, /currentSubTab === 'exam'/);
assert.ok((prep3Source.match(/exam\s*:\s*\[/g) || []).length >= 6, 'combined Prep 3 source must retain all six unit exam banks');

assert.match(builder, /const prep1Route = hasLegacyAssessment \?/);
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
assert.equal(reviewLayer.units['6'].markupRepairs?.grammar?.['6'], undefined, 'Unit 6 grammar Q6 must remain excluded, not be restored as a scored question.');
assert.match(reviewLayer.units['6'].questionRepairs.grammar['6'], /Intentionally excluded/);
const unit6GrammarStart = prep2Unit6.indexOf('4. Grammar Quiz');
const unit6ReadingStart = prep2Unit6.indexOf('5. Reading Comprehension', unit6GrammarStart);
const unit6GrammarHtml = prep2Unit6.slice(unit6GrammarStart, unit6ReadingStart);
assert.match(unit6GrammarHtml, /<div class=\"question-item\">6\./, 'Source Q6 remains malformed and is intentionally not normalized into a scored item.');
assert.doesNotMatch(unit6GrammarHtml, /<div class=\"question\">\s*6\./, 'Q6 must not be included among active grammar question containers.');
assert.equal((unit6GrammarHtml.match(/class=\"question\"/g) || []).length, 29, 'Unit 6 grammar score denominator must remain 29 active questions.');
assert.match(prep2, /total: activeQuestions\.length/, 'Assessment reporting must use active questions, not the nominal source count.');
assert.match(prep2, /sectionId: sectionType/);
assert.match(app, /studentProfiles\.recordAssessmentSection\(profile\.id/);
assert.match(app, /if \(result\.sectionCount < 4\)/);
assert.match(store, /recordAssessmentSection\(id, context, sectionId, result\)/);
console.log('Preparatory assessment bridge contract checks passed (all 36 preparatory units across 31 source files have an assessment-reporting route).');
