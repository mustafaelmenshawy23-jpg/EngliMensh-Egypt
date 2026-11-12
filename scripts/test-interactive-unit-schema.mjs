import assert from 'node:assert/strict';
import { buildInteractiveUnitSchema } from './lib/interactive-unit-schema.mjs';

const schema = buildInteractiveUnitSchema();
assert.deepEqual(schema.required, ['unitTitle', 'sections']);
const alternatives = schema.properties.sections.items.anyOf;
assert.equal(alternatives.length, 9, 'all nine required curriculum sections must have dedicated schemas');

const section = (type) => {
  const found = alternatives.find((entry) => entry.properties.type.enum[0] === type);
  assert.ok(found, 'missing schema for section ' + type);
  return found;
};
const content = (type) => section(type).properties.items.items.properties.content;

assert.deepEqual(content('vocabulary').required, [
  'word', 'arabicMeaning', 'example', 'origin', 'sourcePdfPage'
]);
assert.deepEqual(content('grammar').required, [
  'rule', 'explanation', 'example', 'origin', 'sourcePdfPage'
]);
assert.deepEqual(content('vocabulary_questions').required, [
  'question', 'options', 'correctAnswer', 'reason', 'origin', 'sourcePdfPage'
]);
assert.equal(content('reading').anyOf.length, 2, 'reading must accept either a complete passage or a validated question');
assert.equal(content('listening').anyOf.length, 2, 'listening must accept either a complete script or a validated question');
assert.deepEqual(content('speaking').required, ['dialogue', 'origin', 'sourcePdfPage']);
assert.deepEqual(
  content('speaking').properties.dialogue.items.properties.speakerGender.enum,
  ['male', 'female', 'unknown']
);
assert.ok(content('games').required.includes('gameMode'));
assert.ok(content('games').required.includes('correctAnswer'));
assert.ok(content('comprehensive_test').required.includes('reason'));

console.log('Section-specific Gemini response schemas passed.');
