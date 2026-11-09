import assert from 'node:assert/strict';
import { createStudentProfileStore, STUDENT_PROFILE_STORAGE_KEY } from '../src/lib/student-profile-store.mjs';

class MemoryStorage {
  #data = new Map();
  getItem(key) { return this.#data.has(key) ? this.#data.get(key) : null; }
  setItem(key, value) { this.#data.set(key, String(value)); }
}
const storage = new MemoryStorage();
const store = createStudentProfileStore(storage);
const first = store.create({ id: 's1', name: '  Sara  ', stage: 'preparatory', grade: 1, path: 'general' });
assert.equal(first.name, 'Sara');
assert.equal(first.theme, 'classic');
assert.equal(first.path, 'general');
assert.equal(store.list().length, 1);
assert.throws(() => store.create({ id: 's1', name: 'Duplicate' }), /already exists/);
store.activate('s1');
const restoredStore = createStudentProfileStore(storage);
assert.equal(restoredStore.active()?.id, 's1', 'active student must persist across app restarts');
const key = store.progressKey(store.active(), { term: 'first' });
store.saveProgress({ quizAnswers: { q1: { isCorrect: true } } });
assert.deepEqual(store.loadProgress(), { quizAnswers: { q1: { isCorrect: true } } });
assert.notEqual(key, 'englimensh_p1u1_progress');
const plusProfile = store.create({ id: 'plus-student', name: 'Mona', stage: 'preparatory', grade: 2, path: 'new-hello-plus' });
assert.equal(plusProfile.path, 'new-hello-plus', 'student store must preserve imported curriculum pathway IDs');
assert.match(store.progressKey(plusProfile), /new-hello-plus/);
assert.notEqual(store.progressKey(store.active(), { term: 'second' }), key);
store.setTheme('s1', 'lavender');
assert.equal(store.get('s1').theme, 'lavender');
assert.throws(() => store.setTheme('s1', 'neon'), /Unsupported/);
assert.equal(store.issueCertificate('s1', { unitId: 'u1' }, { total: 10, attempted: 9, correct: 9 }), null, 'must complete every question');
assert.equal(store.issueCertificate('s1', { unitId: 'u1' }, { total: 10, attempted: 10, correct: 8 }), null, 'must reach 90 percent');
const certificate = store.issueCertificate('s1', { unitId: 'u1', unitTitle: 'Unit One' }, { total: 10, attempted: 10, correct: 9 });
assert.equal(certificate.score, 90);
assert.equal(certificate.studentName, 'Sara');
assert.equal(store.issueCertificate('s1', { unitId: 'u1', unitTitle: 'Changed' }, { total: 10, attempted: 10, correct: 10 }).score, 90, 'earned certificate is immutable');
store.create({ id: 's2', name: 'Omar', stage: 'primary', grade: 2 });
store.activate('s2');
store.saveProgress({ onlyOmar: true });
store.activate('s1');
assert.deepEqual(store.loadProgress(), { quizAnswers: { q1: { isCorrect: true } } }, 'student progress must remain isolated');
assert.ok(storage.getItem(STUDENT_PROFILE_STORAGE_KEY));
console.log('Student profile store checks passed: CRUD, isolated progress, theme validation, full-completion 90% certificates.');
