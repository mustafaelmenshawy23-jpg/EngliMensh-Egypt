import assert from 'node:assert/strict';
import { detectSpeakerGender, chooseSpeakerVoice } from '../src/lib/tts-voice-selection.mjs';

assert.equal(detectSpeakerGender({ name: 'en-US female voice' }), 'female');
assert.equal(detectSpeakerGender({ voiceURI: 'en-us-x-sfb#male_1-local' }), 'male');
assert.equal(detectSpeakerGender({ name: 'Google US English' }), 'unknown');

const voices = [
  { id: 'default', name: 'Google US English', gender: 'unknown' },
  { id: 'female-auto', name: 'System Female', gender: 'female' },
  { id: 'male-auto', name: 'System Male', gender: 'male' },
  { id: 'manual-unknown', name: 'User selected voice', gender: 'unknown' }
];
assert.equal(chooseSpeakerVoice(voices, {}, 'female')?.id, 'female-auto');
assert.equal(chooseSpeakerVoice(voices, {}, 'male')?.id, 'male-auto');
assert.equal(chooseSpeakerVoice(voices, { male: 'manual-unknown' }, 'male')?.id, 'male-auto',
  'An unknown-gender preference must not be assigned to a male dialogue role');
assert.equal(chooseSpeakerVoice(voices, { female: 'male-auto' }, 'female')?.id, 'female-auto',
  'A male voice must not be assigned to a female dialogue role');
assert.equal(chooseSpeakerVoice([voices[0], voices[3]], {}, 'male'), null,
  'No verified matching voice must be reported as unavailable');
assert.equal(chooseSpeakerVoice(voices, {}, 'unknown'), null);
console.log('TTS voice classification and gender-safe role-selection tests passed.');
