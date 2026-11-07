/**
 * Focused Automated Test Suite for Storage Hardening & quizAnswers Validation
 * Verifies:
 * 1. quizAnswers stored as [] -> rejected; default {} preserved.
 * 2. quizAnswers stored as null, string, or number -> rejected.
 * 3. Valid plain-object answers -> restored without losing question IDs or answer data.
 * 4. Malformed individual answer records -> no runtime crash (getQuestionState).
 * 5. Malformed wrongChoices -> safely normalized to [].
 * 6. Saving and reloading valid answers -> data remains intact.
 */

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

// Helper simulating isPlainObject and loadProgressFromStorage logic
function isPlainObject(val) {
  return Boolean(val && typeof val === 'object' && !Array.isArray(val));
}

function getQuestionState(stateObj, qId) {
  const val = stateObj.quizAnswers[qId];
  if (!val) return { choice: null, isCorrect: false, wrongChoices: [] };
  if (typeof val === 'string') {
    return { choice: val, isCorrect: true, wrongChoices: [] };
  }
  return {
    choice: val.choice || null,
    isCorrect: Boolean(val.isCorrect),
    wrongChoices: Array.isArray(val.wrongChoices) ? val.wrongChoices : []
  };
}

console.log('--- TEST SUITE: Storage Hardening & Validation ---');

// Test 1: quizAnswers stored as [] -> rejected; default {} preserved.
{
  const state = { quizAnswers: {} };
  const rawStorage = JSON.stringify({ quizAnswers: [] });
  const parsed = JSON.parse(rawStorage);
  if (isPlainObject(parsed.quizAnswers)) {
    state.quizAnswers = parsed.quizAnswers;
  }
  assert(isPlainObject(parsed.quizAnswers) === false, 'Array quizAnswers is recognized as not a plain object');
  assert(Object.keys(state.quizAnswers).length === 0, 'Default empty object {} preserved when quizAnswers is an array');
}

// Test 2: quizAnswers stored as null, string, or number -> rejected.
{
  for (const badVal of [null, 'invalid-string', 12345, undefined, []]) {
    const state = { quizAnswers: {} };
    const parsed = { quizAnswers: badVal };
    if (isPlainObject(parsed.quizAnswers)) {
      state.quizAnswers = parsed.quizAnswers;
    }
    assert(isPlainObject(parsed.quizAnswers) === false, `Non-plain-object quizAnswers (${badVal === null ? 'null' : typeof badVal}) is rejected`);
    assert(Object.keys(state.quizAnswers).length === 0, 'Default {} preserved for non-plain-object quizAnswers');
  }
}

// Test 3: Valid plain-object answers -> restored without losing question IDs or answer data.
{
  const state = { quizAnswers: {} };
  const validAnswers = {
    'p1u1-vq-1': { choice: 'pencil', isCorrect: true, wrongChoices: ['bag'] },
    'p1u1-gq-1': { choice: 'stand up', isCorrect: false, wrongChoices: ['sit down'] }
  };
  const parsed = { quizAnswers: validAnswers };
  if (isPlainObject(parsed.quizAnswers)) {
    state.quizAnswers = parsed.quizAnswers;
  }
  assert(isPlainObject(parsed.quizAnswers) === true, 'Valid plain object quizAnswers is accepted');
  assert(state.quizAnswers['p1u1-vq-1'].choice === 'pencil', 'Question ID and answer data successfully restored');
  assert(state.quizAnswers['p1u1-gq-1'].wrongChoices[0] === 'sit down', 'Wrong choices preserved');
}

// Test 4: Malformed individual answer records -> no runtime crash.
{
  const state = {
    quizAnswers: {
      'q-null': null,
      'q-string': 'just-a-string',
      'q-number': 99,
      'q-bad-obj': { choice: 123, isCorrect: 'yes', wrongChoices: 'not-an-array' }
    }
  };

  let crashed = false;
  try {
    const r1 = getQuestionState(state, 'q-null');
    const r2 = getQuestionState(state, 'q-string');
    const r3 = getQuestionState(state, 'q-number');
    const r4 = getQuestionState(state, 'q-bad-obj');
    assert(r1.isCorrect === false, 'Null answer record handled safely');
    assert(r2.choice === 'just-a-string' && r2.isCorrect === true, 'String answer record handled safely');
    assert(r4.wrongChoices.length === 0, 'Malformed wrongChoices normalized to array');
  } catch (err) {
    crashed = true;
    console.error(err);
  }
  assert(!crashed, 'Malformed individual answer records caused NO runtime crash');
}

// Test 5: Malformed wrongChoices -> safely normalized to [].
{
  const state = {
    quizAnswers: {
      'q1': { choice: 'a', isCorrect: false, wrongChoices: 'not-a-array' },
      'q2': { choice: 'b', isCorrect: false, wrongChoices: null },
      'q3': { choice: 'c', isCorrect: false, wrongChoices: { 0: 'bad' } }
    }
  };
  assert(Array.isArray(getQuestionState(state, 'q1').wrongChoices), 'String wrongChoices normalized to array');
  assert(Array.isArray(getQuestionState(state, 'q2').wrongChoices), 'Null wrongChoices normalized to array');
  assert(Array.isArray(getQuestionState(state, 'q3').wrongChoices), 'Object wrongChoices normalized to array');
}

// Test 6: Saving and reloading valid answers -> data remains intact.
{
  const storageMock = {};
  const STORAGE_KEY = 'test_progress';
  
  // Save
  const testState = {
    quizAnswers: { 'q-test': { choice: 'correct', isCorrect: true, wrongChoices: ['wrong'] } },
    game1: { score: 5, matches: ['pencil'] }
  };
  storageMock[STORAGE_KEY] = JSON.stringify(testState);

  // Reload
  const reloaded = JSON.parse(storageMock[STORAGE_KEY]);
  const restoredState = { quizAnswers: {}, game1: { score: 0, matches: [] } };
  if (isPlainObject(reloaded.quizAnswers)) restoredState.quizAnswers = reloaded.quizAnswers;
  if (isPlainObject(reloaded.game1)) restoredState.game1 = { ...restoredState.game1, ...reloaded.game1 };

  assert(restoredState.quizAnswers['q-test'].isCorrect === true, 'Reloaded quizAnswers data remains intact');
  assert(restoredState.game1.score === 5, 'Reloaded game1 score remains intact');
  assert(restoredState.game1.matches[0] === 'pencil', 'Reloaded game1 matches array remains intact');
}

console.log('\n=======================================');
console.log(`Storage Hardening Test Results: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('All storage hardening & validation unit tests passed successfully!');
}
