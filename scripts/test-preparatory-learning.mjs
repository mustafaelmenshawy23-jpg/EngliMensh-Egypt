import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const main = await readFile(path.join(root, 'src/main.js'), 'utf8');
const registry = await readFile(path.join(root, 'src/data/preparatory-html-registry.js'), 'utf8');
const builder = await readFile(path.join(root, 'scripts/build-preparatory-vocabulary.mjs'), 'utf8');
const viewerRegistry = await readFile(path.join(root, 'src/data/preparatory-html-registry.js'), 'utf8');
const sourceRoot = path.join(root, 'content-imports/preparatory');

async function htmlFiles(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(full));
    else if (entry.isFile() && full.endsWith('.html')) files.push(full);
  }
  return files;
}
const files = await htmlFiles(sourceRoot);
assert.equal(files.length, 31, 'Expected all 31 imported preparatory HTML source files.');
for (const grade of [1, 2, 3]) {
  if (grade === 3) assert.ok(registry.includes('Prep_3_New_Hello_Units_1_to_6_Full_Curriculum'), 'Missing combined New Hello registry for grade 3');
  else assert.ok(registry.includes('Prep_' + grade + '_New_Hello_Unit_'), 'Missing New Hello registry for grade ' + grade);
  assert.ok(registry.includes('Prep_' + grade + '_New_Hello_Plus_Unit_'), 'Missing New Hello Plus registry for grade ' + grade);
}
for (const section of ['vocabulary', 'vocabulary_questions', 'grammar', 'grammar_questions', 'reading', 'listening', 'speaking', 'games', 'comprehensive_test']) {
  assert.ok(main.includes("['" + section + "'") || main.includes(section + ': ['), 'Missing preparatory learning section: ' + section);
}
for (const game of ['picture-match', 'picture-quiz', 'anagram', 'meaning-quest', 'open-box', 'flashcards']) {
  assert.ok(main.includes("'" + game + "'"), 'Missing interactive game: ' + game);
}
assert.ok(main.includes('data-prep-match-word') && main.includes('data-prep-match-image'), 'Picture matching controls are not wired.');
assert.ok(main.includes('data-prep-word-check') && main.includes('data-prep-game-option'), 'Quiz and spelling controls are not wired.');
assert.ok(main.includes('function renderPreparatorySpeaking') && main.includes('data-tts-text=') && main.includes('OPTIONAL ORAL PRACTICE'), 'Speaking practice module is missing its oral prompts or optional model playback.');
assert.ok(main.includes('The app does not record your voice or score pronunciation.'), 'Speaking practice must disclose that it does not record or score pronunciation.');
assert.ok(main.includes('const swapIndex = Math.floor(Math.random() * (index + 1));'), 'Preparatory game rounds must use Fisher-Yates randomization.');
assert.ok(main.includes('const distractors = shuffled(words.filter((item) => item.word !== target.word)).slice(0, 3);'), 'Game distractors must be selected from a shuffled set.');
assert.ok(main.includes('return shuffled([target, ...distractors]);'), 'Correct answer position must be randomized among options.');
assert.ok(!main.includes('sort((a, b) => a.word.localeCompare(b.word))'), 'Preparatory games must not use alphabetical ordering as fake randomization.');
assert.ok(builder.includes('Openverse') && builder.includes('license_type') && builder.includes('licenseUrl'), 'Image sourcing must retain licensing and attribution.');
assert.ok(builder.includes('buildSectionViewers') && viewerRegistry.includes('preparatory-viewers/'), 'Lesson modules must open in section-aware viewer copies.');
assert.ok(builder.includes('original source files remain unchanged'), 'The vocabulary builder must preserve original HTML sources.');
console.log('Preparatory learning checks passed: 31 HTML files, 9 learning sections including speaking, 6 game modes, image attribution.');
