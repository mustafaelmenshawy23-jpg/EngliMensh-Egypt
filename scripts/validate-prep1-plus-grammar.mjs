import { readFile } from 'node:fs/promises';
import path from 'node:path';

const base = path.join(process.cwd(), 'content-imports/preparatory/hello-plus');
const failures = [];
for (let unit = 1; unit <= 6; unit += 1) {
  const file = path.join(base, `Prep_1_New_Hello_Plus_Unit_${unit}.html`);
  const html = await readFile(file, 'utf8');
  const parseArray = (name) => {
    const marker = `const ${name} = `;
    const start = html.indexOf(marker);
    const end = html.indexOf('];', start) + 1;
    if (start < 0 || end <= 0) return [];
    try { return JSON.parse(html.slice(start + marker.length, end)); } catch { return []; }
  };
  const words = parseArray('vocabData');
  const vocabQuestions = parseArray('vocabQuizData');
  if (words.length !== 22) failures.push(`Unit ${unit}: expected 22 vocabulary entries, found ${words.length}.`);
  for (const [index, word] of words.entries()) if (!word.arabic || !word.def || !word.example) failures.push(`Unit ${unit} word ${index + 1}: Arabic meaning, definition and example required.`);
  if (vocabQuestions.length !== 30) failures.push(`Unit ${unit}: expected 30 vocabulary MCQs, found ${vocabQuestions.length}.`);
  if (new Set(vocabQuestions.map(q => String(q.question).trim().toLowerCase())).size !== vocabQuestions.length) failures.push(`Unit ${unit}: repeated vocabulary question stems remain.`);
  for (const [index, q] of vocabQuestions.entries()) {
    const label = `Unit ${unit} vocabulary Q${index + 1}`;
    if (!Array.isArray(q.options) || q.options.length !== 4 || new Set(q.options.map(x => String(x).trim().toLowerCase())).size !== 4) failures.push(`${label}: four distinct options required.`);
    if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3) failures.push(`${label}: correct answer index must be 0–3.`);
    if (!q.explanation) failures.push(`${label}: explanation is required.`);
  }
  if (!html.includes('Vocab Quiz (30)') || !html.includes('id="vocabQuizScore">Score: 0 / 30')) failures.push(`Unit ${unit}: vocabulary quiz label/score mismatch.`);
  if (/<input[^>]+type=["'](?:text|number)["']|<textarea|contenteditable=/i.test(html)) failures.push(`Unit ${unit}: free-text assessment inputs are not allowed.`);
  const marker = 'const grammarQuizData = ';
  const start = html.indexOf(marker);
  const end = html.indexOf('];', start) + 1;
  if (start < 0 || end <= 0) {
    failures.push(`Unit ${unit}: grammarQuizData is missing or unterminated.`);
    continue;
  }
  let bank;
  try { bank = JSON.parse(html.slice(start + marker.length, end)); }
  catch { failures.push(`Unit ${unit}: grammarQuizData is invalid JSON.`); continue; }
  if (bank.length !== 20) failures.push(`Unit ${unit}: expected 20 grammar MCQs, found ${bank.length}.`);
  if (new Set(bank.map(q => String(q.question).trim().toLowerCase())).size !== 20) failures.push(`Unit ${unit}: repeated grammar question stems remain.`);
  for (const [index, q] of bank.entries()) {
    const label = `Unit ${unit} Q${index + 1}`;
    if (!Array.isArray(q.options) || q.options.length !== 4 || new Set(q.options.map(x => String(x).trim().toLowerCase())).size !== 4) failures.push(`${label}: four distinct options required.`);
    if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3) failures.push(`${label}: correct answer index must be 0–3.`);
    if (!q.explanation) failures.push(`${label}: explanation is required.`);
  }
  if (!html.includes('Grammar Quiz (20)') || !html.includes('id="grammarQuizScore">Score: 0 / 20')) failures.push(`Unit ${unit}: grammar quiz label/score mismatch.`);
}
if (failures.length) {
  console.error(failures.join('\\n'));
  process.exitCode = 1;
} else {
  console.log('Prep 1 New Hello Plus grammar QA passed: 120 distinct MCQs across six units; four unique options, numeric keys, explanations, and matching score labels.');
}
