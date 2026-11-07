/**
 * Test Suite for EngliMensh Curriculum Quality Gate & Content Validator
 * 
 * Verifies that:
 * 1. Corrupted vocabulary (extremely long tokens, OCR noise) is rejected.
 * 2. Incomplete source coverage (e.g. 102-131 instead of 102-139) is rejected.
 * 3. Answer key inconsistencies (not in options, duplicate options) are rejected.
 * 4. Mislabeled origin or invalid source page citations are rejected.
 * 5. The previously corrupted Unit 4 draft pattern is identified and rejected.
 * 6. Valid unit content successfully passes with high quality score.
 * 7. Source quality gate correctly classifies clean, noisy, and corrupted page text.
 */

import { validatePageText, validateUnitSourceCoverage } from './lib/source-quality-gate.mjs';
import { validateUnitDraftQuality, REQUIRED_MODULE_TYPES } from './lib/content-quality-validator.mjs';

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

console.log('--- TEST 1: Source Quality Gate (Page Text) ---');
{
  const cleanText = 'Unit 4: The Power of Choice. Consumers make decisions every day based on price, quality, and personal preference.';
  const cleanResult = validatePageText(cleanText);
  assert(cleanResult.status === 'valid', 'Clean page text is classified as valid');
  assert(cleanResult.score >= 80, `Clean page receives high score (${cleanResult.score})`);

  const emptyResult = validatePageText('   ');
  assert(emptyResult.status === 'blocked', 'Empty text is blocked');

  const longGarbageWord = 'Here is a lesson text with ' + 'a'.repeat(55) + ' which is clearly OCR corrupted garbage.';
  const garbageResult = validatePageText(longGarbageWord);
  assert(garbageResult.status === 'blocked', 'Abnormally long unbroken OCR token is blocked');
  assert(garbageResult.issues.some((i) => i.includes('abnormally long unbroken word')), 'Issues cite abnormally long word');

  const repeatedCharText = 'Regular text followed by xxxxxxxxxxxxxxx and repeated noise.';
  const repeatResult = validatePageText(repeatedCharText);
  assert(repeatResult.issues.some((i) => i.includes('repetition')), 'Excessive character repetition is detected');

  const replacementCharText = 'Broken \uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD text';
  const replacementResult = validatePageText(replacementCharText);
  assert(replacementResult.status === 'blocked', 'Text with multiple replacement characters is blocked');
}

console.log('\n--- TEST 2: Source Quality Gate (Unit Coverage Range) ---');
{
  // Expected 102 to 139 (38 pages)
  const fullPages = [];
  for (let p = 102; p <= 139; p++) {
    fullPages.push({
      pdfPage: p,
      text: `Unit 4 Page ${p}: Authentic lesson text about choices and consumption with sufficient characters and words.`
    });
  }

  const fullCoverageResult = validateUnitSourceCoverage(fullPages, 102, 139);
  assert(fullCoverageResult.status === 'valid', 'Full complete coverage 102-139 is valid');
  assert(fullCoverageResult.coveragePercentage === 100, 'Coverage percentage is 100%');

  // Incomplete coverage: stops at 131
  const incompletePages = fullPages.filter((p) => p.pdfPage <= 131);
  const incompleteCoverageResult = validateUnitSourceCoverage(incompletePages, 102, 139);
  assert(incompleteCoverageResult.status === 'blocked', 'Incomplete range (stopping at 131 instead of 139) is blocked');
  assert(incompleteCoverageResult.missingPages.length === 8, 'Accurately reports 8 missing pages (132-139)');
  assert(incompleteCoverageResult.issues.some((i) => i.includes('Missing 8 expected page(s)')), 'Issue message specifies missing pages');

  // Duplicate pages
  const duplicatePages = [...fullPages, { pdfPage: 110, text: 'duplicate' }];
  const duplicateResult = validateUnitSourceCoverage(duplicatePages, 102, 139);
  assert(duplicateResult.status === 'blocked', 'Duplicate page records are blocked');
  assert(duplicateResult.duplicatePages.includes(110), 'Identifies duplicate page 110');
}

