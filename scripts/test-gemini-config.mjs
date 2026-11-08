import assert from 'node:assert/strict';
import { getConfiguredGeminiKeys, getSupportedGeminiModels } from './lib/gemini-config.mjs';

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
assert.deepEqual(getSupportedGeminiModels('gemini-2.5-flash'), ['gemini-2.5-flash', 'gemini-2.0-flash']);
assert.deepEqual(getSupportedGeminiModels('custom-model'), ['custom-model', 'gemini-2.5-flash', 'gemini-2.0-flash']);
console.log('Gemini credential and model fallback tests passed.');
