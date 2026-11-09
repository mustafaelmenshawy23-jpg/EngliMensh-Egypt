import { readFile } from 'node:fs/promises';

const file = 'content-imports/preparatory/new-hello/Prep_3_New_Hello_Units_1_to_6_Full_Curriculum.html';
const html = await readFile(file, 'utf8');
const failures = [];
const questionPattern = /\{\s*q\s*:\s*"([^"]+)"\s*,\s*opts\s*:\s*\[([^\]]+)\]\s*,\s*c\s*:\s*(\d+)\s*,\s*exp\s*:\s*"([^"]*)"\s*\}/g;
const questions = [...html.matchAll(questionPattern)];
if (questions.length !== 305) failures.push(`Expected 305 authored MCQs across six units; found ${questions.length}.`);

function readQuestionRecords(source, label, expectedCount) {
  const records = [...source.matchAll(questionPattern)];
  if (records.length !== expectedCount) failures.push(`${label}: expected ${expectedCount} MCQs; found ${records.length}.`);
  const seen = new Set();
  for (const [index, match] of records.entries()) {
    const [, stem, rawOptions, rawCorrect, explanation] = match;
    if (seen.has(stem.trim().toLowerCase())) failures.push(`${label} question ${index + 1}: repeated question stem.`);
    seen.add(stem.trim().toLowerCase());
    let options = [];
    try { options = JSON.parse('[' + rawOptions + ']'); }
    catch { failures.push(`${label} question ${index + 1}: options are not valid JSON strings.`); continue; }
    const correct = Number(rawCorrect);
    if (options.length !== 4) failures.push(`${label} question ${index + 1}: expected exactly four choices, found ${options.length}.`);
    if (new Set(options.map((option) => String(option).trim().toLowerCase())).size !== options.length) failures.push(`${label} question ${index + 1}: duplicate choices.`);
    if (!Number.isInteger(correct) || correct < 0 || correct >= options.length) failures.push(`${label} question ${index + 1}: correct answer index is outside the options.`);
    if (!explanation.trim() || explanation.trim().length < 8) failures.push(`${label} question ${index + 1}: explanation is missing or too short.`);
  }
  return records.length;
}

const unit1Start = html.indexOf('      1: {');
const unit2Start = html.indexOf('      2: {', unit1Start + 1);
const templateStart = html.indexOf('      // Template Data for Units 3 to 6', unit2Start + 1);
if (unit1Start < 0 || unit2Start < 0 || templateStart < 0) {
  failures.push('Could not isolate the original Unit 1 and Unit 2 data blocks.');
} else {
  readQuestionRecords(html.slice(unit1Start, unit2Start), 'Unit 1', 75);
  readQuestionRecords(html.slice(unit2Start, templateStart), 'Unit 2', 70);
}

// Units 3–6 keep a legacy template object for maintainability, but runtime must
// replace each one with a complete teacher-authored draft before rendering.
for (const unit of [3, 4, 5, 6]) {
  const marker = `unitsData[${unit}] = {`;
  const start = html.lastIndexOf(marker);
  if (start < templateStart) {
    failures.push(`Unit ${unit}: missing runtime teacher-authored override after the legacy template.`);
    continue;
  }
  const next = [3, 4, 5, 6].map((n) => html.indexOf(`unitsData[${n}] = {`, start + marker.length))
    .filter((index) => index > start).sort((a, b) => a - b)[0];
  const override = html.slice(start, next > 0 ? next : html.length);
  for (const field of ['vocab:', 'vocabQuiz:', 'grammarGuide:', 'grammarQuiz:', 'reading:', 'listening:', 'exam:']) {
    if (!override.includes(field)) failures.push(`Unit ${unit}: authored override is missing ${field}`);
  }
  if (/مفردة دراسية|Correct Ministerial Option|Identify the word illustrated/i.test(override)) {
    failures.push(`Unit ${unit}: a generic placeholder remains in the active authored override.`);
  }
}

for (const match of questions) {
  const [, stem] = match;
  if (/^(Which sentence is correct\?|Choose the correct question\.)$/i.test(stem.trim())) {
    failures.push('A generic question stem needs a precise learning target: ' + stem);
  }
}
const oldWeakExplanations = [
  'تعريف الكلمة Peaceful.', 'مذكور في السطر الأول.', 'مذكور في نهاية القطعة.',
  'مذكور في آخر جملة في المحادثة.', 'مذكور في بداية الفقرة.',
  'خان الخليلي مذكور في القطعة.', 'مذكور في أخر جملة.', 'ورد في النص: On Friday.'
];
for (const phrase of oldWeakExplanations) if (html.includes(phrase)) failures.push('A previously flagged weak explanation remains: ' + phrase);
if (!html.includes('محتوى تدريبي من إعداد المعلم — مسودة للمراجعة')) failures.push('Teacher-authored draft label for Units 3–6 is missing.');
if (html.includes('معتمد رسمياً وفق مواصفات وزارة التربية والتعليم')) failures.push('Unsupported Ministry approval claim must not appear.');
if (!html.includes('Fisher-Yates') || !html.includes('correctDisplayIndex') || !html.includes('chosenIdx === correctIdx')) {
  failures.push('Quiz option randomization is not visibly tied to the correct displayed answer index.');
}
if (failures.length) {
  console.error('Prep 3 New Hello content validation failed:');
  for (const failure of failures) console.error(' - ' + failure);
  process.exit(1);
}
console.log('Prep 3 New Hello content QA passed: 305 authored MCQs; Unit 1 (75) and Unit 2 (70) have unique stems; Units 3–6 have complete teacher-authored overrides; option sets, keys, explanations, draft provenance, and answer-preserving randomization checked.');
