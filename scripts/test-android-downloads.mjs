import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const generator = await readFile(new URL('./prepare-android-downloads.mjs', import.meta.url), 'utf8');
const app = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
const workflow = await readFile(new URL('../.github/workflows/build-android-preview.yml', import.meta.url), 'utf8');
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

assert.match(generator, /MediaStore\.Downloads\.EXTERNAL_CONTENT_URI/);
assert.match(generator, /Environment\.DIRECTORY_DOWNLOADS/);
assert.match(generator, /IS_PENDING/);
assert.match(generator, /registerPlugin\(DownloadsPlugin\.class\)/);
assert.match(generator, /Build\.VERSION_CODES\.Q/);
assert.match(app, /registerPlugin\('Downloads'\)/);
assert.match(app, /AndroidDownloads\.savePdf/);
assert.match(app, /html2canvas/);
assert.match(app, /data-export-certificate/);
assert.match(workflow, /node scripts\/prepare-android-downloads\.mjs/);
assert.ok(packageJson.dependencies.html2canvas);
assert.ok(packageJson.dependencies.jspdf);
console.log('Android certificate Downloads export wiring checks passed.');
