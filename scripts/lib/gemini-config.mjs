export const GEMINI_KEY_ENV_NAMES = Object.freeze([
  'GEMINI_API_KEY',
  'GEMINI_API_KEY_BACKUP',
  'GEMINI_API_KEY_BACKUP_2',
  'GEMINI_API_KEY_BACKUP_3'
]);

export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';
export const FALLBACK_GEMINI_MODELS = Object.freeze([
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite'
]);

export function getConfiguredGeminiKeys(env = process.env) {
  return GEMINI_KEY_ENV_NAMES
    .map((name) => [name, typeof env[name] === 'string' ? env[name].trim() : ''])
    .filter(([, value]) => value.length > 0);
}

export function getSupportedGeminiModels(preferredModel = DEFAULT_GEMINI_MODEL) {
  const preferred = typeof preferredModel === 'string' ? preferredModel.trim() : '';
  return [...new Set([
    preferred || DEFAULT_GEMINI_MODEL,
    DEFAULT_GEMINI_MODEL,
    ...FALLBACK_GEMINI_MODELS
  ])];
}

export function isGeminiModelUnavailable(status, detail = '') {
  return Number(status) === 404 &&
    /model.*(?:no longer available|not available|not found|does not exist)/i.test(String(detail));
}
