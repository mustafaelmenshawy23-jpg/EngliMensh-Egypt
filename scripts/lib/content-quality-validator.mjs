/**
 * Comprehensive Content Quality Validator for EngliMensh Curriculum Drafts
 * 
 * Validates vocabulary, grammar, questions, reading, listening, speaking,
 * page coverage, duplicate detection, and answer-key consistency.
 * Produces a transparent quality report and assigns strict review statuses.
 */

export const REQUIRED_MODULE_TYPES = [
  'vocabulary',
  'vocabulary_questions',
  'grammar',
  'grammar_questions',
  'reading',
  'listening',
  'speaking',
  'games',
  'comprehensive_test'
];

/**
 * Validates a single vocabulary item.
 * 
 * @param {object} item - Item object with itemId, content: { word, arabicMeaning, example, origin, sourcePdfPage }
 * @param {object} unitRange - { start: number, end: number }
 * @returns {object} { isValid: boolean, issues: string[] }
 */
export function validateVocabularyItem(item, unitRange) {
  const issues = [];
  const c = item?.content || {};

  if (!item?.itemId) issues.push('Vocabulary item is missing itemId');

  // Word validation
  const word = typeof c.word === 'string' ? c.word.trim() : '';
  if (!word) {
    issues.push(`${item?.itemId || 'Item'}: missing vocabulary word`);
  } else {
    // Check for abnormal length or OCR concatenation
    const tokens = word.split(/\s+/);
    if (tokens.length > 6) {
      issues.push(`${item.itemId}: vocabulary phrase is abnormally long (${tokens.length} words): "${word.slice(0, 40)}..."`);
    }
    const hasLongToken = tokens.some((t) => t.length > 35 && !t.includes('-') && !t.includes('/'));
    if (hasLongToken || word.length > 60) {
      issues.push(`${item.itemId}: vocabulary word contains corrupted, abnormally long token: "${word.slice(0, 45)}..." (length ${word.length})`);
    }
    // Check for character repetition or OCR noise
    if (/([^\s._\-])\1{4,}/i.test(word) || /[\uFFFD]/.test(word)) {
      issues.push(`${item.itemId}: vocabulary word contains OCR garbage or character repetition: "${word}"`);
    }
  }

  // Arabic meaning validation
  const arabic = typeof c.arabicMeaning === 'string' ? c.arabicMeaning.trim() : '';
  if (!arabic) {
    issues.push(`${item?.itemId || 'Item'}: missing Arabic meaning`);
  } else {
    // Must contain Arabic characters
    const hasArabicGlyphs = /[\u0600-\u06FF]/.test(arabic);
    if (!hasArabicGlyphs) {
      issues.push(`${item?.itemId || 'Item'}: Arabic meaning contains no Arabic characters: "${arabic}"`);
    }
    if (arabic.length > 120) {
      issues.push(`${item?.itemId || 'Item'}: Arabic meaning is abnormally long (${arabic.length} chars)`);
    }
  }

  // Provenance validation
  if (!c.origin || !['source', 'supplementary'].includes(c.origin)) {
    issues.push(`${item?.itemId || 'Item'}: invalid origin (must be 'source' or 'supplementary')`);
  }
  if (!Number.isInteger(c.sourcePdfPage) || c.sourcePdfPage < unitRange.start || c.sourcePdfPage > unitRange.end) {
    issues.push(`${item?.itemId || 'Item'}: sourcePdfPage (${c.sourcePdfPage}) is outside unit range ${unitRange.start}-${unitRange.end}`);
  }

  return { isValid: issues.length === 0, issues };
}

/**
 * Validates a single question item (used across vocabulary_questions, grammar_questions, comprehensive_test, reading/listening questions).
 * 
 * @param {object} item - Item object with itemId, content: { question, options, correctAnswer, reason, origin, sourcePdfPage }
 * @param {object} unitRange - { start: number, end: number }
 * @returns {object} { isValid: boolean, issues: string[] }
 */
