import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const layer = JSON.parse(await readFile(path.join(root, 'src/data/prep2-new-hello-reviewed-layer.json'), 'utf8'));
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
if (failures.length) {
  console.error('Prep 2 New Hello review-layer validation failed:');
  for (const failure of failures) console.error(' - ' + failure);
  process.exit(1);
}
console.log(`Prep 2 New Hello Arabic review layer validated: ${totalWords} source cards across 6 units; all unique headwords have Arabic draft translations.`);