console.log('\n--- TEST 3: Previously Corrupted Unit 4 Draft Rejection ---');
{
  // Reconstruct the exact failure profile from the prompt:
  // - Corrupted, extremely long vocabulary text
  // - Incomplete coverage: stopped at page 131 instead of 139
  // - Empty vocabulary questions, grammar questions, reading, listening, speaking, comprehensive test
  const corruptedUnit4Draft = {
    unitTitle: 'The Power of Choice',
    sourceCoverage: Array.from({ length: 30 }, (_, i) => 102 + i), // 102 to 131 (omits 132-139!)
    sections: REQUIRED_MODULE_TYPES.map((type) => {
      if (type === 'vocabulary') {
        return {
          type,
          title: 'Vocabulary',
          items: [
            {
              itemId: 'vocab-corrupted-1',
              content: {
                // Extremely long corrupted string instead of a real word
                word: 'conchoicemanufacturertransactionsupermarketconsumptionsustainablesavingsbargaininvestmentpurchasingdecision'.repeat(2),
                arabicMeaning: '', // Empty Arabic meaning
                origin: 'source',
                sourcePdfPage: 104
              }
            }
          ]
        };
      }
      if (type === 'grammar') {
        return {
          type,
          title: 'Grammar',
          items: [
            {
              itemId: 'gram-1',
              content: {
                rule: 'Conditionals type 1',
                explanation: 'Used for real possibilities in the future.',
                origin: 'source',
                sourcePdfPage: 110
              }
            }
          ]
        };
      }
      // All other sections empty as reported in the failure
      return {
        type,
        title: type.replaceAll('_', ' '),
        items: []
      };
    })
  };

  const audit = validateUnitDraftQuality(corruptedUnit4Draft, { start: 102, end: 139 });
  assert(!audit.isValid, 'Corrupted Unit 4 draft is REJECTED by quality validator');
  assert(audit.status === 'failed_validation', 'Status is failed_validation');
  assert(audit.criticalFailures.some((f) => f.includes('Incomplete source coverage')), 'Critical failure flags incomplete coverage (stopped at 131)');
  assert(audit.criticalFailures.some((f) => f.includes('corrupted, abnormally long token')), 'Critical failure flags corrupted vocabulary word');
  assert(audit.criticalFailures.some((f) => f.includes('missing Arabic meaning')), 'Critical failure flags missing Arabic meaning');
  assert(audit.criticalFailures.some((f) => f.includes('empty practice question banks')), 'Critical failure flags empty question banks');
  assert(audit.score < 50, `Quality score is low (${audit.score}/100)`);
}

console.log('\n--- TEST 4: Question Integrity & Answer Key Consistency ---');
{
  const invalidQuestionDraft = {
    unitTitle: 'Test Unit',
    sourceCoverage: [10, 11],
    sections: REQUIRED_MODULE_TYPES.map((type) => ({
      type,
      title: type,
      items: type === 'vocabulary_questions' ? [
        {
          itemId: 'q-key-mismatch',
          content: {
            question: 'What is the opposite of expensive?',
            options: ['cheap', 'costly', 'valuable'],
            correctAnswer: 'affordable', // NOT among options!
            reason: 'Affordable means inexpensive.',
            origin: 'supplementary',
            sourcePdfPage: 10
          }
        },
        {
          itemId: 'q-duplicate-options',
          content: {
            question: 'Choose the correct synonym for huge:',
            options: ['large', 'large', 'tiny'], // duplicate!
            correctAnswer: 'large',
            reason: 'Huge means very large.',
            origin: 'supplementary',
            sourcePdfPage: 10
          }
        }
      ] : []
    }))
  };

  const audit = validateUnitDraftQuality(invalidQuestionDraft, { start: 10, end: 11 });
  assert(!audit.isValid, 'Draft with invalid questions is rejected');
  assert(audit.criticalFailures.some((f) => f.includes('does not match any of the provided options')), 'Rejects correctAnswer not matching any option');
  assert(audit.criticalFailures.some((f) => f.includes('duplicate options')), 'Rejects duplicate options');
}

console.log('\n--- TEST 5: Provenance & Origin Guard ---');
{
  const invalidOriginDraft = {
    unitTitle: 'Test Origin',
    sourceCoverage: [15, 16],
    sections: REQUIRED_MODULE_TYPES.map((type) => ({
      type,
      title: type,
      items: type === 'vocabulary' ? [
        {
          itemId: 'vocab-bad-page',
          content: {
            word: 'choice',
            arabicMeaning: 'اختيار',
            origin: 'source',
            sourcePdfPage: 99 // Outside unit range 15-16!
          }
        },
        {
          itemId: 'vocab-bad-origin',
          content: {
            word: 'decision',
            arabicMeaning: 'قرار',
            origin: 'invented_source', // Invalid origin!
            sourcePdfPage: 15
          }
        }
      ] : []
    }))
  };

  const audit = validateUnitDraftQuality(invalidOriginDraft, { start: 15, end: 16 });
  assert(!audit.isValid, 'Invalid provenance draft is rejected');
  assert(audit.criticalFailures.some((f) => f.includes('outside unit range')), 'Rejects source citation outside unit range');
  assert(audit.criticalFailures.some((f) => f.includes('invalid origin')), 'Rejects invalid origin string');
}