export function validateQuestionItem(item, unitRange) {
  const issues = [];
  const c = item?.content || {};
  const id = item?.itemId || 'Question';

  if (!item?.itemId) issues.push('Question item is missing itemId');

  // Question prompt
  const prompt = typeof c.question === 'string' ? c.question.trim() : '';
  if (!prompt || prompt.length < 10) {
    issues.push(`${id}: question prompt is missing or too short (${prompt.length} chars)`);
  }
  if (/([^\s._\-])\1{4,}/i.test(prompt) || /[\uFFFD]/.test(prompt)) {
    issues.push(`${id}: question prompt contains OCR noise: "${prompt.slice(0, 40)}"`);
  }

  // Options
  if (!Array.isArray(c.options)) {
    issues.push(`${id}: options must be an array`);
  } else {
    if (c.options.length < 3 || c.options.length > 5) {
      issues.push(`${id}: question must have 3-4 options (found ${c.options.length})`);
    }
    // Check distinct options
    const uniqueOptions = new Set(c.options.map((opt) => String(opt).trim().toLowerCase()));
    if (uniqueOptions.size !== c.options.length) {
      issues.push(`${id}: question contains duplicate options: ${JSON.stringify(c.options)}`);
    }
    // Correct answer matching
    if (!c.correctAnswer || typeof c.correctAnswer !== 'string') {
      issues.push(`${id}: missing correctAnswer string`);
    } else {
      const match = c.options.some((opt) => String(opt).trim() === c.correctAnswer.trim());
      if (!match) {
        issues.push(`${id}: correctAnswer "${c.correctAnswer}" does not match any of the provided options: [${c.options.map((o) => `"${o}"`).join(', ')}]`);
      }
    }
  }

  // Reason / explanation
  const reason = c.reason || c.explanation;
  if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
    issues.push(`${id}: missing or incomplete explanation/reason for answer`);
  }

  // Provenance
  if (!c.origin || !['source', 'supplementary'].includes(c.origin)) {
    issues.push(`${id}: invalid origin (must be 'source' or 'supplementary')`);
  }
  if (!Number.isInteger(c.sourcePdfPage) || c.sourcePdfPage < unitRange.start || c.sourcePdfPage > unitRange.end) {
    issues.push(`${id}: sourcePdfPage (${c.sourcePdfPage}) is outside unit range ${unitRange.start}-${unitRange.end}`);
  }

  return { isValid: issues.length === 0, issues };
}

/**
 * Validates a grammar entry.
 * 
 * @param {object} item - Item object with itemId, content: { rule, explanation, example, origin, sourcePdfPage }
 * @param {object} unitRange - { start: number, end: number }
 * @returns {object} { isValid: boolean, issues: string[] }
 */
export function validateGrammarItem(item, unitRange) {
  const issues = [];
  const c = item?.content || {};
  const id = item?.itemId || 'Grammar';

  if (!item?.itemId) issues.push('Grammar item is missing itemId');

  const rule = typeof c.rule === 'string' ? c.rule.trim() : '';
  if (!rule || rule.length < 5) issues.push(`${id}: missing or incomplete grammar rule`);

  const explanation = typeof c.explanation === 'string' ? c.explanation.trim() : '';
  if (!explanation || explanation.length < 10) issues.push(`${id}: missing or incomplete grammar explanation`);

  if (!c.origin || !['source', 'supplementary'].includes(c.origin)) {
    issues.push(`${id}: invalid origin (must be 'source' or 'supplementary')`);
  }
  if (!Number.isInteger(c.sourcePdfPage) || c.sourcePdfPage < unitRange.start || c.sourcePdfPage > unitRange.end) {
    issues.push(`${id}: sourcePdfPage (${c.sourcePdfPage}) is outside unit range ${unitRange.start}-${unitRange.end}`);
  }

  return { isValid: issues.length === 0, issues };
}

