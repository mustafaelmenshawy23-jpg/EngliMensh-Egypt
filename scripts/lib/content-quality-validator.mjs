import { REQUIRED_UNIT_SECTIONS } from './source-quality-gate.mjs';

const validOrigins = new Set(['source', 'supplementary']);
const normalize = (value) => String(value ?? '').trim().toLocaleLowerCase();

function addQuestionErrors(content, label, errors) {
  if (!String(content.question || '').trim()) errors.push(label + ': missing question text.');
  const options = Array.isArray(content.options) ? content.options.map((value) => String(value).trim()) : [];
  if (options.length < 3 || options.length > 4) errors.push(label + ': questions must have 3–4 answer options.');
  const unique = new Set(options.map(normalize));
  if (unique.size !== options.length) errors.push(label + ': answer options must be unique.');
  const matches = options.filter((option) => normalize(option) === normalize(content.correctAnswer));
  if (!content.correctAnswer || matches.length !== 1) errors.push(label + ': correctAnswer must match exactly one option.');
  if (!String(content.reason || '').trim()) errors.push(label + ': missing answer explanation/reason.');
}

export function validateUnitDraftQuality(draft, options = {}) {
  const errors = [];
  const warnings = [];
  const rows = Array.isArray(options.rows) ? options.rows : [];
  const start = options.start ?? draft?.sourcePdfRange?.start;
  const end = options.end ?? draft?.sourcePdfRange?.end;
  const expectedPages = rows.length
    ? rows.map((row) => row.pdfPage)
    : Number.isInteger(start) && Number.isInteger(end) && end >= start
      ? Array.from({ length: end - start + 1 }, (_, index) => start + index)
      : [];
  const expectedSet = new Set(expectedPages);
  const sourceTextChars = rows.reduce((sum, row) => sum + String(row.text || '').length, 0);

  if (!draft || typeof draft !== 'object') {
    return { ok: false, status: 'failed_validation', score: 0, errors: ['Draft must be an object.'], warnings, metrics: {} };
  }
  if (draft.datasetStatus !== 'draft') errors.push('Draft datasetStatus must remain draft.');
  if (draft.reviewStatus !== 'needs_review') errors.push('Generated content must remain needs_review until teacher approval.');
  if (!Array.isArray(draft.sections)) errors.push('Missing sections array.');

  if (Number.isInteger(start) && Number.isInteger(end)) {
    if (draft.sourcePdfRange?.start !== start || draft.sourcePdfRange?.end !== end) {
      errors.push('sourcePdfRange does not match the verified unit range.');
    }
  }

  if (!Array.isArray(draft.sourceCoverage)) {
    errors.push('Missing sourceCoverage array.');
  } else if (expectedPages.length) {
    const actual = draft.sourceCoverage;
    const exact = actual.length === expectedPages.length &&
      actual.every((page, index) => page === expectedPages[index]);
    if (!exact) errors.push('sourceCoverage must list every expected PDF page exactly once and in order.');
  }

  const sections = Array.isArray(draft.sections) ? draft.sections : [];
  const byType = new Map();
  for (const section of sections) {
    if (!section || !REQUIRED_UNIT_SECTIONS.includes(section.type)) {
      errors.push('Unexpected or invalid section type: ' + String(section?.type));
      continue;
    }
    if (byType.has(section.type)) errors.push('Duplicate section type: ' + section.type);
    byType.set(section.type, section);
    if (!Array.isArray(section.items)) errors.push(section.type + ': items must be an array.');
  }
  for (const type of REQUIRED_UNIT_SECTIONS) {
    if (!byType.has(type)) errors.push('Missing required section: ' + type);
  }
  if (sections.length !== REQUIRED_UNIT_SECTIONS.length) {
    errors.push('A unit must contain exactly nine independent sections.');
  }

  const sectionCounts = {};
  let totalItems = 0;
  let sourceItems = 0;
  let supplementaryItems = 0;
  const itemIds = new Set();

  for (const section of sections) {
    if (!Array.isArray(section?.items)) continue;
    sectionCounts[section.type] = section.items.length;
    for (const item of section.items) {
      totalItems += 1;
      const label = String(item?.itemId || section.type + ' item');
      if (!item?.itemId || itemIds.has(item.itemId)) errors.push(label + ': missing or duplicate itemId.');
      itemIds.add(item?.itemId);
      const content = item?.content;
      if (!content || typeof content !== 'object') {
        errors.push(label + ': missing content object.');
        continue;
      }

      if (!validOrigins.has(content.origin)) {
        errors.push(label + ': origin must be source or supplementary.');
      } else if (content.origin === 'source') {
        sourceItems += 1;
        if (!Number.isInteger(content.sourcePdfPage) || !expectedSet.has(content.sourcePdfPage)) {
          errors.push(label + ': source content needs a valid sourcePdfPage inside the unit range.');
        }
      } else {
        supplementaryItems += 1;
        if (!Number.isInteger(content.contextPdfPage) || !expectedSet.has(content.contextPdfPage)) {
          errors.push(label + ': supplementary content needs a valid contextPdfPage inside the unit range.');
        }
        if (content.sourcePdfPage !== undefined) {
          errors.push(label + ': supplementary content must not claim a sourcePdfPage.');
        }
      }

      if (section.type === 'vocabulary') {
        const word = String(content.word || '').trim();
        if (!word || [...word].length > 40 || /(.)\1{5,}/u.test(word)) {
          errors.push(label + ': invalid or corrupted vocabulary token.');
        }
        if (!/[\u0600-\u06FF]/u.test(String(content.arabicMeaning || ''))) {
          errors.push(label + ': Arabic meaning must contain Arabic script.');
        }
        if (!String(content.example || '').trim()) errors.push(label + ': vocabulary example is required.');
        if (!validOrigins.has(content.meaningOrigin) || !validOrigins.has(content.exampleOrigin)) {
          errors.push(label + ': meaningOrigin and exampleOrigin must be source or supplementary.');
        }
      }

      if (section.type === 'grammar') {
        if (!String(content.rule || '').trim() || !String(content.explanation || '').trim()) {
          errors.push(label + ': grammar rule and explanation are required.');
        }
        if (!validOrigins.has(content.ruleOrigin) || !validOrigins.has(content.explanationOrigin)) {
          errors.push(label + ': ruleOrigin and explanationOrigin must be source or supplementary.');
        }
      }

      const questionSection = ['vocabulary_questions', 'grammar_questions', 'comprehensive_test'].includes(section.type);
      if (questionSection || content.question || section.type === 'games') {
        addQuestionErrors(content, label, errors);
      }

      if (section.type === 'reading' && String(content.passage || '').trim().length < 40) {
        errors.push(label + ': reading needs a complete passage of at least 40 characters.');
      }

      if (section.type === 'listening' && String(content.script || '').trim().length < 20) {
        errors.push(label + ': listening needs a source or clearly supplementary script.');
      }

      if (section.type === 'speaking') {
        if (!Array.isArray(content.dialogue) || content.dialogue.length < 2) {
          errors.push(label + ': speaking needs at least two dialogue turns.');
        } else {
          for (const turn of content.dialogue) {
            if (!turn?.speaker || !String(turn.text || '').trim() ||
                !['male', 'female', 'unknown'].includes(turn.speakerGender)) {
              errors.push(label + ': every speaking turn needs a speaker, text, and honest gender metadata.');
            }
            if (content.origin === 'supplementary' && !['male', 'female'].includes(turn.speakerGender)) {
              errors.push(label + ': supplementary role-play turns must use male/female speaker roles.');
            }
          }
        }
      }

      if (section.type === 'games') {
        if (content.origin !== 'supplementary' || !content.gameType || !content.targetSkill ||
            !content.difficulty || !content.instruction) {
          errors.push(label + ': each game must be supplementary and include type, skill, difficulty, and instructions.');
        }
      }
    }
  }

  const minimums = {
    vocabulary: 1,
    vocabulary_questions: 3,
    grammar: 1,
    grammar_questions: 3,
    reading: 1,
    listening: 1,
    speaking: 1,
    games: 2,
    comprehensive_test: 5
  };
  for (const [type, minimum] of Object.entries(minimums)) {
    if ((sectionCounts[type] || 0) < minimum) {
      errors.push(type + ': expected at least ' + minimum + ' item(s), found ' + (sectionCounts[type] || 0) + '.');
    }
  }

  if (totalItems < 18) errors.push('Unit draft is too sparse: expected at least 18 items.');
  const minimumSourceItems = sourceTextChars > 1500 ? 3 : 1;
  if (sourceItems < minimumSourceItems) {
    errors.push('Source-derived content is insufficient for the amount of source text supplied.');
  }
  if (options.rows && rows.length !== expectedPages.length) {
    warnings.push('Source page rows were supplied; verify page uniqueness in the source gate.');
  }

  const score = Math.max(0, 100 - errors.length * 6 - warnings.length * 2);
  const status = errors.length ? 'failed_validation' : 'ready_for_teacher_review';
  return {
    ok: errors.length === 0,
    status,
    score,
    errors,
    warnings,
    metrics: {
      totalItems,
      sourceItems,
      supplementaryItems,
      sectionCounts,
      expectedPageCount: expectedPages.length,
      sourceTextChars
    }
  };
}
