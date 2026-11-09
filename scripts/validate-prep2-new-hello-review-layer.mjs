import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const layer = JSON.parse(await readFile(path.join(root, 'src/data/prep2-new-hello-reviewed-layer.json'), 'utf8'));
const grammarGuides = JSON.parse(await readFile(path.join(root, 'src/data/prep2-new-hello-grammar-guides.json'), 'utf8'));
const sourceDir = path.join(root, 'content-imports/preparatory/new-hello');
const enhancer = await readFile(path.join(root, 'scripts/prep2-interactive-enhancement.js'), 'utf8');
const builder = await readFile(path.join(root, 'scripts/build-preparatory-vocabulary.mjs'), 'utf8');
const registry = await readFile(path.join(root, 'src/data/preparatory-html-registry.js'), 'utf8');
const decode = (value = '') => value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').trim();
const failures = [];
let totalWords = 0;
for (let unit = 1; unit <= 6; unit += 1) {
  const file = path.join(sourceDir, `Prep_2_New_Hello_Unit_${unit}_Complete.html`);
  const html = await readFile(file, 'utf8');
  const vocabStart = html.indexOf('2. Vocabulary Quiz');
  const grammarHeadingStart = html.indexOf('3. Grammar', vocabStart);
  const grammarStart = html.indexOf('4. Grammar Quiz', grammarHeadingStart);
  const readingStart = html.indexOf('5. Reading Comprehension');
  const listeningStart = html.indexOf('6. Listening Comprehension');
  const grammarEnd = readingStart;
  const countQuestions = (text) => (text.match(/class="question(?:-item)?"/g) || []).length;
  if (vocabStart < 0 || grammarHeadingStart < 0 || countQuestions(html.slice(vocabStart, grammarHeadingStart)) !== 25) failures.push(`Unit ${unit}: expected 25 vocabulary questions.`);
  if (grammarStart < 0 || grammarEnd < grammarStart || countQuestions(html.slice(grammarStart, grammarEnd)) !== 30) failures.push(`Unit ${unit}: expected 30 grammar questions, including any explicitly repaired legacy wrapper.`);
  if (readingStart < 0 || listeningStart < readingStart || countQuestions(html.slice(readingStart, listeningStart)) !== 5) failures.push(`Unit ${unit}: expected five reading questions.`);
  if (listeningStart < 0 || countQuestions(html.slice(listeningStart)) !== 5) failures.push(`Unit ${unit}: expected five listening questions.`);
  const grammarHtml = html.slice(grammarStart, grammarEnd);
  const review = layer.units?.[String(unit)] || {};
  const auditMultipleChoice = (source, sectionName) => {
    const starts = [...source.matchAll(/<div class="question(?:-item)?"/g)].map((match) => match.index);
    for (let index = 0; index < starts.length; index += 1) {
      const id = String(index + 1);
      const question = source.slice(starts[index], starts[index + 1] ?? source.length);
      let options = [...question.matchAll(/<div class="option-item">([\s\S]*?)<\/div>/g)].map((match) => match[1]);
      if (!options.length) {
        const optionsStart = question.indexOf('<div class="options">');
        if (optionsStart >= 0) {
          const innerStart = optionsStart + '<div class="options">'.length;
          const innerEnd = question.indexOf('</div>', innerStart);
          if (innerEnd >= 0) options = question.slice(innerStart, innerEnd).split(/<br\s*\/?\s*>/i).filter((value) => value.trim());
        }
      }
      const excluded = Boolean(review.excludedItems?.[sectionName]?.[id]);
      const fix = review.optionTextFixes?.[sectionName]?.[id] || {};
      const normalized = options.map((value, optionIndex) => {
        const letter = String.fromCharCode(97 + optionIndex);
        const withoutTags = value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
        return String(fix[letter] || withoutTags.replace(/^[a-d]\)\s*/i, '')).toLowerCase();
      });
      const duplicates = normalized.filter((value, optionIndex) => normalized.indexOf(value) !== optionIndex);
      const marked = options.filter((value) => /<strong\b|<b\b/i.test(value)).length;
      const expectedOptions = sectionName === 'grammar' && unit <= 3 ? 3 : 4;
      if (options.length !== expectedOptions) failures.push(`Unit ${unit} ${sectionName} Q${id}: expected ${expectedOptions} choices, found ${options.length}.`);
      if (!excluded && marked !== 1 && !(sectionName === 'grammar' && unit === 1 && id === '18')) failures.push(`Unit ${unit} ${sectionName} Q${id}: expected exactly one source-marked key, found ${marked}.`);
      if (duplicates.length && !excluded) failures.push(`Unit ${unit} ${sectionName} Q${id}: duplicate choices remain after reviewed option fixes.`);
    }
  };
  auditMultipleChoice(html.slice(vocabStart, grammarHeadingStart), 'vocabulary');
  auditMultipleChoice(grammarHtml, 'grammar');
  const readingHtml = html.slice(readingStart, listeningStart);
  const listeningHtml = html.slice(listeningStart);
  if (unit >= 4) {
    auditMultipleChoice(readingHtml, 'reading');
    auditMultipleChoice(listeningHtml, 'listening');
  } else {
    for (const [sectionName, sectionHtml] of [['reading', readingHtml], ['listening', listeningHtml]]) {
      const answers = [...sectionHtml.matchAll(/<strong>\\s*Answer:\\s*([^<]+)<\\/strong>/gi)]
        .slice(0, 5)
        .map((match, index) => review.answerTextFixes?.[sectionName]?.[String(index + 1)] || match[1].trim());
      const normalized = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\\s+/g, ' ').trim();
      if (answers.length !== 5) failures.push(`Unit ${unit} ${sectionName}: expected five source answer keys to generate multiple-choice options.`);
      if (new Set(answers.map(normalized)).size !== 5) failures.push(`Unit ${unit} ${sectionName}: answer bank must contain five distinct answers to build four unique choices per question.`);
      for (const answer of answers) {
        const distractors = answers.filter((candidate) => normalized(candidate) !== normalized(answer)).filter((candidate, index, all) => all.findIndex((other) => normalized(other) === normalized(candidate)) === index).slice(0, 3);
        if (distractors.length !== 3) failures.push(`Unit ${unit} ${sectionName}: could not produce three distinct distractors for "${answer}".`);
      }
    }
  }
  const boldKeys = (grammarHtml.match(/<strong>/g) || []).length;
  const expectedBoldKeys = unit === 1 ? 29 : 30;
  if (boldKeys !== expectedBoldKeys) failures.push(`Unit ${unit}: expected ${expectedBoldKeys} bold grammar answer markers before applying explicit overrides/exclusions; found ${boldKeys}.`);
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
if (!registry.includes('viewerUrl: viewerUrl(fileName)')) failures.push('Generated reviewed viewer URLs are not connected to the student lesson registry.');
if (!builder.includes('window.__PREP2_REVIEW_LAYER__=') || !builder.includes('window.__PREP2_GRAMMAR_GUIDES__=')) failures.push('Generated viewers are missing review-layer or grammar-guide injection.');
if (!builder.includes('prepareOfflineLessonCopy(originalSource)')) failures.push('Generated preparatory viewers must remove remote Google Fonts dependencies for offline readability.');
if (!builder.includes('text-to-speech voice') || !builder.includes('Play listening script')) failures.push('Generated Plus viewers must identify listening playback as device text-to-speech, not recorded audio.');
if (!enhancer.includes("document.querySelectorAll('.section')") || !enhancer.includes('section.hidden = section !== target;')) failures.push('Preparatory HTML viewer must show only the section selected by the app module.');
const unit6RepairAt = enhancer.indexOf("const malformedQ6 = [...target.querySelectorAll('.question-item')].find");
const nestedHoistAt = enhancer.indexOf("target.querySelectorAll('.question .question')");
if (unit6RepairAt < 0 || nestedHoistAt < 0 || unit6RepairAt > nestedHoistAt || !enhancer.includes("malformedQ6.classList.replace('question-item', 'question')")) failures.push('Only Unit 6 Q6 must be repaired before nested questions are hoisted and scored.');
if (!enhancer.includes("moduleName === 'grammar' ? 'grammar_guide'")) failures.push('Grammar guide rendering is not connected to the Grammar module.');
if (!enhancer.includes('const isCorrect = actual === expected;')) failures.push('Short-answer scoring must use exact normalized answers, not partial substring matches.');
if (!enhancer.includes('speechSynthesis.speak(utterance)')) failures.push('Listening playback is missing.');
if (!enhancer.includes('scriptNode.hidden = true') || !enhancer.includes('Show transcript')) failures.push('Listening transcript must stay hidden until learner requests it.');
if (!enhancer.includes('const shortAnswerBank = questions.map') || !enhancer.includes('const choicesData = [answer, ...distractors]') || !enhancer.includes("question.classList.add('prep-interactive-question');")) failures.push('All reading/listening questions must be converted to interactive multiple-choice options.');
if (enhancer.includes("input.placeholder = 'Type your answer'")) failures.push('Reading/listening questions must not leave any free-text answer inputs.');
if (!enhancer.includes("button.textContent = letter.toUpperCase() + ') ' + label")) failures.push('Generated reading/listening choices must display labeled answer options.');
for (let unit = 1; unit <= 6; unit += 1) {
  const guide = grammarGuides.units?.[String(unit)];
  if (!guide) { failures.push(`Unit ${unit}: detailed grammar guide is missing.`); continue; }
  for (const field of ['title','purpose','affirmative','negative','questions','spelling','signals','examples','warning']) {
    const value = guide[field];
    if (Array.isArray(value) ? value.length === 0 : typeof value !== 'string' || !value.trim()) failures.push(`Unit ${unit}: grammar guide field "${field}" is incomplete.`);
  }
  const arabicText = JSON.stringify(guide);
  if (!/[\u0600-\u06FF]/.test(arabicText)) failures.push(`Unit ${unit}: grammar guide has no Arabic explanation.`);
}
if (layer.units['1']?.answerKeyOverrides?.grammar?.['17']?.correctOption !== 'a') failures.push('Unit 1 Q17 must use option a (arrive).');
if (layer.units['1']?.answerKeyOverrides?.grammar?.['23']?.correctOption !== 'a') failures.push('Unit 1 Q23 must use option a (make).');
if (layer.units['1']?.questionTextFixes?.grammar?.['12'] !== 'My father always .......... to work.') failures.push('Unit 1 Q12 must remove the editorial residue.');
if (layer.units['2']?.answerKeyOverrides?.grammar?.['4']?.correctOption !== 'a') failures.push('Unit 2 Q4 must have one unique correct option.');
if (!layer.units['1']?.excludedItems?.vocabulary?.['20']) failures.push('Unit 1 ambiguous vocabulary Q20 must be excluded from scoring.');
if (!layer.units['2']?.excludedItems?.vocabulary?.['17']) failures.push('Unit 2 duplicate-choice vocabulary Q17 must be excluded from scoring.');
if (!layer.units['5']?.questionTextFixes?.vocabulary?.['9'] || layer.units['5']?.optionTextFixes?.vocabulary?.['9']?.b !== 'respect') failures.push('Unit 5 vocabulary Q9 must align its prompt and answer with the taught headword respect.');
if (!layer.units['5']?.definitionFixes?.Disabled?.includes('disabilities')) failures.push('Unit 5 Disabled definition must use respectful, accurate wording.');
if (!layer.units['6']?.questionTextFixes?.vocabulary?.['1'] || layer.units['6']?.optionTextFixes?.vocabulary?.['1']?.b !== 'climate') failures.push('Unit 6 vocabulary Q1 must test the bank headword climate.');
if (!layer.units['6']?.questionTextFixes?.vocabulary?.['15'] || layer.units['6']?.optionTextFixes?.vocabulary?.['15']?.b !== 'mountain') failures.push('Unit 6 vocabulary Q15 must contain a blank and a normalized answer.');
if (!layer.units['6']?.definitionFixes?.Renewable?.includes('naturally replaced')) failures.push('Unit 6 Renewable definition must be an adjective definition.');
if (layer.units['3']?.answerTextFixes?.reading?.['4'] !== 'Coding and modern skills') failures.push('Unit 3 reading Q4 answer must cover both coding and modern skills stated in the passage.');
if (layer.units['4']?.optionTextFixes?.reading?.['2']?.b !== 'Pyramids of Giza, temples of Luxor, and the Valley of the Kings') failures.push('Unit 4 reading Q2 must include all three iconic sites named in the passage.');
if (!enhancer.includes('unit.answerTextFixes?.[sectionType]?.[id]')) failures.push('Reviewed short-answer corrections are not applied to interactive reading/listening questions.');

