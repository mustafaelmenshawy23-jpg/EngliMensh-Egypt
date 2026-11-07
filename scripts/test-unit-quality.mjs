import assert from 'node:assert/strict';
import { validatePageText, validateUnitSourceCoverage } from './lib/source-quality-gate.mjs';
import { validateUnitDraftQuality } from './lib/content-quality-validator.mjs';
import { sortUnitCandidates } from './lib/curriculum-order.mjs';

let passed = 0;
function check(name, fn) {
  fn();
  passed += 1;
  console.log('PASS ' + name);
}

const page = (pdfPage, text, extra = {}) => ({ pdfPage, text, ...extra });
const rows = [
  page(1, 'This is a clear source page with readable English words and complete sentences for learners.'),
  page(2, 'The second source page contains another readable paragraph with useful information for this unit.')
];

function question(id, pageNumber = 2) {
  return {
    itemId: id,
    content: {
      origin: 'supplementary',
      contextPdfPage: pageNumber,
      question: 'Which option best completes the sentence?',
      options: ['goes', 'go', 'going'],
      correctAnswer: 'goes',
      reason: 'The subject is singular, so the verb takes -s.'
    }
  };
}

function makeDraft() {
  return {
    datasetStatus: 'draft',
    reviewStatus: 'needs_review',
    sourcePdfRange: { start: 1, end: 2 },
    sourceCoverage: [1, 2],
    sections: [
      { type: 'vocabulary', items: [{
        itemId: 'v1',
        content: {
          origin: 'source', sourcePdfPage: 1, word: 'choice', arabicMeaning: 'اختيار',
          example: 'I make a choice.', meaningOrigin: 'supplementary', exampleOrigin: 'supplementary'
        }
      }] },
      { type: 'vocabulary_questions', items: [question('vq1'), question('vq2'), question('vq3')] },
      { type: 'grammar', items: [{
        itemId: 'g1',
        content: {
          origin: 'source', sourcePdfPage: 1, rule: 'Use the present simple for routines.',
          explanation: 'It describes repeated actions.', ruleOrigin: 'source', explanationOrigin: 'supplementary'
        }
      }] },
      { type: 'grammar_questions', items: [question('gq1'), question('gq2'), question('gq3')] },
      { type: 'reading', items: [{
        itemId: 'r1',
        content: {
          origin: 'source', sourcePdfPage: 2,
          passage: 'Students make choices every day. Good choices help them learn, stay safe, and work well with others.'
        }
      }] },
      { type: 'listening', items: [{
        itemId: 'l1',
        content: {
          origin: 'supplementary', contextPdfPage: 2,
          script: 'Mona talks to Omar about the choices they make at school.'
        }
      }] },
      { type: 'speaking', items: [{
        itemId: 's1',
        content: {
          origin: 'supplementary', contextPdfPage: 2,
          dialogue: [
            { speaker: 'Omar', speakerGender: 'male', text: 'What do you choose?' },
            { speaker: 'Mona', speakerGender: 'female', text: 'I choose the healthy option.' }
          ]
        }
      }] },
      { type: 'games', items: [
        { itemId: 'gm1', content: { ...question('gmq1').content, gameType: 'Quick Choice', targetSkill: 'vocabulary', difficulty: 'easy', instruction: 'Choose the correct word.' } },
        { itemId: 'gm2', content: { ...question('gmq2').content, gameType: 'Grammar Sprint', targetSkill: 'grammar', difficulty: 'medium', instruction: 'Choose the correct verb form.' } }
      ] },
      { type: 'comprehensive_test', items: ['ct1', 'ct2', 'ct3', 'ct4', 'ct5'].map((id) => question(id)) }
    ]
  };
}

const sourceOptions = { rows, start: 1, end: 2, grade: 'Primary 2' };

