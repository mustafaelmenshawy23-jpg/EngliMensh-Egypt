import { readFile } from 'node:fs/promises';
import path from 'node:path';

const base = path.join(process.cwd(), 'content-imports/preparatory/hello-plus');
function extractJsonValue(source, marker, label) {
  const markerAt = source.indexOf(marker);
  if (markerAt < 0) throw new Error(`${label}: data declaration is missing`);
  const valueStart = markerAt + marker.length;
  const opening = source[valueStart];
  if (opening !== '[' && opening !== '{') throw new Error(`${label}: expected a JSON array or object`);
  const closing = opening === '[' ? ']' : '}';
  let depth = 0, quoted = false, escaped = false;
  for (let index = valueStart; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') quoted = false;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === opening) depth += 1;
    else if (char === closing && --depth === 0) {
      return JSON.parse(source.slice(valueStart, index + 1));
    }
  }
  throw new Error(`${label}: JSON value is not terminated`);
}

const balancedJsonFixture = extractJsonValue(
  'const sample = [{"svg":"literal ]; inside a quoted value","options":["a","b"]}];',
  'const sample = ',
  'balanced parser self-test'
);
if (balancedJsonFixture[0].svg !== 'literal ]; inside a quoted value' || balancedJsonFixture[0].options.length !== 2) {
  throw new Error('Balanced JSON parser self-test failed.');
}
const failures = [];
function checkAnswerDistribution(bank, label, unit) {
  const counts = [0, 0, 0, 0];
  for (const question of bank) if (Number.isInteger(question.correct) && question.correct >= 0 && question.correct < 4) counts[question.correct] += 1;
  if (Math.max(...counts) > Math.ceil(bank.length / 4)) failures.push(`Unit ${unit} ${label}: correct answers are too concentrated in one option position (${counts.join('/')}).`);
}
const expectedPartsOfSpeech = {
  1: { picturesque: 'adjective', metropolitan: 'adjective', scenic: 'adjective', coastal: 'adjective', archaeological: 'adjective', panoramic: 'adjective' },
  2: { sustainable: 'adjective', promotional: 'adjective' },
  3: { sustainable: 'adjective', futuristic: 'adjective' },
  4: { inspiring: 'adjective', unwavering: 'adjective', triumphant: 'adjective', conquer: 'verb' },
  5: { ingenious: 'adjective', scientific: 'adjective', revolutionize: 'verb' },
  6: { psychological: 'adjective', supportive: 'adjective' }
};
let totalWords = 0;
let totalQuestions = 0;
for (let unit = 1; unit <= 6; unit += 1) {
  const file = path.join(base, `Prep_3_New_Hello_Plus_Unit_${unit}.html`);
  const html = await readFile(file, 'utf8');
  const parse = (name) => extractJsonValue(html, `const ${name} = `, `Unit ${unit}: ${name}`);
  let words, questions, reading, listening, grammar, exam;
  try {
    words = parse('vocabData');
    questions = parse('vocabQuizData');
    reading = parse('readingData');
    listening = parse('listeningData');
    grammar = parse('grammarQuizData');
    exam = parse('examData');
  } catch (error) {
    failures.push(error.message);
    continue;
  }
  for (const [section, bank] of [['vocabulary', questions], ['grammar', grammar], ['exam', exam], ['reading', reading.questions], ['listening', listening.questions]]) {
    checkAnswerDistribution(bank, section, unit);
  }
  for (const [section, data] of [['reading', reading], ['listening', listening]]) {
    if (!Array.isArray(data.questions) || data.questions.length !== 5) failures.push(`Unit ${unit}: ${section} must contain five MCQs.`);
    else for (const [index, q] of data.questions.entries()) {
      if (!Array.isArray(q.options) || q.options.length !== 4 || new Set(q.options).size !== 4) failures.push(`Unit ${unit} ${section} Q${index + 1}: four distinct options required.`);
      if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3) failures.push(`Unit ${unit} ${section} Q${index + 1}: invalid answer key.`);
      if (!/[\u0600-\u06FF]/.test(q.explanation || '')) failures.push(`Unit ${unit} ${section} Q${index + 1}: Arabic explanation required.`);
    }
  }
  if (grammar.length !== 12 || new Set(grammar.map(q => q.question)).size !== 12) failures.push(`Unit ${unit}: grammar practice must contain 12 unique MCQs.`);
  if (exam.length !== 20 || new Set(exam.map(q => q.question)).size !== 20) failures.push(`Unit ${unit}: mixed practice test must contain 20 unique MCQs.`);
  for (const [section, bank] of [['grammar', grammar], ['exam', exam]]) for (const [index, q] of bank.entries()) {
    if (!Array.isArray(q.options) || q.options.length !== 4 || new Set(q.options).size !== 4) failures.push(`Unit ${unit} ${section} Q${index + 1}: four distinct options required.`);
    if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3) failures.push(`Unit ${unit} ${section} Q${index + 1}: invalid answer key.`);
    if (!/[\u0600-\u06FF]/.test(q.explanation || '')) failures.push(`Unit ${unit} ${section} Q${index + 1}: Arabic explanation required.`);
    if (/distractor term|false choice|unrelated word|incorrect choice|false term|essential curriculum term/i.test([q.question, ...(q.options || [])].join(' '))) failures.push(`Unit ${unit} ${section} Q${index + 1}: placeholder content remains.`);
  }
  if (!html.includes('Score: 0 / 12') || !html.includes('Exam Score: 0 / 20')) failures.push(`Unit ${unit}: grammar or exam score maximum does not match the bank.`);
  if (!Array.isArray(reading.paragraphs) || reading.paragraphs.length < 2) failures.push(`Unit ${unit}: reading passage is missing.`);
  if (!Array.isArray(listening.dialogue) || listening.dialogue.length < 4) failures.push(`Unit ${unit}: listening dialogue is missing.`);
  if (words.length !== 22) failures.push(`Unit ${unit}: expected 22 vocabulary entries, found ${words.length}`);
  if (questions.length !== 22) failures.push(`Unit ${unit}: expected 22 vocabulary MCQs, found ${questions.length}`);
  const wordSet = new Set(words.map(item => String(item.word).trim().toLowerCase()));
  if (wordSet.size !== words.length) failures.push(`Unit ${unit}: duplicate vocabulary headwords`);
  for (const [index, item] of words.entries()) {
    const label = `Unit ${unit} word ${index + 1} (${item.word})`;
    const expectedPos = expectedPartsOfSpeech[unit]?.[item.word];
    if (expectedPos && item.pos !== expectedPos) failures.push(`${label}: expected part of speech ${expectedPos}, found ${item.pos}`);
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
