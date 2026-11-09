const PROFILE_KEY = 'englimensh_student_profiles_v1';
const LEGACY_PROGRESS_KEY = 'englimensh_p1u1_progress';
const THEMES = new Set(['classic', 'ocean', 'forest', 'lavender']);

function isRecord(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function readJson(storage, key, fallback) {
  try {
    const value = JSON.parse(storage.getItem(key) || 'null');
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

function writeJson(storage, key, value) {
  storage.setItem(key, JSON.stringify(value));
}

function normalizeProfile(profile) {
  if (!isRecord(profile) || typeof profile.id !== 'string' || !profile.id.trim() ||
      typeof profile.name !== 'string' || !profile.name.trim()) return null;
  const grade = Number(profile.grade);
  return {
    ...profile,
    id: profile.id.trim(),
    name: profile.name.trim().slice(0, 40),
    stage: typeof profile.stage === 'string' ? profile.stage : 'primary',
    grade: Number.isInteger(grade) && grade > 0 ? grade : 1,
    path: typeof profile.path === 'string' && profile.path.trim() ? profile.path.trim().slice(0, 80) : 'general',
    theme: THEMES.has(profile.theme) ? profile.theme : 'classic',
    photo: typeof profile.photo === 'string' && profile.photo.startsWith('data:image/') ? profile.photo : ''
  };
}

export function createStudentProfileStore(storage, { legacyKey = LEGACY_PROGRESS_KEY } = {}) {
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
    throw new TypeError('A localStorage-compatible storage object is required.');
  }

  let profiles = readJson(storage, PROFILE_KEY, []);
  profiles = Array.isArray(profiles) ? profiles.map(normalizeProfile).filter(Boolean) : [];
  let activeId = null;

  const persistProfiles = () => writeJson(storage, PROFILE_KEY, profiles);
  const find = (id) => profiles.find((profile) => profile.id === id) || null;

  function progressKey(profileOrId, context = {}) {
    const profile = typeof profileOrId === 'string' ? find(profileOrId) : profileOrId;
    if (!profile) return legacyKey;
    const stage = context.stage || profile.stage;
    const grade = Number(context.grade || profile.grade);
    const path = context.path || profile.path;
    const term = context.term || 'first';
    const safePart = (value) => encodeURIComponent(String(value ?? '')).replace(/%/g, '~');
    const base = ['englimensh_progress', profile.id, stage, grade, path].map(safePart).join('_');
    return term === 'second' ? base + '_term_second' : base;
  }

  return {
    list() { return profiles.map((profile) => ({ ...profile })); },
    get(id) { const profile = find(id); return profile ? { ...profile } : null; },
    active() { const profile = find(activeId); return profile ? { ...profile } : null; },
    create(input) {
      const candidate = normalizeProfile({ ...input, id: input?.id || 'student_' + Date.now().toString(36) });
      if (!candidate) throw new TypeError('Student name and profile ID are required.');
      if (find(candidate.id)) throw new Error('Student profile ID already exists.');
      profiles.push(candidate);
      persistProfiles();
      return { ...candidate };
    },
    update(id, changes) {
      const index = profiles.findIndex((profile) => profile.id === id);
      if (index < 0) throw new Error('Student profile not found.');
      const candidate = normalizeProfile({ ...profiles[index], ...changes, id });
      if (!candidate) throw new TypeError('Invalid student profile.');
      profiles[index] = candidate;
      persistProfiles();
      return { ...candidate };
    },
    activate(id) {
      if (!find(id)) throw new Error('Student profile not found.');
      activeId = id;
      return this.active();
    },
    clearActive() { activeId = null; },
    progressKey,
    loadProgress(context = {}) {
      const profile = find(activeId);
      const key = progressKey(profile, context);
      let value = readJson(storage, key, null);
      if (profile && value === null && profiles.length === 1) {
        const legacy = readJson(storage, legacyKey, null);
        if (legacy !== null) {
          value = legacy;
          writeJson(storage, key, legacy);
        }
      }
      return value;
    },
    saveProgress(value, context = {}) {
      writeJson(storage, progressKey(find(activeId), context), value);
    },
    setTheme(id, theme) {
      if (!THEMES.has(theme)) throw new TypeError('Unsupported student theme.');
      return this.update(id, { theme });
    },
    issueCertificate(id, context, result) {
      const profile = find(id);
      if (!profile) throw new Error('Student profile not found.');
      const total = Number(result?.total);
      const attempted = Number(result?.attempted);
      const correct = Number(result?.correct);
      if (!Number.isInteger(total) || total < 1 || attempted !== total ||
          !Number.isFinite(correct) || correct < 0 || correct > total ||
          Math.round(correct / total * 100) < 90) return null;
      const key = [context?.term || 'first', context?.stage || profile.stage,
        Number(context?.grade || profile.grade), context?.path || profile.path,
        String(context?.unitId || '')].join(':');
      profile.certificates = isRecord(profile.certificates) ? profile.certificates : {};
      if (!profile.certificates[key]) {
        profile.certificates[key] = {
          studentName: profile.name,
          studentPhoto: profile.photo || null,
          stage: context?.stageLabel || profile.stage,
          grade: Number(context?.grade || profile.grade),
          curriculum: context?.curriculum || profile.path,
          unit: String(context?.unitTitle || 'Completed unit'),
          unitId: String(context?.unitId || ''),
          score: Math.round(correct / total * 100),
          completedAt: new Date().toISOString()
        };
        persistProfiles();
      }
      return { ...profile.certificates[key] };
    }
  };
}

export const STUDENT_PROFILE_STORAGE_KEY = PROFILE_KEY;
export const STUDENT_THEMES = Object.freeze([...THEMES]);
