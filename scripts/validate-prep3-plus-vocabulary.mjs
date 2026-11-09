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
    const valueStart = start + marker.length;
    const objectValue = html[valueStart] === '{';
    const end = objectValue ? html.indexOf('};', valueStart) + 1 : html.indexOf('];', valueStart) + 1;
    if (end <= 0) throw new Error(`Unit ${unit}: ${name} data is not terminated`);
    return JSON.parse(html.slice(valueStart, end));
  };
  let words, questions, reading, listening, grammar, exam;
  try {
    words = parse('vocabData');
    questions = parse('vocabQuizData');
    reading = parse('readingData');
    listening = parse('listeningData');\n    grammar = parse('grammarQuizData');\n    exam = parse('examData');
  } catch (error) {
    failures.push(error.message);
    continue;
  }
  for (const [section, data] of [['reading', reading], ['listening', listening]]) {
    if (!Array.isArray(data.questions) || data.questions.length !== 5) failures.push(`Unit ${unit}: ${section} must contain five MCQs.`);
    else for (const [index, q] of data.questions.entries()) {
      if (!Array.isArray(q.options) || q.options.length !== 4 || new Set(q.options).size !== 4) failures.push(`Unit ${unit} ${section} Q${index + 1}: four distinct options required.`);
      if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3) failures.push(`Unit ${unit} ${section} Q${index + 1}: invalid answer key.`);
      if (!/[\\u0600-\\u06FF]/.test(q.explanation || '')) failures.push(`Unit ${unit} ${section} Q${index + 1}: Arabic explanation required.`);
    }
  }
  if (grammar.length !== 10 || new Set(grammar.map(q => q.question)).size !== 10) failures.push(`Unit ${unit}: grammar practice must contain 10 unique MCQs.`);
  if (exam.length !== 20 || new Set(exam.map(q => q.question)).size !== 20) failures.push(`Unit ${unit}: mixed practice test must contain 20 unique MCQs.`);
  for (const [section, bank] of [['grammar', grammar], ['exam', exam]]) for (const [index, q] of bank.entries()) {
    if (!Array.isArray(q.options) || q.options.length !== 4 || new Set(q.options).size !== 4) failures.push(`Unit ${unit} ${section} Q${index + 1}: four distinct options required.`);
    if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3) failures.push(`Unit ${unit} ${section} Q${index + 1}: invalid answer key.`);
    if (/distractor term|false choice|unrelated word|incorrect choice|false term|essential curriculum term/i.test([q.question, ...(q.options || [])].join(' '))) failures.push(`Unit ${unit} ${section} Q${index + 1}: placeholder content remains.`);
  }
  if (!html.includes('Score: 0 / 10') || !html.includes('Exam Score: 0 / 20')) failures.push(`Unit ${unit}: grammar or exam score maximum does not match the bank.`);
  if (!Array.isArray(reading.paragraphs) || reading.paragraphs.length < 2) failures.push(`Unit ${unit}: reading passage is missing.`);
  if (!Array.isArray(listening.dialogue) || listening.dialogue.length < 4) failures.push(`Unit ${unit}: listening dialogue is missing.`);
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
