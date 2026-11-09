import { readFile } from 'node:fs/promises';

const builder = await readFile('scripts/build-preparatory-vocabulary.mjs', 'utf8');
const failures = [];
const requiredRoutes = {
  vocabulary: 'vocab',
  vocabulary_questions: 'vocab-quiz',
  grammar: 'grammar',
  grammar_questions: 'grammar-quiz',
  reading: 'reading',
  listening: 'listening',
  comprehensive_test: 'exam'
};
if (!builder.includes('isPrep1General') || !builder.includes('window.switchTab(tab)') ||
    !builder.includes("window.addEventListener('hashchange', applyViewerRoute)")) {
  failures.push('Prep 1 viewer copies must apply and track the app-supplied route.');
}
for (const [route, tab] of Object.entries(requiredRoutes)) {
  if (!builder.includes(`${route}: '${tab}'`)) failures.push(`Prep 1 route ${route} is not mapped to tab ${tab}.`);
}
for (let unit = 1; unit <= 6; unit += 1) {
  const html = await readFile(`content-imports/preparatory/new-hello/Prep_1_New_Hello_Unit_${unit}.html`, 'utf8');
  if (!html.includes(`id="${['vocab','vocab-quiz','grammar','grammar-quiz','reading','listening','exam'][0]}"`) ||
      !html.includes('function switchTab(tabId)')) {
    failures.push(`Prep 1 Unit ${unit} is missing the section switcher required by the route adapter.`);
  }
}
if (failures.length) {
  console.error('Prep 1 New Hello navigation validation failed:');
  for (const failure of failures) console.error(' - ' + failure);
  process.exit(1);
}
console.log('Prep 1 New Hello navigation validated: all six viewer copies route app sections to the matching lesson tab.');
