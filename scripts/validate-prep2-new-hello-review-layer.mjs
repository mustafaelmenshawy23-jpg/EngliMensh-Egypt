import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const layer = JSON.parse(await readFile(path.join(root, 'src/data/prep2-new-hello-reviewed-layer.json'), 'utf8'));
const grammarGuides = JSON.parse(await readFile(path.join(root, 'src/data/prep2-new-hello-grammar-guides.json'), 'utf8'));
const sourceDir = path.join(root, 'content-imports/preparatory/new-hello');
const decode = (value = '') => value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').trim();
const failures = [];
let totalWords = 0;
for (let unit = 1; unit <= 6; unit += 1) {
  const file = path.join(sourceDir, `Prep_2_New_Hello_Unit_${unit}_Complete.html`);
  const html = await readFile(file, 'utf8');
  const start = html.indexOf('1. Vocabulary');
  const end = html.indexOf('2. Vocabulary Quiz', start);
  if (start < 0 || end < 0) {
    failures.push(`Unit ${unit}: vocabulary section not found`);
    continue;
  }
  const section = html.slice(start, end);
  const sourceWords = [...section.matchAll(/<div class="vocab-card">([\s\S]*?)<\/div>/g)]
    .map((match) => {
      const strong = match[1].match(/<strong>\s*\d+\.\s*([^<]+)<\/strong>/i);
      return strong ? decode(strong[1]) : '';
    }).filter(Boolean);
  const unique = [...new Set(sourceWords.map((word) => word.toLowerCase()))];
  const translations = layer.units?.[String(unit)]?.vocabularyArabic || {};
  const translated = new Set(Object.keys(translations).map((word) => word.toLowerCase()));
  for (const word of unique) {
    if (!translated.has(word)) failures.push(`Unit ${unit}: missing Arabic translation for "${word}"`);
    else if (!/[\u0600-\u06FF]/.test(translations[Object.keys(translations).find((key) => key.toLowerCase() === word)] || '')) failures.push(`Unit ${unit}: translation for "${word}" is not Arabic text`);
  }
  const extra = [...translated].filter((word) => !unique.includes(word));
  if (extra.length) failures.push(`Unit ${unit}: translation map has unknown headwords: ${extra.join(', ')}`);
  if (sourceWords.length !== 25) failures.push(`Unit ${unit}: expected 25 source cards, found ${sourceWords.length}`);
  if (sourceWords.length !== unique.length && !(unit === 1 && layer.units['1'].knownDuplicateHeadwords?.includes('Success'))) {
    failures.push(`Unit ${unit}: duplicate source headwords need explicit review`);
  }
  totalWords += sourceWords.length;
}
if (layer.status !== 'translation-draft-needs-official-source-review') failures.push('Review layer must remain marked as draft pending official-source verification.');
if (grammarGuides.status !== 'teacher-review-draft') failures.push('Grammar guides must remain drafts pending teacher review.');
for (let unit = 1; unit <= 6; unit += 1) {
  const guide = grammarGuides.units?.[String(unit)];
  if (!guide) { failures.push(`Unit ${unit}: detailed grammar guide is missing.`); continue; }
  for (const field of ['title','purpose','affirmative','negative','questions','spelling','signals','examples','warning']) {
    const value = guide[field];
    if (Array.isArray(value) ? value.length === 0 : typeof value !== 'string' || !value.trim()) failures.push(`Unit ${unit}: grammar guide field "${field}" is incomplete.`);
  }
  const arabicText = JSON.stringify(guide);
  if (!/[\\u0600-\\u06FF]/.test(arabicText)) failures.push(`Unit ${unit}: grammar guide has no Arabic explanation.`);
}
if (layer.units['1']?.answerKeyOverrides?.grammar?.['17']?.correctOption !== 'a') failures.push('Unit 1 Q17 must use option a (arrive).');
if (layer.units['1']?.answerKeyOverrides?.grammar?.['23']?.correctOption !== 'a') failures.push('Unit 1 Q23 must use option a (make).');
if (layer.units['1']?.questionTextFixes?.grammar?.['12'] !== 'My father always .......... to work.') failures.push('Unit 1 Q12 must remove the editorial residue.');
if (layer.units['2']?.answerKeyOverrides?.grammar?.['4']?.correctOption !== 'a') failures.push('Unit 2 Q4 must have one unique correct option.');
if (!layer.units['1']?.excludedItems?.vocabulary?.['20']) failures.push('Unit 1 ambiguous vocabulary Q20 must be excluded from scoring.');
if (!layer.units['2']?.excludedItems?.vocabulary?.['17']) failures.push('Unit 2 duplicate-choice vocabulary Q17 must be excluded from scoring.');
for (let question = 20; question <= 30; question += 1) {
  if (layer.units['3']?.answerKeyOverrides?.grammar?.[String(question)]?.correctOption !== 'a') failures.push(`Unit 3 Q${question} must override the incorrect source key to option a.`);
}
if (!layer.units['6']?.markupRepairs?.grammar?.['6']) failures.push('Unit 6 Q6 markup repair is missing.');

if (failures.length) {
  console.error('Prep 2 New Hello review-layer validation failed:');
  for (const failure of failures) console.error(' - ' + failure);
  process.exit(1);
}
console.log(`Prep 2 New Hello Arabic review layer validated: ${totalWords} source cards across 6 units; all unique headwords have Arabic draft translations.`);
