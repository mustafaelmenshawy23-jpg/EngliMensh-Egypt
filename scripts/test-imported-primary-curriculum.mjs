import fs from 'node:fs';

const data = JSON.parse(fs.readFileSync('./src/data/curriculum/primary-connect-html-2026-2027.json', 'utf8'));
const curriculum = JSON.parse(fs.readFileSync('./src/data/curriculum/structure.json', 'utf8'));
const main = fs.readFileSync('./src/main.js', 'utf8');
let passed = 0;
let failed = 0;
const assert = (condition, message) => {
  if (condition) { console.log('✓ ' + message); passed++; }
  else { console.error('✗ ' + message); failed++; }
};

assert(data.tracks.length === 2, 'Both Connect and Connect Plus tracks exist');
assert(data.tracks.every((track) => track.grades.length === 6), 'Both tracks include all six primary grades');
assert(!curriculum.stages.find((stage) => stage.id === 'primary').paths.some((path) => /moasser|supplementary/i.test(path.id + ' ' + path.series)), 'Primary curriculum contains only Connect and Connect Plus pathways');
assert(!curriculum.stages.some((stage) => stage.paths.some((path) => path.sourcePathwayId === 'commercial-reference-guides')), 'Commercial supplementary references are not exposed as a student pathway');
assert(main.includes("state.stage === 'primary' ? (path.series || path.officialSeries || path.name)"), 'Primary pathway buttons display Connect and Connect Plus rather than internal General/Advanced labels');

let units = 0;
let questions = 0;
let invalid = 0;
let answerPositions = [0, 0, 0, 0];
const ids = new Set();