/**
 * Validates the full unit draft and produces a complete quality audit report.
 * 
 * @param {object} draft - The unit draft object
 * @param {object} expectedRange - { start: number, end: number }
 * @param {Array<object>} sourcePageRows - Array of extracted source page records
 * @returns {object} { isValid: boolean, status: string, score: number, criticalFailures: string[], report: object }
 */
export function validateUnitDraftQuality(draft, expectedRange, sourcePageRows = []) {
  const criticalFailures = [];
  const warnings = [];
  const sectionReports = {};

  if (!draft || typeof draft !== 'object') {
    return {
      isValid: false,
      status: 'failed_validation',
      score: 0,
      criticalFailures: ['Unit draft is empty or not a valid object'],
      report: { summary: 'Invalid draft object' }
    };
  }

  const { start, end } = expectedRange;
  const expectedTotalPages = end - start + 1;

  // 1. Coverage Validation
  const recordedCoverage = Array.isArray(draft.sourceCoverage) ? draft.sourceCoverage : [];
  const coverageSet = new Set(recordedCoverage);
  const missingCoveragePages = [];
  for (let p = start; p <= end; p++) {
    if (!coverageSet.has(p)) missingCoveragePages.push(p);
  }

  if (recordedCoverage.length === 0) {
    criticalFailures.push('sourceCoverage is empty: draft records zero source pages');
  } else if (missingCoveragePages.length > 0) {
    criticalFailures.push(`Incomplete source coverage: expected ${start}-${end} (${expectedTotalPages} pages), but coverage omitted ${missingCoveragePages.length} page(s): ${missingCoveragePages.slice(0, 10).join(', ')}${missingCoveragePages.length > 10 ? '...' : ''} (stopped at ${Math.max(...recordedCoverage)})`);
  }

  const outOfRangeCoverage = recordedCoverage.filter((p) => p < start || p > end);
  if (outOfRangeCoverage.length > 0) {
    criticalFailures.push(`sourceCoverage cites pages outside expected unit range ${start}-${end}: ${outOfRangeCoverage.join(', ')}`);
  }

  // 2. Sections Validation
  if (!Array.isArray(draft.sections)) {
    criticalFailures.push('Draft sections must be an array');
    return {
      isValid: false,
      status: 'failed_validation',
      score: 0,
      criticalFailures,
      report: { summary: 'Missing sections array' }
    };
  }

  const sectionsByType = new Map();
  for (const section of draft.sections) {
    if (!section.type || !REQUIRED_MODULE_TYPES.includes(section.type)) {
      criticalFailures.push(`Unknown or invalid section type: ${section.type}`);
      continue;
    }
    if (sectionsByType.has(section.type)) {
      criticalFailures.push(`Duplicate section type: ${section.type}`);
    }
    sectionsByType.set(section.type, section);
  }

  // Check all required 8 sections exist
  for (const reqType of REQUIRED_MODULE_TYPES) {
    if (!sectionsByType.has(reqType)) {
      criticalFailures.push(`Missing required section: ${reqType}`);
    }
  }

  // 3. Item-level Validation & Section Population
  const seenItemIds = new Set();
  const seenVocabularyWords = new Set();
  const seenQuestionPrompts = new Set();

  let totalItems = 0;
  let sourceItemCount = 0;
  let supplementaryItemCount = 0;

  for (const sectionType of REQUIRED_MODULE_TYPES) {
    const section = sectionsByType.get(sectionType);
    const items = section?.items || [];
    sectionReports[sectionType] = {
      itemCount: items.length,
      validItems: 0,
      issues: []
    };

    if (!Array.isArray(items)) {
      criticalFailures.push(`Section ${sectionType} items must be an array`);
      continue;
    }

    for (const item of items) {
      totalItems++;
      if (item.content?.origin === 'source') sourceItemCount++;
      else if (item.content?.origin === 'supplementary') supplementaryItemCount++;

      // Unique ID check
      if (item.itemId) {
        if (seenItemIds.has(item.itemId)) {
          criticalFailures.push(`Duplicate itemId across draft: ${item.itemId}`);
        }
        seenItemIds.add(item.itemId);
      }

      // Route to specialized item validator
      if (sectionType === 'vocabulary') {
        const vResult = validateVocabularyItem(item, expectedRange);
        if (!vResult.isValid) {
          criticalFailures.push(...vResult.issues);
          sectionReports[sectionType].issues.push(...vResult.issues);
        } else {
          sectionReports[sectionType].validItems++;
          const wordKey = item.content.word.trim().toLowerCase();
          if (seenVocabularyWords.has(wordKey)) {
            warnings.push(`Duplicate vocabulary word in unit: "${item.content.word}"`);
          }
          seenVocabularyWords.add(wordKey);
        }
      } else if (sectionType === 'grammar') {
        const gResult = validateGrammarItem(item, expectedRange);
        if (!gResult.isValid) {
          criticalFailures.push(...gResult.issues);
          sectionReports[sectionType].issues.push(...gResult.issues);
        } else {
          sectionReports[sectionType].validItems++;
        }
      } else if (sectionType.endsWith('_questions') || sectionType === 'comprehensive_test') {
        const qResult = validateQuestionItem(item, expectedRange);
        if (!qResult.isValid) {
          criticalFailures.push(...qResult.issues);
          sectionReports[sectionType].issues.push(...qResult.issues);
        } else {
          sectionReports[sectionType].validItems++;
          const promptKey = item.content.question.trim().toLowerCase();
          if (seenQuestionPrompts.has(promptKey)) {
            criticalFailures.push(`Duplicate question prompt detected: "${item.content.question.slice(0, 40)}"`);
          }
          seenQuestionPrompts.add(promptKey);
        }
      } else if (sectionType === 'reading' || sectionType === 'listening') {
        // Can contain passage/script + nested questions or separate items
        const c = item.content || {};
        if (c.passage || c.script) {
          if (!c.origin || !['source', 'supplementary'].includes(c.origin)) {
            criticalFailures.push(`${item.itemId || sectionType}: missing or invalid origin`);
          }
          if (!Number.isInteger(c.sourcePdfPage) || c.sourcePdfPage < start || c.sourcePdfPage > end) {
            criticalFailures.push(`${item.itemId || sectionType}: sourcePdfPage is outside unit range`);
          }
          sectionReports[sectionType].validItems++;
        } else if (c.question) {
          const qResult = validateQuestionItem(item, expectedRange);
          if (!qResult.isValid) criticalFailures.push(...qResult.issues);
          else sectionReports[sectionType].validItems++;
        }
      } else if (sectionType === 'speaking') {
        const c = item.content || {};
        const dialogue = Array.isArray(c.dialogue) ? c.dialogue : [];
        if (dialogue.length < 2) {
          criticalFailures.push('Speaking item ' + item.itemId + ' must contain at least two dialogue turns');
        } else {
          const invalidTurn = dialogue.find((turn) =>
            !String(turn.speaker || '').trim() ||
            !String(turn.text || '').trim() ||
            !['male', 'female'].includes(turn.speakerGender)
          );
          if (invalidTurn) {
            criticalFailures.push('Speaking item ' + item.itemId + ' has a turn without speaker, text or valid speakerGender');
          } else if (!c.origin || !['source', 'supplementary'].includes(c.origin)) {
            criticalFailures.push('Speaking item ' + item.itemId + ' has invalid origin');
          } else if (!Number.isInteger(c.sourcePdfPage) || c.sourcePdfPage < start || c.sourcePdfPage > end) {
            criticalFailures.push('Speaking item ' + item.itemId + ' has sourcePdfPage outside the unit range');
          } else {
            sectionReports[sectionType].validItems++;
          }
        }
      } else if (sectionType === 'games') {
        const c = item.content || {};
        const requiredFields = ['gameName', 'gameType', 'skill', 'difficulty', 'description'];
        for (const field of requiredFields) {
          if (typeof c[field] !== 'string' || !c[field].trim()) {
            criticalFailures.push('Game item ' + item.itemId + ' is missing ' + field);
          }
        }
        if (!['vocabulary', 'grammar', 'reading', 'listening', 'speaking'].includes(c.skill)) {
          criticalFailures.push('Game item ' + item.itemId + ' has an invalid skill');
        }
        if (!['easy', 'medium', 'hard'].includes(c.difficulty)) {
          criticalFailures.push('Game item ' + item.itemId + ' has an invalid difficulty');
        }
        if (!c.origin || !['source', 'supplementary'].includes(c.origin)) {
          criticalFailures.push('Game item ' + item.itemId + ' has invalid origin');
        }
        if (!Number.isInteger(c.sourcePdfPage) || c.sourcePdfPage < start || c.sourcePdfPage > end) {
          criticalFailures.push('Game item ' + item.itemId + ' has sourcePdfPage outside the unit range');
        }
        if (requiredFields.every(field => typeof c[field] === 'string' && c[field].trim()) &&
            ['vocabulary', 'grammar', 'reading', 'listening', 'speaking'].includes(c.skill) &&
            ['easy', 'medium', 'hard'].includes(c.difficulty) &&
            ['source', 'supplementary'].includes(c.origin) &&
            Number.isInteger(c.sourcePdfPage) && c.sourcePdfPage >= start && c.sourcePdfPage <= end) {
          sectionReports[sectionType].validItems++;
        }
      }
    }
  }

  // 4. Source Check for Empty Sections
  // If source pages had readable text, but the draft produced zero questions/items across all practice sections
  const questionsTotal = (sectionsByType.get('vocabulary_questions')?.items?.length || 0) +
    (sectionsByType.get('grammar_questions')?.items?.length || 0) +
    (sectionsByType.get('comprehensive_test')?.items?.length || 0);

  if (totalItems === 0) {
    criticalFailures.push('Unit draft is completely empty across all 8 modules');
  } else if (questionsTotal === 0 && sourceItemCount > 0) {
    criticalFailures.push('Draft contains source material but completely empty practice question banks (vocabulary_questions, grammar_questions, and comprehensive_test all have 0 items)');
  }

  // 5. Calculate Transparent Quality Score (0 - 100)
  let score = 100;
  if (missingCoveragePages.length > 0) {
    const coverageRatio = (expectedTotalPages - missingCoveragePages.length) / expectedTotalPages;
    score -= Math.round((1 - coverageRatio) * 35);
  }
  if (criticalFailures.length > 0) {
    score -= Math.min(60, criticalFailures.length * 15);
  }
  if (warnings.length > 0) {
    score -= Math.min(15, warnings.length * 5);
  }
  if (totalItems < 5) {
    score -= 20;
  }
  score = Math.max(0, Math.min(100, score));

  // Determine review status
  let status = 'ready_for_teacher_review';
  if (criticalFailures.length > 0) {
    status = 'failed_validation';
  } else if (warnings.length > 0 || score < 85) {
    status = 'needs_review';
  }

  return {
    isValid: criticalFailures.length === 0,
    status,
    score,
    criticalFailures,
    warnings,
    report: {
      unitTitle: draft.unitTitle,
      expectedRange: { start, end, totalPages: expectedTotalPages },
      recordedCoverage: {
        totalPages: recordedCoverage.length,
        isComplete: missingCoveragePages.length === 0,
        missingPages: missingCoveragePages
      },
      itemTotals: {
        totalItems,
        sourceItems: sourceItemCount,
        supplementaryItems: supplementaryItemCount,
        vocabularyCount: seenVocabularyWords.size,
        questionsCount: questionsTotal
      },
      sections: sectionReports,
      validationTimestamp: new Date().toISOString()
    }
  };
}
