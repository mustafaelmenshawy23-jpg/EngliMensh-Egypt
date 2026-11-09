import { readFile } from 'node:fs/promises';
import path from 'node:path';

const base = path.join(process.cwd(), 'content-imports/preparatory/new-hello');
const failures = [];
const parseArray = (html, name, unit) => {
  const match = html.match(new RegExp(`const ${name} = (\\[[\\s\\S]*?\\]);`));
  if (!match) { failures.push(`Unit ${unit}: ${name} is missing.`); return []; }
  try { return JSON.parse(match[1]); }
  catch { failures.push(`Unit ${unit}: ${name} is invalid JSON.`); return []; }
};
const parseObject = (html, name, unit) => {
  const match = html.match(new RegExp(`const ${name} = (\\{[\\s\\S]*?\\});`));
  if (!match) { failures.push(`Unit ${unit}: ${name} is missing.`); return null; }
  try { return JSON.parse(match[1]); }
  catch { failures.push(`Unit ${unit}: ${name} is invalid JSON.`); return null; }
};
const checkBank = (bank, expected, label, unit) => {
  if (!Array.isArray(bank) || bank.length !== expected) failures.push(`Unit ${unit}: ${label} must contain ${expected} MCQs.`);
  if (!Array.isArray(bank)) return;
  const stems = new Set();
  for (const [index, q] of bank.entries()) {
    const name = `Unit ${unit} ${label} Q${index + 1}`;
    const stem = String(q.question || '').trim().toLowerCase();
    if (!stem || stems.has(stem)) failures.push(`${name}: empty or repeated question stem.`);
    stems.add(stem);
    if (!Array.isArray(q.options) || q.options.length !== 4 || new Set(q.options.map(x => String(x).trim().toLowerCase())).size !== 4) failures.push(`${name}: four distinct options required.`);
    if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3) failures.push(`${name}: numeric answer index 0–3 required.`);
  }
};
for (let unit = 1; unit <= 6; unit += 1) {
  const html = await readFile(path.join(base, `Prep_1_New_Hello_Unit_${unit}.html`), 'utf8');
  const words = parseArray(html, 'vocabData', unit);
  const vocab = parseArray(html, 'vocabQuizData', unit);
  const grammar = parseArray(html, 'grammarQuizData', unit);
  const exam = parseArray(html, 'examData', unit);
  const reading = parseObject(html, 'readingData', unit);
  const listening = parseObject(html, 'listeningData', unit);
  if (words.length !== 22) failures.push(`Unit ${unit}: expected 22 vocabulary entries, found ${words.length}.`);
  for (const [index, word] of words.entries()) {
    if (!String(word.arabic || '').trim() || !String(word.def || '').trim() || !String(word.example || '').trim()) failures.push(`Unit ${unit}: vocabulary entry ${index + 1} needs Arabic, definition and example.`);
  }
  checkBank(vocab, 30, 'vocabulary quiz', unit);
  const grammarExpected = unit <= 2 ? 30 : 20;
  checkBank(grammar, grammarExpected, 'grammar quiz', unit);
  checkBank(exam, 20, 'unit exam', unit);
  if (!reading || !Array.isArray(reading.paragraphs) || reading.paragraphs.length < 2) failures.push(`Unit ${unit}: reading passage needs at least two paragraphs.`);
  if (!listening || !Array.isArray(listening.dialogue) || listening.dialogue.length < 4) failures.push(`Unit ${unit}: listening dialogue needs at least four turns.`);
  checkBank(reading?.questions, 5, 'reading', unit);
  checkBank(listening?.questions, 5, 'listening', unit);
  if (!html.includes(`Grammar Quiz (${grammarExpected})`) || !html.includes(`Score: 0 / ${grammarExpected}`)) failures.push(`Unit ${unit}: grammar quiz label/score does not match the bank.`);
  if (!html.includes('Vocab Quiz (30)') || !html.includes('Score: 0 / 30')) failures.push(`Unit ${unit}: vocabulary quiz label/score does not match the bank.`);
  if (!html.includes('Exam Score: 0 / 20')) failures.push(`Unit ${unit}: exam score label does not match the bank.`);
  if (/<input[^>]+type=["'](?:text|number)["']|<textarea|contenteditable=/i.test(html)) failures.push(`Unit ${unit}: free-text assessment input is not allowed.`);
}
if (failures.length) {
  console.error(failures.join('\\n'));
  process.exitCode = 1;
} else {
  console.log('Prep 1 New Hello QA passed: six units, 132 translated vocabulary entries, unique MCQ banks, reading/listening, exams and no free-text assessment inputs. Official-source review remains separate.');
}
