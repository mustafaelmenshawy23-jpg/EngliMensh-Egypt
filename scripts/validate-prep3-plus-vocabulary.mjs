import { readFile } from 'node:fs/promises';
import path from 'node:path';

const base = path.join(process.cwd(), 'content-imports/preparatory/hello-plus');
const failures = [];
let totalWords = 0;
let totalQuestions = 0;
for (let unit = 1; unit <= 6; unit += 1) {
  const file = path.join(base, `Prep_3_New_Hello_Plus_Unit_${unit}.html`);
  const html = await readFile(file, 'utf8');
  const parse = (name) => {
    const marker = `const ${name} = `;
    const start = html.indexOf(marker);
    if (start < 0) throw new Error(`Unit ${unit}: ${name} missing`);
    const end = html.indexOf('];', start) + 1;
    if (end <= 0) throw new Error(`Unit ${unit}: ${name} array is not terminated`);
    return JSON.parse(html.slice(start + marker.length, end));
  };
  let words, questions;
  try {
    words = parse('vocabData');
    questions = parse('vocabQuizData');
  } catch (error) {
    failures.push(error.message);
    continue;
  }
  if (words.length !== 22) failures.push(`Unit ${unit}: expected 22 vocabulary entries, found ${words.length}`);
  if (questions.length !== 22) failures.push(`Unit ${unit}: expected 22 vocabulary MCQs, found ${questions.length}`);
  const wordSet = new Set(words.map(item => String(item.word).trim().toLowerCase()));
  if (wordSet.size !== words.length) failures.push(`Unit ${unit}: duplicate vocabulary headwords`);
  for (const [index, item] of words.entries()) {
    const label = `Unit ${unit} word ${index + 1} (${item.word})`;
    if (!/[\u0600-\u06FF]/.test(item.arabic || '') || /مفردة دراسية|translation pending/i.test(item.arabic || '')) failures.push(`${label}: Arabic meaning is missing or a placeholder`);
    if (!item.def || /essential curriculum term|relating to .*unit|curriculum term/i.test(item.def)) failures.push(`${label}: generic definition remains`);
    if (!item.example || /is essential when studying|essential curriculum term/i.test(item.example)) failures.push(`${label}: generic example remains`);
    const q = questions[index];
    if (!q) continue;
    if (!q.question || /visual illustration|essential curriculum term/i.test(q.question)) failures.push(`Unit ${unit} vocabulary MCQ ${index + 1}: generic stem remains`);
    if (!Array.isArray(q.options) || q.options.length !== 4 || new Set(q.options.map(x => String(x).toLowerCase())).size !== 4) failures.push(`Unit ${unit} vocabulary MCQ ${index + 1}: four unique options required`);
    if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3) failures.push(`Unit ${unit} vocabulary MCQ ${index + 1}: invalid answer key`);
    else if (q.options[q.correct] !== item.word) failures.push(`Unit ${unit} vocabulary MCQ ${index + 1}: correct option does not match its headword`);
    if (!/[\u0600-\u06FF]/.test(q.explanation || '')) failures.push(`Unit ${unit} vocabulary MCQ ${index + 1}: Arabic explanation required`);
  }
  totalWords += words.length;
  totalQuestions += questions.length;
}
if (failures.length) {
  console.error(failures.join('\\n'));
  process.exitCode = 1;
} else {
  console.log(`Prep 3 New Hello Plus vocabulary QA passed: ${totalWords} translated entries, definitions, examples, and ${totalQuestions} four-option MCQs across six units. This checks language/data quality, not official textbook approval.`);
}
