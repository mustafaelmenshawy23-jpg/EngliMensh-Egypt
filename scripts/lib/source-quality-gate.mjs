/**
 * Source Quality Gate for EngliMensh Curriculum Extraction
 * 
 * Validates extracted source text and page coverage before sending material
 * to AI models. Detects OCR garbage, excessive character repetition, broken text,
 * missing pages, and incomplete unit boundaries.
 */

export const DEFAULT_SOURCE_GATE_CONFIG = {
  minCharsPerPage: 25,
  minWordsPerPage: 5,
  minReadableRatio: 0.55,
  maxSingleWordLength: 40,
  maxCharRepetition: 5,
  maxSubstringRepetition: 4,
  maxReplacementChars: 2
};

/**
 * Validates individual page text and classifies it as valid, needs_review, or blocked.
 * 
 * @param {string} text - The raw extracted text of the page.
 * @param {object} customConfig - Optional threshold overrides.
 * @returns {object} { status: 'valid' | 'needs_review' | 'blocked', score: number, issues: string[], metrics: object }
 */
export function validatePageText(text, customConfig = {}) {
  const config = { ...DEFAULT_SOURCE_GATE_CONFIG, ...customConfig };
  const issues = [];

  if (typeof text !== 'string') {
    return {
      status: 'blocked',
      score: 0,
      issues: ['Page text is not a string'],
      metrics: { charCount: 0, wordCount: 0, readableRatio: 0 }
    };
  }

  const trimmed = text.trim();
  const charCount = trimmed.length;

  if (charCount === 0) {
    return {
      status: 'blocked',
      score: 0,
      issues: ['Page is empty (zero extractable characters)'],
      metrics: { charCount: 0, wordCount: 0, readableRatio: 0 }
    };
  }

  // Count words
  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Replacement characters (\uFFFD)
  const replacementCharCount = (trimmed.match(/\uFFFD/g) || []).length;
  if (replacementCharCount > config.maxReplacementChars) {
    issues.push(`Contains ${replacementCharCount} unicode replacement characters (corrupted encoding)`);
  }

  // Unprintable control characters (excluding newline, tab, carriage return)
  // eslint-disable-next-line no-control-regex
  const controlChars = (trimmed.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g) || []).length;
  if (controlChars > 0) {
    issues.push(`Contains ${controlChars} unprintable control characters`);
  }

  // Readable characters: Latin letters, Arabic letters [\u0600-\u06FF], digits, whitespace, common punctuation
  const readableChars = (trimmed.match(/[a-zA-Z0-9\u0600-\u06FF\s.,!?;:'"()\-–—/]/g) || []).length;
  const readableRatio = charCount > 0 ? readableChars / charCount : 0;

  if (readableRatio < config.minReadableRatio) {
    issues.push(`Low readable text ratio: ${(readableRatio * 100).toFixed(1)}% (minimum: ${(config.minReadableRatio * 100)}%)`);
  }

  // Extremely long unbroken words (OCR character merger or garbage)
  const longWords = words.filter((w) => {
    // Exclude legitimate long strings like URLs or hyphenated compound terms
    if (w.includes('-') || w.includes('/') || w.startsWith('http')) return false;
    return w.length > config.maxSingleWordLength;
  });
  if (longWords.length > 0) {
    issues.push(`Contains ${longWords.length} abnormally long unbroken word(s) (e.g. "${longWords[0].slice(0, 30)}...", length ${longWords[0].length})`);
  }

  // Excessive character repetition (e.g. "aaaaaa" or "||||||", but tolerate fill-in blanks like "____" or "....")
  const nonBlankRepetition = trimmed.match(/([^\s._\-])\1{4,}/gi);
  if (nonBlankRepetition) {
    issues.push(`Excessive character repetition detected: "${nonBlankRepetition[0].slice(0, 10)}"`);
  }

  // Repeated meaningless substrings (e.g. "abcabcabcabc")
  const repeatedSubstrings = trimmed.match(/(.{2,6})\1{3,}/gi);
  if (repeatedSubstrings) {
    issues.push(`Repeated substring pattern detected: "${repeatedSubstrings[0].slice(0, 15)}"`);
  }

  // Volume checks
  if (charCount < config.minCharsPerPage || wordCount < config.minWordsPerPage) {
    issues.push(`Page content is unusually short (${charCount} chars, ${wordCount} words)`);
  }

  // Scoring (0 - 100)
  let score = 100;
  if (charCount < config.minCharsPerPage) score -= 30;
  if (wordCount < config.minWordsPerPage) score -= 20;
  if (readableRatio < config.minReadableRatio) score -= Math.round((1 - readableRatio) * 60);
  if (longWords.length > 0) score -= Math.min(40, longWords.length * 20);
  if (nonBlankRepetition) score -= 25;
  if (repeatedSubstrings) score -= 25;
  if (replacementCharCount > 0) score -= Math.min(30, replacementCharCount * 10);
  if (controlChars > 0) score -= Math.min(30, controlChars * 15);
  score = Math.max(0, Math.min(100, score));

  // Classification:
  // - blocked: severe corruption, empty text, mojibake, or unreadable ratio
  // - needs_review: short page (e.g. opener, cover, divider) or minor formatting anomaly
  // - valid: clear, readable source text
  let status = 'valid';
  const hasSevereCorruption = longWords.length > 0 || replacementCharCount > 5 || readableRatio < 0.35 || charCount === 0;
  if (hasSevereCorruption || score < 35) {
    status = 'blocked';
  } else if (issues.length > 0 || score < 75) {
    status = 'needs_review';
  }

  return {
    status,
    score,
    issues,
    metrics: {
      charCount,
      wordCount,
      readableRatio: Number(readableRatio.toFixed(3)),
      longWordCount: longWords.length,
      replacementCharCount
    }
  };
}

/**
 * Validates unit page coverage and completeness against expected boundaries.
 * 
 * @param {Array<object>} pageRows - Array of page records with { pdfPage: number, text: string }
 * @param {number} expectedStart - 1-based start PDF page index
 * @param {number} expectedEnd - 1-based end PDF page index
 * @param {object} customConfig - Optional threshold overrides
 * @returns {object} { status: 'valid' | 'needs_review' | 'blocked', coveragePercentage, expectedRange, actualRange, issues, pageEvaluations }
 */
export function validateUnitSourceCoverage(pageRows, expectedStart, expectedEnd, customConfig = {}) {
  const issues = [];
  const expectedTotal = expectedEnd - expectedStart + 1;

  if (!Number.isInteger(expectedStart) || expectedStart < 1) {
    return {
      status: 'blocked',
      coveragePercentage: 0,
      expectedRange: { start: expectedStart, end: expectedEnd },
      issues: ['Invalid start page index: must be a positive 1-based integer']
    };
  }

  if (!Number.isInteger(expectedEnd) || expectedEnd < expectedStart) {
    return {
      status: 'blocked',
      coveragePercentage: 0,
      expectedRange: { start: expectedStart, end: expectedEnd },
      issues: [`Invalid end page index: must be >= start page (${expectedStart})`]
    };
  }

  if (!Array.isArray(pageRows) || pageRows.length === 0) {
    const allMissing = [];
    for (let p = expectedStart; p <= expectedEnd; p++) allMissing.push(p);
    return {
      status: 'blocked',
      coveragePercentage: 0,
      expectedRange: { start: expectedStart, end: expectedEnd, totalPages: expectedTotal },
      actualRange: { foundPages: 0, validPages: 0, needsReviewPages: 0, blockedPages: expectedTotal },
      missingPages: allMissing,
      duplicatePages: [],
      issues: ['No extracted page records supplied for the unit range'],
      pageEvaluations: allMissing.map((p) => ({ pdfPage: p, status: 'blocked', score: 0, issues: ['Page missing from extraction dataset'] }))
    };
  }

  // Check for duplicates and build map
  const pageMap = new Map();
  const duplicatePages = [];
  for (const row of pageRows) {
    if (!Number.isInteger(row.pdfPage)) {
      issues.push(`Page record contains invalid or non-integer pdfPage: ${JSON.stringify(row.pdfPage)}`);
      continue;
    }
    if (pageMap.has(row.pdfPage)) {
      duplicatePages.push(row.pdfPage);
    }
    pageMap.set(row.pdfPage, row);
  }

  if (duplicatePages.length > 0) {
    issues.push(`Duplicate page entries found in extraction: ${[...new Set(duplicatePages)].join(', ')}`);
  }

  // Check completeness across [expectedStart, expectedEnd]
  const missingPages = [];
  const pageEvaluations = [];
  let blockedCount = 0;
  let reviewCount = 0;
  let validCount = 0;

  for (let pageNum = expectedStart; pageNum <= expectedEnd; pageNum++) {
    const pageRecord = pageMap.get(pageNum);
    if (!pageRecord) {
      missingPages.push(pageNum);
      pageEvaluations.push({
        pdfPage: pageNum,
        status: 'blocked',
        score: 0,
        issues: ['Page is missing from the extraction dataset']
      });
      blockedCount++;
      continue;
    }

    const evaluation = validatePageText(pageRecord.text || '', customConfig);
    pageEvaluations.push({
      pdfPage: pageNum,
      status: evaluation.status,
      score: evaluation.score,
      issues: evaluation.issues,
      metrics: evaluation.metrics
    });

    if (evaluation.status === 'blocked') blockedCount++;
    else if (evaluation.status === 'needs_review') reviewCount++;
    else validCount++;
  }

  // Check for out-of-range citations
  const outOfRangePages = pageRows
    .map((r) => r.pdfPage)
    .filter((p) => p < expectedStart || p > expectedEnd);
  if (outOfRangePages.length > 0) {
    issues.push(`Dataset contains pages outside expected unit boundary ${expectedStart}-${expectedEnd}: ${outOfRangePages.join(', ')}`);
  }

  if (missingPages.length > 0) {
    issues.push(`Missing ${missingPages.length} expected page(s): ${missingPages.slice(0, 10).join(', ')}${missingPages.length > 10 ? '...' : ''}`);
  }

  // Check sequential order in original rows
  for (let i = 1; i < pageRows.length; i++) {
    if (pageRows[i].pdfPage <= pageRows[i - 1].pdfPage) {
      issues.push(`Page records are not in strictly sequential ascending order at index ${i} (p.${pageRows[i - 1].pdfPage} followed by p.${pageRows[i].pdfPage})`);
      break;
    }
  }

  const actualExtractedCount = pageEvaluations.filter((p) => !missingPages.includes(p.pdfPage)).length;
  const coveragePercentage = Number(((actualExtractedCount / expectedTotal) * 100).toFixed(1));

  let status = 'valid';
  if (missingPages.length > 0 || blockedCount > 0 || duplicatePages.length > 0) {
    status = 'blocked';
  } else if (reviewCount > 0 || issues.length > 0) {
    status = 'needs_review';
  }

  return {
    status,
    coveragePercentage,
    expectedRange: { start: expectedStart, end: expectedEnd, totalPages: expectedTotal },
    actualRange: {
      foundPages: actualExtractedCount,
      validPages: validCount,
      needsReviewPages: reviewCount,
      blockedPages: blockedCount
    },
    missingPages,
    duplicatePages: [...new Set(duplicatePages)],
    issues,
    pageEvaluations
  };
}
