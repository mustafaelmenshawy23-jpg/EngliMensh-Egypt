import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const archive = process.argv[2] || path.join(root, 'imports/englimensh_primary_full_75_units_2026_2027.zip');
const output = path.join(root, 'src/data/curriculum/primary-connect-html-2026-2027.json');
const member = 'englimensh_primary_full_75_units_2026_2027/js/data.js';

if (!fs.existsSync(archive)) {
  console.error(`Source archive not found: ${archive}`);
  console.error('Place the supplied ZIP in imports/ or pass its path as the first argument.');
  process.exit(1);
}

const source = execFileSync('unzip', ['-p', archive, member], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
const prefix = 'const database =';
if (!source.trimStart().startsWith(prefix)) throw new Error('Unexpected data.js format: database declaration not found.');
const database = JSON.parse(source.trim().replace(/^const database =/, '').trim().replace(/;\\s*$/, ''));

const expectedTracks = [
  { id: 'general', name: 'Connect', match: 'Connect (' },
  { id: 'advanced', name: 'Connect Plus', match: 'Connect Plus (' }
];
const result = {
  schemaVersion: 1,
  academicYear: '2026/2027',
  source: {
    type: 'user_supplied_html_bundle',
    archive: path.basename(archive),
    dataFile: member,
    pageReferences: 'not_provided',
    reviewStatus: 'needs_review'
  },
  tracks: []
};
const counts = { units: 0, vocabulary: 0, vocabularyQuestions: 0, dialogues: 0, speakingQuestions: 0, phonics: 0, readingTexts: 0, grammarRules: 0, grammarQuestions: 0, wordGames: 0, examQuestions: 0, invalidQuestions: 0, answerIndexZero: 0, multipleChoiceQuestions: 0 };

function validateQuestions(items, context) {
  if (!Array.isArray(items)) throw new Error(`Expected question array at ${context}`);
  for (const [index, question] of items.entries()) {
    const options = question.opts;
    if (!Array.isArray(options) || options.length < 2 || !Number.isInteger(question.ans) || question.ans < 0 || question.ans >= options.length) {
      counts.invalidQuestions++;
      throw new Error(`Invalid answer/options at ${context} question ${index + 1}`);
    }
    counts.multipleChoiceQuestions++;
    if (question.ans === 0) counts.answerIndexZero++;
  }
}

for (const trackDef of expectedTracks) {
  const sourceTrackName = Object.keys(database).find((name) => name.startsWith(trackDef.match));
  if (!sourceTrackName) throw new Error(`Missing source track: ${trackDef.name}`);
  const sourceGrades = database[sourceTrackName];
  const track = { id: trackDef.id, name: trackDef.name, grades: [] };

  for (let grade = 1; grade <= 6; grade++) {
    const gradeKey = Object.keys(sourceGrades).find((name) => name.startsWith(`Primary ${grade} (`));
    if (!gradeKey) throw new Error(`Missing ${trackDef.name} Primary ${grade}`);
    const sourceUnits = sourceGrades[gradeKey];
    const units = Object.entries(sourceUnits).map(([sourceTitle, unit]) => {
      const match = sourceTitle.match(/^Unit (\\d+):\\s*(.*)$/);
      if (!match) throw new Error(`Unrecognized unit key: ${sourceTitle}`);
      if (!Array.isArray(unit.vocab) || unit.vocab.length === 0) throw new Error(`Missing vocabulary: ${sourceTitle}`);
      if (!Array.isArray(unit.vocabQuiz) || !Array.isArray(unit.dialogue) || !Array.isArray(unit.speakingQuiz) || !Array.isArray(unit.exam)) {
        throw new Error(`Missing expected activity array: ${sourceTitle}`);
      }
      validateQuestions(unit.vocabQuiz, `${gradeKey}/${sourceTitle}/vocabQuiz`);
      validateQuestions(unit.speakingQuiz, `${gradeKey}/${sourceTitle}/speakingQuiz`);
      validateQuestions(unit.grammar?.quiz || [], `${gradeKey}/${sourceTitle}/grammarQuiz`);
      validateQuestions(unit.exam, `${gradeKey}/${sourceTitle}/exam`);

      counts.units++;
      counts.vocabulary += unit.vocab.length;
      counts.vocabularyQuestions += unit.vocabQuiz.length;
      counts.dialogues += unit.dialogue.length;
      counts.speakingQuestions += unit.speakingQuiz.length;
      counts.phonics += unit.phonics ? 1 : 0;
      counts.readingTexts += unit.readingText ? 1 : 0;
      counts.grammarRules += unit.grammar ? 1 : 0;
      counts.grammarQuestions += unit.grammar?.quiz?.length || 0;
      counts.wordGames += unit.scrambleWords?.length || 0;
      counts.examQuestions += unit.exam.length;

      return {
        number: Number(match[1]),
        title: match[2],
        sourceTitle,
        sourceSpec: unit.spec || '',
        vocabulary: unit.vocab,
        vocabularyQuestions: unit.vocabQuiz,
        dialogue: unit.dialogue,
        speakingQuestions: unit.speakingQuiz,
        phonics: unit.phonics || {},
        readingText: unit.readingText || '',
        grammar: unit.grammar || {},
        wordGames: unit.scrambleWords || [],
        examQuestions: unit.exam,
        source: {
          archive: path.basename(archive),
          dataFile: member,
          unitKey: sourceTitle,
          pageReference: null,
          reviewStatus: 'needs_review'
        }
      };
    }).sort((a, b) => a.number - b.number);

    track.grades.push({ grade, units });
  }
  result.tracks.push(track);
}

if (counts.units !== 75 || counts.vocabulary !== 750 || counts.multipleChoiceQuestions !== 1050) {
  throw new Error(`Unexpected source inventory: ${JSON.stringify(counts)}`);
}
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify({ ...result, validation: counts }, null, 2) + '\\n', 'utf8');
console.log(JSON.stringify({ output: path.relative(root, output), ...counts }, null, 2));
if (counts.answerIndexZero === counts.multipleChoiceQuestions) {
  console.warn('QUALITY WARNING: every source MCQ answer is option 1. The app must shuffle options while preserving the answer key and add independently authored supplementary practice.');
}
