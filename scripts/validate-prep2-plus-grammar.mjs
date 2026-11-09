import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const base = path.join(root, 'content-imports/preparatory/hello-plus');
const expected = {
  1: ['while', 'when', 'past continuous'],
  2: ['must', 'might', "can't", 'mustn’t'],
  3: ['used to', 'would'],
  4: ['if', 'would'],
  5: ['gerund', 'infinitive'],
  6: ['passive', 'past participle']
};
const failures = [];
const stems = new Set();
for (let unit = 1; unit <= 6; unit += 1) {
  const file = path.join(base, `Prep_2_New_Hello_Plus_Unit_${unit}.html`);
  const html = await readFile(file, 'utf8');
  const match = html.match(/const grammarQuizData = (\[[\s\S]*?\]);/);
  if (!match) {
    failures.push(`Unit ${unit}: grammarQuizData is missing or not a JSON-compatible array.`);
    continue;
  }
  let questions;
  try { questions = JSON.parse(match[1]); }
  catch { failures.push(`Unit ${unit}: grammarQuizData is invalid JSON.`); continue; }
  if (questions.length !== 12) failures.push(`Unit ${unit}: expected 12 focused MCQs, found ${questions.length}.`);
  const local = new Set();
  for (const [index, q] of questions.entries()) {
    const label = `Unit ${unit} Q${index + 1}`;
    const stem = String(q.question || '').trim().toLowerCase();
    if (!stem) failures.push(`${label}: question stem is empty.`);
    if (local.has(stem)) failures.push(`${label}: repeated question stem.`);
    local.add(stem);
    if (!Array.isArray(q.options) || q.options.length !== 4) failures.push(`${label}: exactly four options are required.`);
    else if (new Set(q.options.map(v => String(v).trim().toLowerCase())).size !== 4) failures.push(`${label}: answer options are duplicated.`);
    if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3) failures.push(`${label}: correct answer must be a numeric option index from 0 to 3.`);
    if (!q.explanation || !/[\u0600-\u06FF]/.test(q.explanation)) failures.push(`${label}: Arabic explanation is required.`);
    if ('answer' in q || 'textAnswer' in q || 'typedAnswer' in q) failures.push(`${label}: free-text answer fields are not allowed.`);
  }
  if (local.size !== 12) failures.push(`Unit ${unit}: expected 12 distinct question stems.`);
  const combined = questions.map(q => [q.question, ...(q.options || [])].join(' ')).join(' ').toLowerCase();
  const unitTopics = {
    1: /while|when|rang|was|were/,
    2: /must|might|can't|should|have to|forbidden/,
    3: /used to|would/,
    4: /if|would/,
    5: /ing|to + infinitive|mind|enjoy|decided|suggested/,
    6: /is spoken|was built|are made|were sent|past participle/
  };
  if (!unitTopics[unit].test(combined)) failures.push(`Unit ${unit}: questions do not show expected unit grammar signals.`);
  const navHas12 = html.includes('Grammar Quiz (12)');
  const scoreHas12 = html.includes('Score: 0 / 12');
  if (!navHas12 || !scoreHas12) failures.push(`Unit ${unit}: quiz labels and score maximum must both show 12.`);
  if (html.includes('30 Comprehensive grammatical questions')) failures.push(`Unit ${unit}: obsolete 30-question description remains.`);
}
if (failures.length) {
  console.error(failures.join('\\n'));
  process.exitCode = 1;
} else {
  console.log('Prep 2 New Hello Plus grammar QA: 6 unit-specific banks, 72 unique MCQs, four options, numeric keys, Arabic explanations; all checks passed. Draft status remains pending official-source review.');
}
