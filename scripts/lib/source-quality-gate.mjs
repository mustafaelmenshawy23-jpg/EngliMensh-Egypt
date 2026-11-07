export const REQUIRED_UNIT_SECTIONS = [
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

export function validatePageText(page = {}) {
  const text = typeof page.text === 'string' ? page.text : '';
  const trimmed = text.trim();
  const reasons = [];
  const warnings = [];

  if (trimmed.length < 20) reasons.push('text_missing_or_too_short');
  if (text.includes('\uFFFD')) reasons.push('unicode_replacement_character');
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(text)) reasons.push('control_character');
  if (/(.)\1{5,}/u.test(text)) reasons.push('repeated_character_run');

  const longTokens = text.match(/[\p{L}\p{N}_]{41,}/gu) || [];
  if (longTokens.length) reasons.push('unbroken_token_over_40_characters');

  const readableCount = (text.match(/[\p{L}\p{N}\s\p{P}]/gu) || []).length;
  const readableRatio = text.length ? readableCount / text.length : 0;
  if (text.length >= 20 && readableRatio < 0.55) reasons.push('low_readable_character_ratio');

  if (typeof page.ocrConfidence === 'number') {
    if (page.ocrConfidence < 45) reasons.push('low_ocr_confidence');
    else if (page.ocrConfidence < 65) warnings.push('medium_ocr_confidence');
  }

  const extractionStatus = String(page.extractionStatus || '');
  if (/^(ocr_error|ocr_empty|ocr_unreliable|empty_or_scanned)/i.test(extractionStatus)) {
    reasons.push('extraction_status_requires_review');
  }

  return {
    status: reasons.length ? 'needs_review' : 'valid',
    reasons: [...new Set(reasons)],
    warnings,
    metrics: {
      characterCount: text.length,
      readableRatio: Number(readableRatio.toFixed(3)),
      longTokenCount: longTokens.length,
      ocrConfidence: Number.isFinite(page.ocrConfidence) ? page.ocrConfidence : null
    }
  };
}

export function validateUnitSourceCoverage(rows = [], start, end) {
  const errors = [];
  const expectedPages = Number.isInteger(start) && Number.isInteger(end) && end >= start
    ? Array.from({ length: end - start + 1 }, (_, index) => start + index)
    : [];
  if (!expectedPages.length) errors.push('invalid_expected_page_range');

  const actualPages = rows.map((row) => Number(row.pdfPage));
  const counts = new Map();
  for (const page of actualPages) counts.set(page, (counts.get(page) || 0) + 1);

  const missingPages = expectedPages.filter((page) => !counts.has(page));
  const duplicatePages = [...counts.entries()].filter(([, count]) => count > 1).map(([page]) => page);
  const expectedSet = new Set(expectedPages);
  const outOfRangePages = actualPages.filter((page) => !expectedSet.has(page));
  const outOfOrderPages = [];
  for (let index = 1; index < actualPages.length; index += 1) {
    if (actualPages[index] <= actualPages[index - 1]) {
      outOfOrderPages.push(actualPages[index]);
    }
  }

  if (missingPages.length) errors.push('missing_source_pages');
  if (duplicatePages.length) errors.push('duplicate_source_pages');
  if (outOfRangePages.length) errors.push('out_of_range_source_pages');
  if (outOfOrderPages.length) errors.push('source_pages_out_of_order');

  const pageIssues = rows.map((row) => ({
    pdfPage: row.pdfPage,
    ...validatePageText(row)
  })).filter((result) => result.status !== 'valid');

  if (pageIssues.length) errors.push('source_pages_failed_quality_gate');

  return {
    ok: errors.length === 0,
    status: errors.length ? 'blocked_source_review' : 'source_accepted_for_draft',
    start,
    end,
    expectedPages,
    actualPages,
    missingPages,
    duplicatePages,
    outOfRangePages,
    outOfOrderPages,
    pageIssues,
    errors,
    metrics: {
      expectedPageCount: expectedPages.length,
      actualPageCount: actualPages.length,
      validPageCount: Math.max(0, rows.length - pageIssues.length)
    }
  };
}