console.log('\n--- TEST 6: High-Quality Valid Draft Passes ---');
{
  const validDraft = {
    unitTitle: 'The Power of Choice',
    sourceCoverage: [102, 103, 104],
    sections: [
      {
        type: 'vocabulary',
        title: 'Vocabulary',
        items: [
          {
            itemId: 'u4-voc-1',
            content: {
              word: 'consumer',
              arabicMeaning: 'مستهلك',
              example: 'A consumer buys products and services for personal use.',
              origin: 'source',
              sourcePdfPage: 102
            }
          },
          {
            itemId: 'u4-voc-2',
            content: {
              word: 'sustainable',
              arabicMeaning: 'مستدام',
              example: 'Sustainable products help preserve the environment.',
              origin: 'source',
              sourcePdfPage: 103
            }
          }
        ]
      },
      {
        type: 'vocabulary_questions',
        title: 'Vocabulary Questions',
        items: [
          {
            itemId: 'u4-vq-1',
            content: {
              question: 'A person who purchases goods and services for personal use is a:',
              options: ['consumer', 'producer', 'distributor', 'carrier'],
              correctAnswer: 'consumer',
              reason: 'A consumer is the end user who buys products.',
              origin: 'supplementary',
              sourcePdfPage: 102
            }
          }
        ]
      },
      {
        type: 'grammar',
        title: 'Grammar',
        items: [
          {
            itemId: 'u4-gr-1',
            content: {
              rule: 'First Conditional with modal verbs',
              explanation: 'Use "if + present simple, modal + infinitive" to give advice or express possibility.',
              example: 'If you want to save money, you should compare prices.',
              origin: 'source',
              sourcePdfPage: 103
            }
          }
        ]
      },
      {
        type: 'grammar_questions',
        title: 'Grammar Questions',
        items: [
          {
            itemId: 'u4-gq-1',
            content: {
              question: 'If you ______ to save money, you should make a monthly budget.',
              options: ['want', 'wanted', 'will want', 'have wanted'],
              correctAnswer: 'want',
              reason: 'First conditional uses present simple in the if-clause.',
              origin: 'supplementary',
              sourcePdfPage: 103
            }
          }
        ]
      },
      {
        type: 'reading',
        title: 'Reading & Questions',
        items: [
          {
            itemId: 'u4-rd-1',
            content: {
              passage: 'Modern consumers face hundreds of choices every day in supermarkets and online stores.',
              origin: 'source',
              sourcePdfPage: 104
            }
          },
          {
            itemId: 'u4-rd-q1',
            content: {
              question: 'Where do modern consumers face daily purchasing decisions according to the text?',
              options: ['In supermarkets and online', 'Only in foreign markets', 'Nowhere today', 'In banks only'],
              correctAnswer: 'In supermarkets and online',
              reason: 'The passage specifies supermarkets and online stores.',
              origin: 'supplementary',
              sourcePdfPage: 104
            }
          }
        ]
      },
      {
        type: 'listening',
        title: 'Listening & Questions',
        items: [
          {
            itemId: 'u4-ls-1',
            content: {
              script: 'Radio host: Today we discuss smart shopping habits with financial advisor Sarah.',
              origin: 'supplementary',
              sourcePdfPage: 102
            }
          }
        ]
      },
      {
        type: 'speaking',
        title: 'Speaking',
        items: [
          {
            itemId: 'u4-sp-1',
            content: {
              dialogue: [
                { speaker: 'Omar', text: 'Which smartphone do you think offers better value?' },
                { speaker: 'Ziad', text: 'I would compare the battery life and warranty before deciding.' }
              ],
              origin: 'supplementary',
              sourcePdfPage: 102
            }
          }
        ]
      },
      {
        type: 'comprehensive_test',
        title: 'Comprehensive Unit Test',
        items: [
          {
            itemId: 'u4-test-1',
            content: {
              question: 'Which word describes purchasing choices that do not harm future resources?',
              options: ['sustainable', 'temporary', 'wasteful', 'expensive'],
              correctAnswer: 'sustainable',
              reason: 'Sustainable practices protect natural resources for future generations.',
              origin: 'supplementary',
              sourcePdfPage: 103
            }
          }
        ]
      },
      {
        type: 'games',
        title: 'Games',
        items: [
          {
            itemId: 'u4-game-1',
            content: {
              gameName: 'Picture–Word Matching Game',
              targetWords: ['consumer', 'sustainable'],
              origin: 'supplementary',
              sourcePdfPage: 102
            }
          }
        ]
      }
    ]
  };

  const audit = validateUnitDraftQuality(validDraft, { start: 102, end: 104 });
  assert(audit.isValid, 'High-quality valid draft passes validation');
  assert(audit.criticalFailures.length === 0, 'No critical failures for valid draft');
  assert(audit.score >= 85, `Valid draft achieves score of ${audit.score}/100`);
  assert(audit.status === 'ready_for_teacher_review', 'Review status is ready_for_teacher_review');
}

console.log('\n=======================================');
console.log(`Test Results: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('All curriculum quality gate & validator tests passed successfully!');
}
