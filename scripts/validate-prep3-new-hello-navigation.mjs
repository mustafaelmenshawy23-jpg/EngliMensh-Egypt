import { readFile } from 'node:fs/promises';

const curriculumPath = 'content-imports/preparatory/new-hello/Prep_3_New_Hello_Units_1_to_6_Full_Curriculum.html';
const registryPath = 'src/data/preparatory-html-registry.js';
const [html, registry, main] = await Promise.all([
  readFile(curriculumPath, 'utf8'),
  readFile(registryPath, 'utf8'),
  readFile('src/main.js', 'utf8')
]);
const failures = [];
const requiredRoutes = {
  vocabulary_questions: 'vocab-quiz',
  grammar: 'grammar',
  grammar_questions: 'grammar-quiz',
  reading: 'reading',
  listening: 'listening',
  comprehensive_test: 'exam'
};

if (!registry.includes("format: 'combined-html'") ||
    !registry.includes("Prep_3_New_Hello_Units_1_to_6_Full_Curriculum.html")) {
  failures.push('Prep 3 general course must be registered as the six-unit combined HTML lesson.');
}
for (let unit = 1; unit <= 6; unit += 1) {
  if (!html.includes(`id="unit-tab-${unit}"`)) failures.push(`Unit ${unit} tab is missing from the combined lesson.`);
}
if (!html.includes('function applyViewerRoute()')) failures.push('Combined lesson does not read the app viewer route.');
if (!html.includes("window.addEventListener('hashchange', applyViewerRoute)")) failures.push('Combined lesson does not react when the selected route changes.');
if (!html.includes("window.addEventListener('DOMContentLoaded', applyViewerRoute)")) failures.push('Combined lesson does not initialize from the selected route.');
for (const [route, tab] of Object.entries(requiredRoutes)) {
  if (!html.includes(`${route}: '${tab}'`)) failures.push(`Route ${route} is not mapped to lesson tab ${tab}.`);
}
if (!main.includes("selectedUnit.number || 1") || !main.includes("`#${module}:${selectedUnit.number || 1}`")) {
  failures.push('Parent app no longer passes selected module and unit number to the combined HTML viewer.');
}
if (failures.length) {
  console.error('Prep 3 New Hello navigation validation failed:');
  for (const failure of failures) console.error(' - ' + failure);
  process.exit(1);
}
console.log('Prep 3 New Hello navigation validated: all six units and six app module routes open the requested section.');