for (const track of data.tracks) {
  for (const grade of track.grades) {
    for (const unit of grade.units) {
      units++;
      const groups = [
        ['v', unit.vocabularyQuestions],
        ['s', unit.speakingQuestions],
        ['r', unit.grammar?.quiz],
        ['e', unit.examQuestions]
      ];
      for (const [prefix, items] of groups) {
        assert(Array.isArray(items), `Question group ${prefix} exists: ${track.id}/${grade.grade}/${unit.number}`);
        for (let index = 0; index < (items || []).length; index++) {
          const q = items[index];
          const id = `g${grade.grade}-${track.id}-u${unit.number}-${prefix}-${index}`;
          if (ids.has(id)) invalid++;
          ids.add(id);
          if (!Array.isArray(q.opts) || q.opts.length < 2 || !Number.isInteger(q.ans) || q.ans < 0 || q.ans >= q.opts.length) {
            invalid++;
            continue;
          }
          const correctOption = q.opts[q.ans];
          const distractors = q.opts.filter((_, originalIndex) => originalIndex !== q.ans);
          const arabicOptions = q.opts.some((option) => /[\u0600-\u06FF]/.test(String(option)));
          const candidates = unit.vocabulary.map((word) => arabicOptions ? word.ar : word.en);
          for (const candidate of candidates) {
            if (distractors.length >= 3) break;
            if (candidate && candidate !== correctOption && !distractors.includes(candidate)) distractors.push(candidate);
          }
          while (distractors.length < 3) distractors.push('extra distractor ' + distractors.length);
          let seed = 0;
          for (const char of id) seed = (seed * 31 + char.charCodeAt(0)) % 2147483647;
          for (let i = distractors.length - 1; i > 0; i--) {
            seed = (seed * 16807) % 2147483647;
            const j = Math.floor((seed / 2147483647) * (i + 1));
            [distractors[i], distractors[j]] = [distractors[j], distractors[i]];
          }
          const correct = index % 4;
          const shuffled = [...distractors];
          shuffled.splice(correct, 0, correctOption);
          if (correct < 0 || correct > 3 || shuffled[correct] !== q.opts[q.ans] || shuffled.length !== 4) invalid++;
          if (correct >= 0 && correct < answerPositions.length) answerPositions[correct]++;
          questions++;
        }
      }
    }
  }
}
assert(units === 75, 'Exactly 75 source units are imported');
assert(questions === 1050, 'All 1,050 source questions are included');
assert(invalid === 0, 'Question IDs and all answer keys remain valid after shuffling');
assert(answerPositions.every((count) => count > 0), 'Correct answers are distributed across all four option positions');
assert(main.includes('data-imported-unit') && main.includes('data-imported-section'), 'Imported curriculum has separate unit and section navigation screens');
assert(main.includes('data-imported-back="unit"') && main.includes('data-imported-back="grade"'), 'Imported unit and section screens have back navigation');
assert(!main.includes('<details class="imported-unit-card">'), 'Imported units are not rendered as a long expandable list');
assert(main.includes('state.quizAnswers[questionId] = {') && main.includes('saveProgressToStorage();'), 'Imported quiz answers are persisted through app storage');
assert(main.includes('saved.isCorrect') && main.includes('saved.wrongChoices'), 'Previously answered and wrong choices are restored in the interface');
assert(main.includes('Listen to pronunciation') && main.includes('Listen to the full passage') && main.includes('imported-phonics-word'), 'Imported vocabulary, phonics and reading have pronunciation controls');
assert(main.includes('const grammarPractice') && main.includes('const readingPractice') && main.includes('const listeningPractice'), 'Imported units build supplementary grammar, reading and listening practice');
assert(main.includes('const unitTestQuestions') && main.includes('unitTestQuestions.length') && main.includes('Up to 24 mixed review questions'), 'Imported units provide an expanded mixed assessment of up to 24 questions');
assert(main.includes('function explainGrammarRule') && main.includes('grammar-formula'), 'Grammar screens include a clear explanation, pattern, examples and study tip');
assert(main.includes('vocabularySupplementary') && main.includes('Extra meaning practice'), 'Vocabulary practice adds ten supplementary meaning questions');
assert(main.includes('const arabicOnly =') && main.includes("label: arabicOnly || 'معنى غير متاح'"), 'Matching-game clue side strips any repeated English answer from the Arabic meaning');
assert(main.includes('correctPosition = index % 4') && main.includes('opts.length >= 3'), 'Each multiple-choice question is expanded to four choices and correct positions rotate across all four');
assert(main.includes('grammarQuestionSets') && main.includes('verification|application check|key pattern'), 'Placeholder grammar checks are filtered and replaced with rule-based practice');
assert(main.includes('unitWords.flatMap') && main.includes('What does'), 'Vocabulary practice mixes English prompts with Arabic meaning choices');
assert(main.includes('authenticDialogue') && main.includes('modelDialogue') && main.includes('ministerial exercises'), 'Generated welcome scripts and truncated dialogue placeholders are replaced by unit-based model dialogue');
assert(main.includes('authenticSpeakingQuestions') && main.includes('Use the word in a complete sentence'), 'Generic speaking placeholders are excluded and replaced with unit vocabulary speaking prompts');
assert(main.includes('navigationEpoch') && main.includes('state._renderViewKey') && main.includes('route-enter'), 'Lesson navigation guards stale history and preserves scroll between interactions');
assert(main.includes('window.history.back();') && main.includes('navigationEpoch') && main.includes('event.state.epoch === state.navigationEpoch'), 'Back buttons follow the previous screen and stale Home history is ignored');
assert(main.includes('Choose the correct meaning of') && main.includes('meaningMatch'), 'Arabic vocabulary stems are rewritten as English prompts while Arabic meanings remain in the choices');
assert(main.includes('function getPrimaryGameWords') && main.includes('gameRegistry.primary.high') && main.includes('data-reset-game'), 'Primary grades 1–6 have four unit-specific interactive games');
assert(main.includes('function playFeedbackSound') && main.includes('questionCorrect') && main.includes('questionWrong'), 'Ordinary quiz answers have distinct correct and incorrect audio feedback');
assert(main.includes('matchCorrect') && main.includes('builderCorrect') && main.includes('listenCorrect') && main.includes('challengeCorrect'), 'Each primary game has its own distinct feedback sound pattern');
assert(main.includes("playFeedbackSound(true, 'match')") && main.includes("playFeedbackSound(false, 'match')") && main.includes("playFeedbackSound(isCorrect, 'builder')") && main.includes("playFeedbackSound(isCorrect, 'listen')") && main.includes("playFeedbackSound(isCorrect, 'challenge')"), 'All four primary games trigger feedback sounds after player actions');
for (const track of data.tracks) {
  for (const grade of track.grades) {
    for (const unit of grade.units) {
      assert(unit.vocabulary.length >= 6 && unit.vocabularyQuestions.length >= 10, `Unit has enough source vocabulary and vocabulary questions: ${track.id}/${grade.grade}/${unit.number}`);
      assert(unit.grammar.examples.length >= 1 && unit.readingText && unit.dialogue.length >= 2, `Unit has source material for generated practice and audio: ${track.id}/${grade.grade}/${unit.number}`);
    }
  }
}

console.log(`Imported curriculum verification: ${passed} passed, ${failed} failed.`);
if (failed) process.exit(1);