for (let question = 20; question <= 30; question += 1) {
  if (layer.units['3']?.answerKeyOverrides?.grammar?.[String(question)]?.correctOption !== 'a') failures.push(`Unit 3 Q${question} must override the incorrect source key to option a.`);
}
if (!layer.units['6']?.markupRepairs?.grammar?.['6']) failures.push('Unit 6 Q6 markup repair is missing.');
const unit6Html = await readFile(path.join(sourceDir, 'Prep_2_New_Hello_Unit_6_Complete.html'), 'utf8');
if (!unit6Html.includes('class="question-item">6.')) failures.push('Unit 6 source Q6 markup finding changed; re-audit before changing the repair.');
if (!enhancer.includes("malformedQ6.classList.replace('question-item', 'question')")) failures.push('Unit 6 Q6 is not normalized into an independently scored question.');
if (!enhancer.includes("const choicesData = [answer, ...distractors]") || !enhancer.includes(".slice(0, 3)")) failures.push('Short-answer reading/listening items must receive up to three same-passage distractors plus the correct answer.');
if (enhancer.includes("input.placeholder = 'Type your answer'") || enhancer.includes("prep-short-answer")) failures.push('Free-text answer mode must not remain in the student quiz.');


if (failures.length) {
  console.error('Prep 2 New Hello review-layer validation failed:');
  for (const failure of failures) console.error(' - ' + failure);
  process.exit(1);
}
console.log(`Prep 2 New Hello Arabic review layer validated: ${totalWords} source cards across 6 units; all unique headwords have Arabic draft translations.`);
