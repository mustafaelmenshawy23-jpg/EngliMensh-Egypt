import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const sourceRoot = path.join(root, 'content-imports/preparatory');

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(full);
  }
  return files.sort();
}

const files = await walk(sourceRoot);
assert.equal(files.length, 31, 'Expected all 31 preserved preparatory HTML source files.');

const records = [];
for (const file of files) {
  const html = await readFile(file, 'utf8');
  const title = (html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '')
    .replace(/\s+/g, ' ').trim();
  const flags = [];
  if (/مفردة دراسية|An essential curriculum term|Correct Ministerial Option|Incorrect Distractor|Official target vocabulary term|generateQuiz\(|generateReading\(|generateListening\(|generateUnitVocab\(/i.test(html)) {
    flags.push('synthetic_or_placeholder_content');
  }
  if (/data-bard-client-injected|__initial_auth_token|initialAuthToken/i.test(html)) {
    flags.push('injected_host_runtime_or_credential_marker');
  }
  if (/fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|unpkg\.com/i.test(html)) {
    flags.push('external_font_or_cdn_dependency');
  }
  const initialsVisualCount = (html.match(/<text[^>]*text-anchor=["']middle["'][^>]*>[A-Z]{1,3}<\/text>/gi) || []).length;
  if (initialsVisualCount) flags.push('placeholder_initials_visuals');
  records.push({
    file: path.relative(root, file).split(path.sep).join('/'),
    title,
    flags,
    placeholderInitialsVisualCount: initialsVisualCount
  });
}

const summary = {
  sourceFiles: records.length,
  filesWithFlags: records.filter((item) => item.flags.length).length,
  syntheticOrPlaceholderFiles: records.filter((item) => item.flags.includes('synthetic_or_placeholder_content')).length,
  injectedRuntimeOrCredentialFiles: records.filter((item) => item.flags.includes('injected_host_runtime_or_credential_marker')).length,
  externalDependencyFiles: records.filter((item) => item.flags.includes('external_font_or_cdn_dependency')).length,
  placeholderInitialsVisualFiles: records.filter((item) => item.flags.includes('placeholder_initials_visuals')).length
};

// Guard known high-risk source patterns without printing or persisting credential values.
const prep3General = records.find((item) => item.file.endsWith('Prep_3_New_Hello_Units_1_to_6_Full_Curriculum.html'));
assert.ok(prep3General?.flags.includes('injected_host_runtime_or_credential_marker'));
assert.ok(prep3General?.flags.includes('synthetic_or_placeholder_content'));
const prep3PlusFiles = records.filter((item) => /hello-plus\/Prep_3_New_Hello_Plus_Unit_\d+\.html$/.test(item.file));
assert.equal(prep3PlusFiles.length, 6, 'All six Prep 3 New Hello Plus sources must be audited.');
assert.ok(prep3PlusFiles.some((item) => item.flags.includes('synthetic_or_placeholder_content')),
  'Known synthetic Prep 3 New Hello Plus content must remain visible to QA.');

console.log('Preparatory HTML audit (metadata only; no source scripts executed):');
console.log(JSON.stringify({ summary, records }, null, 2));
