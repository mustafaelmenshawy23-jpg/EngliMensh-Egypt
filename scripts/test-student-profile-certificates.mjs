import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

assert.match(main, /STUDENT_PROFILES_KEY/);
assert.match(main, /englimensh_progress_.*state\.stage.*state\.grade.*state\.path/);
assert.match(main, /paths:\(form\.elements\.studentStage\.value === 'primary' \? \['general','advanced'\]/);
assert.match(main, /attempted === questions\.length && score >= 90/);
assert.doesNotMatch(main, /certificate-teacher-photo/, 'teacher portrait is already embedded in certificate artwork');
assert.match(main, /certificate-student-photo/);
assert.match(main, /data-student-hub/);
assert.match(main, /data-favorite-current/);
assert.match(main, /data-student-theme/);
assert.match(main, /data-student-hub/);
assert.match(styles, /\.certificate-card[^}]*certificate-template\.jpeg/);
assert.match(styles, /aspect-ratio:1189\/1600/, 'certificate must preserve the source artwork aspect ratio');
assert.doesNotMatch(styles, /\.certificate-teacher-photo/, 'do not overlay a duplicate teacher portrait');
assert.match(styles, /\.certificate-student-photo/);
assert.ok(existsSync(new URL('../public/assets/certificate-template.jpeg', import.meta.url)), 'certificate template asset is missing');
assert.ok(existsSync(new URL('../public/assets/teacher-portrait.jpeg', import.meta.url)), 'teacher portrait asset is missing');
assert.ok(packageJson.scripts.test.includes('test-student-profile-certificates.mjs'));
console.log('Student profiles, curriculum separation, certificate threshold, portraits, and student hub checks passed.');