check('clean page text passes', () => assert.equal(validatePageText(rows[0]).status, 'valid'));
check('short page text is flagged', () => assert.ok(validatePageText(page(1, 'Too short')).reasons.includes('text_missing_or_too_short')));
check('long unbroken OCR token is flagged', () => assert.ok(validatePageText(page(1, 'A'.repeat(45) + ' readable words on this page.')).reasons.includes('unbroken_token_over_40_characters')));
check('repeated OCR characters are flagged', () => assert.ok(validatePageText(page(1, 'Clear text aaaaaaa and other readable words.')).reasons.includes('repeated_character_run')));
check('Unicode replacement characters are flagged', () => assert.ok(validatePageText(page(1, 'Clear text with � replacement character and more words.')).reasons.includes('unicode_replacement_character')));
check('control characters are flagged', () => assert.ok(validatePageText(page(1, 'Clear text\u0001 with a control character and more words.')).reasons.includes('control_character')));
check('low OCR confidence is flagged', () => assert.ok(validatePageText(page(1, rows[0].text, { ocrConfidence: 30 })).reasons.includes('low_ocr_confidence')));
check('unreliable OCR status is flagged', () => assert.ok(validatePageText(page(1, rows[0].text, { extractionStatus: 'ocr_unreliable_needs_visual_review' })).reasons.includes('extraction_status_requires_review')));
check('complete unit page coverage passes', () => assert.equal(validateUnitSourceCoverage(rows, 1, 2).ok, true));
check('missing unit page is blocked', () => assert.ok(validateUnitSourceCoverage([rows[0]], 1, 2).missingPages.includes(2)));
check('duplicate unit page is blocked', () => assert.ok(validateUnitSourceCoverage([rows[0], rows[0], rows[1]], 1, 2).duplicatePages.includes(1)));
check('out-of-order unit pages are blocked', () => assert.ok(validateUnitSourceCoverage([rows[1], rows[0]], 1, 2).outOfOrderPages.length > 0));
check('invalid unit page range is blocked', () => assert.equal(validateUnitSourceCoverage(rows, 2, 1).ok, false));

check('complete nine-section unit draft passes', () => {
  const result = validateUnitDraftQuality(makeDraft(), sourceOptions);
  assert.equal(result.ok, true);
  assert.equal(result.score, 100);
  assert.equal(result.status, 'ready_for_teacher_review');
});
check('corrupted vocabulary token is rejected', () => {
  const draft = makeDraft();
  draft.sections[0].items[0].content.word = 'x'.repeat(50);
  assert.equal(validateUnitDraftQuality(draft, sourceOptions).status, 'failed_validation');
});
check('Arabic meaning is required', () => {
  const draft = makeDraft();
  draft.sections[0].items[0].content.arabicMeaning = 'meaning only';
  assert.ok(validateUnitDraftQuality(draft, sourceOptions).errors.some((error) => error.includes('Arabic meaning')));
});
check('incomplete source coverage is rejected', () => {
  const draft = makeDraft();
  draft.sourceCoverage = [1];
  assert.ok(validateUnitDraftQuality(draft, sourceOptions).errors.some((error) => error.includes('sourceCoverage')));
});
check('incorrect answer key is rejected', () => {
  const draft = makeDraft();
  draft.sections[1].items[0].content.correctAnswer = 'not an option';
  assert.ok(validateUnitDraftQuality(draft, sourceOptions).errors.some((error) => error.includes('correctAnswer')));
});
check('duplicate answer options are rejected', () => {
  const draft = makeDraft();
  draft.sections[1].items[0].content.options = ['goes', 'goes', 'going'];
  assert.ok(validateUnitDraftQuality(draft, sourceOptions).errors.some((error) => error.includes('unique')));
});
check('out-of-range source citation is rejected', () => {
  const draft = makeDraft();
  draft.sections[0].items[0].content.sourcePdfPage = 9;
  assert.ok(validateUnitDraftQuality(draft, sourceOptions).errors.some((error) => error.includes('sourcePdfPage')));
});
check('supplementary content cannot claim a source page', () => {
  const draft = makeDraft();
  draft.sections[1].items[0].content.sourcePdfPage = 1;
  assert.ok(validateUnitDraftQuality(draft, sourceOptions).errors.some((error) => error.includes('must not claim')));
});
check('supplementary content needs a context page', () => {
  const draft = makeDraft();
  delete draft.sections[1].items[0].content.contextPdfPage;
  assert.ok(validateUnitDraftQuality(draft, sourceOptions).errors.some((error) => error.includes('contextPdfPage')));
});
check('supplementary dialogue needs male/female role mapping', () => {
  const draft = makeDraft();
  draft.sections[6].items[0].content.dialogue[0].speakerGender = 'unknown';
  assert.ok(validateUnitDraftQuality(draft, sourceOptions).errors.some((error) => error.includes('male/female')));
});
check('missing dialogue turns are rejected', () => {
  const draft = makeDraft();
  draft.sections[6].items[0].content.dialogue = [];
  assert.ok(validateUnitDraftQuality(draft, sourceOptions).errors.some((error) => error.includes('dialogue')));
});
check('games must be supplementary', () => {
  const draft = makeDraft();
  draft.sections[7].items[0].content.origin = 'source';
  assert.ok(validateUnitDraftQuality(draft, sourceOptions).errors.some((error) => error.includes('game must be supplementary')));
});
check('missing games are rejected', () => {
  const draft = makeDraft();
  draft.sections[7].items = [];
  assert.ok(validateUnitDraftQuality(draft, sourceOptions).errors.some((error) => error.includes('games: expected')));
});
check('comprehensive test needs at least five questions', () => {
  const draft = makeDraft();
  draft.sections[8].items.pop();
  assert.ok(validateUnitDraftQuality(draft, sourceOptions).errors.some((error) => error.includes('comprehensive_test: expected')));
});
check('reading passage is required', () => {
  const draft = makeDraft();
  draft.sections[4].items[0].content.passage = '';
  assert.ok(validateUnitDraftQuality(draft, sourceOptions).errors.some((error) => error.includes('reading needs')));
});
check('listening script is required', () => {
  const draft = makeDraft();
  draft.sections[5].items[0].content.script = '';
  assert.ok(validateUnitDraftQuality(draft, sourceOptions).errors.some((error) => error.includes('listening needs')));
});
check('unapproved drafts cannot be marked approved', () => {
  const draft = makeDraft();
  draft.reviewStatus = 'approved';
  assert.ok(validateUnitDraftQuality(draft, sourceOptions).errors.some((error) => error.includes('remain needs_review')));
});
check('duplicate item identifiers are rejected', () => {
  const draft = makeDraft();
  draft.sections[1].items[0].itemId = 'v1';
  assert.ok(validateUnitDraftQuality(draft, sourceOptions).errors.some((error) => error.includes('duplicate itemId')));
});


