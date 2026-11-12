import assert from 'node:assert/strict';
import { getBalancedQuizOptions } from '../src/lib/balanced-quiz-options.mjs';

const groupKey = 'secondary1-student-term1:1:comprehensive_test';
const sourceOptions = ['alpha', 'bravo', 'charlie', 'delta'];
const correctAnswer = 'charlie';
const positions = [];

for (let index = 0; index < 12; index += 1) {
  const first = getBalancedQuizOptions({
    itemId: `q-${index + 1}`,
    options: sourceOptions,
    correctAnswer,
    questionIndex: index,
    groupKey
  });
  const repeated = getBalancedQuizOptions({
    itemId: `q-${index + 1}`,
    options: sourceOptions,
    correctAnswer,
    questionIndex: index,
    groupKey
  });
  assert.deepEqual(first, repeated, 'A question must keep the same option order after rerender.');
  assert.deepEqual([...first].sort(), [...sourceOptions].sort(), 'Shuffling must preserve every option exactly once.');
  assert.equal(first.filter((option) => option === correctAnswer).length, 1, 'The correct answer must appear exactly once.');
  positions.push(first.indexOf(correctAnswer));
}
for (let start = 0; start < positions.length; start += 4) {
  assert.deepEqual([...positions.slice(start, start + 4)].sort(), [0, 1, 2, 3],
    'Every full block of four questions must distribute the correct answer across A, B, C, and D.');
}

const threeOptionPositions = Array.from({ length: 9 }, (_, index) =>
  getBalancedQuizOptions({
    itemId: `three-${index}`,
    options: ['one', 'two', 'three'],
    correctAnswer: 'two',
    questionIndex: index,
    groupKey: 'three-option-section'
  }).indexOf('two')
);
for (let start = 0; start < threeOptionPositions.length; start += 3) {
  assert.deepEqual([...threeOptionPositions.slice(start, start + 3)].sort(), [0, 1, 2],
    'Three-option questions must cycle the correct answer across all available positions.');
}

const invalidKeyOptions = getBalancedQuizOptions({
  itemId: 'invalid-key',
  options: ['one', 'two', 'three'],
  correctAnswer: 'missing',
  questionIndex: 0,
  groupKey
});
assert.deepEqual([...invalidKeyOptions].sort(), ['one', 'three', 'two'],
  'An invalid answer key must not cause options to be dropped or fabricated.');

console.log('Balanced quiz option tests passed: stable order, intact options, preserved answer key, and balanced A/B/C/D positions.');
