export function detectSpeakerGender(voice = {}) {
  const label = `${voice.name || ''} ${voice.voiceURI || ''}`.toLowerCase();
  if (/(^|[^a-z])female([^a-z]|$)/.test(label)) return 'female';
  if (/(^|[^a-z])male([^a-z]|$)/.test(label)) return 'male';
  return 'unknown';
}

export function chooseSpeakerVoice(voices, preferences, gender) {
  if (!['male', 'female'].includes(gender) || !Array.isArray(voices)) return null;
  const preferredId = preferences?.[gender];
  if (preferredId) {
    const preferred = voices.find((voice) => voice.id === preferredId);
    if (preferred?.gender === gender) return preferred;
  }
  return voices.find((voice) => voice.gender === gender) || null;
}