const mixedCandidates = [
  { unitId: 'secondary1-u1', bookId: 'secondary1', grade: 'Secondary 1', documentType: 'student_book', unitNumber: 1 },
  { unitId: 'prep1-supp-u1', bookId: 'helloplus-prep1', grade: 'Preparatory 1', documentType: 'commercial_supplement', unitNumber: 1 },
  { unitId: 'primary2-u1', bookId: 'primary2', grade: 'Primary 2', documentType: 'student_book', unitNumber: 1 },
  { unitId: 'primary1-supp-u1', bookId: 'connectplus-primary1', grade: 'Primary 1', documentType: 'commercial_supplement', unitNumber: 1 },
  { unitId: 'primary1-u1', bookId: 'primary1', grade: 'Primary 1', documentType: 'student_book', unitNumber: 1 },
  { unitId: 'prep1-u1', bookId: 'prep1', grade: 'Preparatory 1', documentType: 'student_book', unitNumber: 1 },
  { unitId: 'baccalaureate-u1', bookId: 'baccalaureate', grade: 'Baccalaureate Year 2', documentType: 'student_book', unitNumber: 1 }
];
check('curriculum queue orders Primary before Preparatory, Secondary, and Baccalaureate', () => {
  const ordered = sortUnitCandidates(mixedCandidates);
  assert.deepEqual(ordered.map(item => item.unitId), [
    'primary1-u1','primary1-supp-u1','primary2-u1','prep1-u1','prep1-supp-u1','secondary1-u1','baccalaureate-u1'
  ]);
});
check('official student book precedes its commercial supplement within a grade', () => {
  const ordered = sortUnitCandidates(mixedCandidates);
  assert.ok(ordered.findIndex(item => item.unitId === 'primary1-u1') < ordered.findIndex(item => item.unitId === 'primary1-supp-u1'));
});
check('curriculum sorting does not mutate the source candidate array', () => {
  const original = mixedCandidates.map(item => item.unitId);
  sortUnitCandidates(mixedCandidates);
  assert.deepEqual(mixedCandidates.map(item => item.unitId), original);
});

console.log('Unit quality tests: ' + passed + ' passed, 0 failed.');
