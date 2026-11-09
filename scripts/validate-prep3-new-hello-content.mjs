import { readFile } from 'node:fs/promises';

const file = 'content-imports/preparatory/new-hello/Prep_3_New_Hello_Units_1_to_6_Full_Curriculum.html';
const html = await readFile(file, 'utf8');
const failures = [];
const questions = [...html.matchAll(/\{\s*q\s*:\s*"([^"]+)"\s*,\s*opts\s*:\s*\[([^\]]+)\]\s*,\s*c\s*:\s*(\d+)\s*,\s*exp\s*:\s*"([^"]*)"\s*\}/g)];
if (questions.length !== 305) failures.push(`Expected 305 authored MCQs across six units; found ${questions.length}.`);
const answerDistribution = {};
for (const [index, match] of questions.entries()) {
  const [, stem, rawOptions, rawCorrect, explanation] = match;
  let options = [];
  try { options = JSON.parse('[' + rawOptions + ']'); }
  catch { failures.push(`Question ${index + 1}: options are not valid JSON strings.`); continue; }
  const correct = Number(rawCorrect);
  if (options.length < 3 || options.length > 4) failures.push(`Question ${index + 1}: expected 3 or 4 choices, found ${options.length}.`);
  if (new Set(options.map((option) => String(option).trim().toLowerCase())).size !== options.length) failures.push(`Question ${index + 1}: duplicate choices.`);
  if (!Number.isInteger(correct) || correct < 0 || correct >= options.length) failures.push(`Question ${index + 1}: correct answer index is outside the options.`);
  if (!explanation.trim() || explanation.trim().length < 8) failures.push(`Question ${index + 1}: explanation is missing or too short.`);
  if (/^(Which sentence is correct\?|Choose the correct question\.)$/i.test(stem.trim())) failures.push(`Question ${index + 1}: generic question stem needs a precise learning target.`);
  answerDistribution[correct] = (answerDistribution[correct] || 0) + 1;
}
const oldWeakExplanations = [
  'تعريف الكلمة Peaceful.', 'مذكور في السطر الأول.', 'مذكور في نهاية القطعة.',
  'مذكور في آخر جملة في المحادثة.', 'مذكور في بداية الفقرة.',
  'خان الخليلي مذكور في القطعة.', 'مذكور في أخر جملة.', 'ورد في النص: On Friday.'
];
for (const phrase of oldWeakExplanations) if (html.includes(phrase)) failures.push('A previously flagged weak explanation remains: ' + phrase);
if (!html.includes('محتوى تدريبي من إعداد المعلم — مسودة للمراجعة')) failures.push('Teacher-authored draft label for Units 3–6 is missing.');
if (html.includes('معتمد رسمياً وفق مواصفات وزارة التربية والتعليم')) failures.push('Unsupported Ministry approval claim must not appear in the report.');
if (!html.includes('Fisher-Yates') || !html.includes('correctDisplayIndex') || !html.includes('chosenIdx === correctIdx')) {
  failures.push('Quiz option randomization is not visibly tied to the correct displayed answer index.');
}
if (failures.length) {
  console.error('Prep 3 New Hello content validation failed:');
  for (const failure of failures) console.error(' - ' + failure);
  process.exit(1);
}
console.log(`Prep 3 New Hello content QA passed: ${questions.length} MCQs, valid option sets and answer keys, explanations, draft provenance, and answer-preserving randomization.`);
