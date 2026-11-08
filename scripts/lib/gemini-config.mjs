export const GEMINI_KEY_ENV_NAMES = Object.freeze([
  'GEMINI_API_KEY',
  'GEMINI_API_KEY_BACKUP',
  'GEMINI_API_KEY_BACKUP_2',
  'GEMINI_API_KEY_BACKUP_3'
]);

export function getConfiguredGeminiKeys(env = process.env) {
  return GEMINI_KEY_ENV_NAMES
    .map((name) => [name, typeof env[name] === 'string' ? env[name].trim() : ''])
    .filter(([, value]) => value.length > 0);
}

export function getSupportedGeminiModels(preferredModel = 'gemini-2.5-flash') {
  const preferred = typeof preferredModel === 'string' ? preferredModel.trim() : '';
  return [...new Set([preferred || 'gemini-2.5-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'])];
}
