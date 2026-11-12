import assert from 'node:assert/strict';
import {
  getConfiguredGeminiKeys,
  getSupportedGeminiModels,
  isGeminiModelUnavailable
} from './lib/gemini-config.mjs';

assert.deepEqual(getConfiguredGeminiKeys({
  GEMINI_API_KEY: 'primary',
  GEMINI_API_KEY_BACKUP: 'backup-1',
  GEMINI_API_KEY_BACKUP_2: 'backup-2',
  GEMINI_API_KEY_BACKUP_3: 'backup-3'
}), [
  ['GEMINI_API_KEY', 'primary'],
  ['GEMINI_API_KEY_BACKUP', 'backup-1'],
  ['GEMINI_API_KEY_BACKUP_2', 'backup-2'],
  ['GEMINI_API_KEY_BACKUP_3', 'backup-3']
]);

assert.deepEqual(getConfiguredGeminiKeys({
  GEMINI_API_KEY: '  ',
  GEMINI_API_KEY_BACKUP_2: ' backup-2 '
}), [['GEMINI_API_KEY_BACKUP_2', 'backup-2']]);
assert.deepEqual(getConfiguredGeminiKeys({}), []);
assert.deepEqual(getSupportedGeminiModels(), [
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite'
]);
assert.deepEqual(getSupportedGeminiModels('gemini-2.5-flash'), [
  'gemini-2.5-flash',
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite'
]);
assert.deepEqual(getSupportedGeminiModels('gemini-3.6-flash'), [
  'gemini-3.6-flash',
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash'
]);
assert.deepEqual(getSupportedGeminiModels('custom-model'), [
  'custom-model',
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite'
]);
assert.equal(isGeminiModelUnavailable(404, 'This model models/gemini-2.5-flash is no longer available to new users.'), true);
assert.equal(isGeminiModelUnavailable(404, 'File not found'), false);
assert.equal(isGeminiModelUnavailable(500, 'Model is not available'), false);

console.log('Gemini credential, multi-model fallback, and model-retirement tests passed.');
