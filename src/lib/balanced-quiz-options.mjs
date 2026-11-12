function stableHash(value) {
  let hash = 2166136261;
  for (const char of String(value ?? '')) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededShuffle(values, seedText) {
  const result = [...values];
  let seed = stableHash(seedText) || 1;
  for (let index = result.length - 1; index > 0; index -= 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const swapIndex = seed % (index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

/**
 * Keeps each question's answer key intact while cycling the correct option
 * through answer positions within its quiz section. For four-option banks,
 * every consecutive block of four questions uses A, B, C, and D once each.
 */
export function getBalancedQuizOptions({ itemId, options, correctAnswer, questionIndex, groupKey }) {
  if (!Array.isArray(options) || options.length < 2) return Array.isArray(options) ? [...options] : [];
  const uniqueOptions = new Set(options);
  const hasOneCorrectAnswer = typeof correctAnswer === 'string' &&
    options.filter((option) => option === correctAnswer).length === 1 &&
    uniqueOptions.size === options.length;
  if (!hasOneCorrectAnswer) return seededShuffle(options, itemId);

  const stableOffset = stableHash(groupKey) % options.length;
  const safeIndex = Number.isInteger(questionIndex) && questionIndex >= 0
    ? questionIndex
    : stableHash(itemId) % options.length;
  const targetIndex = (safeIndex + stableOffset) % options.length;
  const distractors = seededShuffle(options.filter((option) => option !== correctAnswer), itemId);
  distractors.splice(targetIndex, 0, correctAnswer);
  return distractors;
}
