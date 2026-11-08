import assert from 'node:assert/strict';
import { detectSpeakerGender, chooseSpeakerVoice } from '../src/lib/tts-voice-selection.mjs';

assert.equal(detectSpeakerGender({ name: 'en-US female voice' }), 'female');
assert.equal(detectSpeakerGender({ voiceURI: 'en-us-x-sfb#male_1-local' }), 'male');
assert.equal(detectSpeakerGender({ name: 'Google US English' }), 'unknown');

const voices = [
  { id: 'default', name: 'Google US English', gender: 'unknown' },
  { id: 'female-auto', name: 'System Female', gender: 'female' },
  { id: 'manual-male', name: 'User selected voice', gender: 'unknown' }
];
assert.equal(chooseSpeakerVoice(voices, {}, 'female')?.id, 'female-auto');
assert.equal(chooseSpeakerVoice(voices, { male: 'manual-male' }, 'male')?.id, 'manual-male');
assert.equal(chooseSpeakerVoice(voices, {}, 'unknown'), null);
console.log('TTS voice classification and role-selection tests passed.');
