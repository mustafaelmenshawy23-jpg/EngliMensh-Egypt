import assert from 'node:assert/strict';
import fs from 'node:fs';

const main = fs.readFileSync('src/main.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

assert.equal(pkg.dependencies['@capacitor-community/speech-recognition'], '^7.0.1',
  'Capacitor 7 compatible native speech-recognition plugin must be installed.');
assert.ok(main.includes("import { SpeechRecognition } from '@capacitor-community/speech-recognition';"),
  'Native SpeechRecognition plugin import is missing.');
assert.ok(main.includes('SpeechRecognition.checkPermissions()') && main.includes('SpeechRecognition.requestPermissions()'),
  'Microphone permission must be checked and requested before recognition.');
assert.ok(main.includes('SpeechRecognition.available()') && main.includes('SpeechRecognition.start('),
  'Native recognizer availability and start flow must be implemented.');
assert.ok(main.includes("language: 'en-US'") && main.includes('popup: true'),
  'Android recognition must request English using the native recognition dialog.');
assert.ok(main.includes('data-speech-target=') && main.includes("querySelectorAll('[data-speech-target]')"),
  'Speaking prompts must expose working speech-practice controls.');
assert.ok(main.includes('data-speech-result') && main.includes('Recognized:') && main.includes('Word match:'),
  'Learners must see recognized text and an honest text-match result.');
assert.ok(main.includes('window.SpeechRecognition || window.webkitSpeechRecognition'),
  'Browser speech-recognition fallback is missing.');

console.log('Speech-practice integration checks passed.');
