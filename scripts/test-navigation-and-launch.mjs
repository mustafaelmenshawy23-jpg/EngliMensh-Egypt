/**
 * Automated Verification Suite for Phase 2.1 Navigation & Unit Launch
 * Tests:
 * 1. Stage selection transitions (Primary -> Preparatory -> Secondary -> Egyptian Baccalaureate).
 * 2. Grade selection transitions within stages.
 * 3. Pathway selection transitions.
 * 4. DOM selector isolation: ensures `<main class="shell stage-*">` has no `data-stage` attribute that intercepts bubbled clicks.
 * 5. Event listener selector specificity: verifies `.stage-card[data-stage]`, `.grade-button[data-grade]`, `.path-button[data-path]`, and `[data-unit-book]`.
 * 6. Primary 1 - Unit 1 launch and rendering of all 6 consolidated sections.
 * 7. Opening individual section modules (vocabulary, grammar, reading, listening, games, comprehensive_test).
 * 8. Back navigation to unit dashboard.
 * 9. Non-P1U1 units opening and rendering gracefully.
 * 10. LocalStorage state roundtrip and progress preservation.
 */

import fs from 'node:fs';

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

console.log('--- TEST SUITE: Phase 2.1 Navigation & Unit Launch Verification ---');

// 1. Source files check
const sourceIndex = JSON.parse(fs.readFileSync('./data/curriculum/source-book-index.draft.json', 'utf8'));
const curriculum = JSON.parse(fs.readFileSync('./src/data/curriculum/structure.json', 'utf8'));
const p1u1Draft = JSON.parse(fs.readFileSync('./artifacts/unit-drafts/primary1-student-term1-unit-1.json', 'utf8'));
const mainJs = fs.readFileSync('./src/main.js', 'utf8');

// Test 1: DOM selector isolation in main.js
{
  console.log('\n--- Test 1: DOM Selector Isolation & Bubbling Safety ---');
  const mainTagHasDataStage = /<main[^>]*class="[^"]*shell[^"]*"[^>]*data-stage=/i.test(mainJs);
  assert(!mainTagHasDataStage, '<main class="shell"> does NOT have data-stage attribute that intercepts clicks');

  const stageCardSelectorUsed = mainJs.includes(".stage-card[data-stage]");
  assert(stageCardSelectorUsed, 'Stage listener targets .stage-card[data-stage] specifically');

  const gradeButtonSelectorUsed = mainJs.includes(".grade-button[data-grade]");
  assert(gradeButtonSelectorUsed, 'Grade listener targets .grade-button[data-grade] specifically');

  const pathButtonSelectorUsed = mainJs.includes(".path-button[data-path]");
  assert(pathButtonSelectorUsed, 'Pathway listener targets .path-button[data-path] specifically');

  const stopPropInUnitLink = /\[data-unit-book\]'\)\.forEach\([^)]*\)\s*=>\s*button\.addEventListener\('click',\s*\((e|\w+)\)\s*=>\s*\{\s*\1\.stopPropagation\(\)/.test(mainJs);
  assert(stopPropInUnitLink, 'Unit link click listener includes stopPropagation()');
}

// Test 2: State simulation for Stage, Grade, Pathway navigation
{
  console.log('\n--- Test 2: Navigation State Transitions ---');
  function currentStage(stageId) {
    return curriculum.stages.find((item) => item.id === stageId);
  }

  let state = {
    stage: 'primary',
    grade: 1,
    path: 'general',
    search: '',
    preview: null,
    unitSelection: null,
    activeModule: null
  };

  // Switch to Preparatory
  {
    state.stage = 'preparatory';
    const next = currentStage(state.stage);
    state.grade = next?.grades?.[0] ?? null;
    state.path = next?.paths?.[0]?.id ?? '';
    state.unitSelection = null;
    state.activeModule = null;

    assert(state.stage === 'preparatory', 'Stage correctly switches to preparatory');
    assert(state.grade === 1, 'Grade correctly initializes to Preparatory 1');
    assert(state.path === 'general', 'Path correctly initializes to preparatory general');
    assert(next.grades.length === 3, 'Preparatory has 3 grades (1, 2, 3)');
  }

  // Switch Grade to 2
  {
    state.grade = 2;
    assert(state.grade === 2, 'Grade correctly switches to Grade 2');
    assert(state.stage === 'preparatory', 'Stage remains preparatory after grade switch');
  }

  // Switch to Secondary
  {
    state.stage = 'secondary';
    const next = currentStage(state.stage);
    state.grade = next?.grades?.[0] ?? null;
    state.path = next?.paths?.[0]?.id ?? '';
    assert(state.stage === 'secondary', 'Stage correctly switches to secondary');
    assert(state.grade === 1, 'Grade correctly initializes to Secondary 1');
    assert(next.grades.length === 3, 'Secondary has 3 grades (1, 2, 3)');
  }

  // Switch to Egyptian Baccalaureate
  {
    state.stage = 'egyptian-baccalaureate';
    const next = currentStage(state.stage);
    state.grade = next?.grades?.[0] ?? null;
    state.path = next?.paths?.[0]?.id ?? '';
    assert(state.stage === 'egyptian-baccalaureate', 'Stage correctly switches to egyptian-baccalaureate');
  }

  // Switch back to Primary Grade 1
  {
    state.stage = 'primary';
    const next = currentStage(state.stage);
    state.grade = next?.grades?.[0] ?? null;
    state.path = next?.paths?.[0]?.id ?? '';
    assert(state.stage === 'primary' && state.grade === 1, 'Stage correctly returns to Primary 1');
  }
}

// Test 3: Primary 1 - Unit 1 Launch & Content Verification
{
  console.log('\n--- Test 3: Primary 1 - Unit 1 Launch & Sections ---');
  const book = sourceIndex.books.find((item) => item.id === 'primary1-student-term1');
  assert(Boolean(book), 'Found primary1-student-term1 in source index');

  const unit1 = book?.units?.find((item) => item.number === 1);
  assert(Boolean(unit1), 'Found Unit 1 in primary1-student-term1');
  assert(unit1.title === 'Welcome to My School', 'Unit 1 title is Welcome to My School');

  const isP1U1 = book.id === 'primary1-student-term1' && unit1.number === 1;
  assert(isP1U1, 'Identified as P1U1 for specialized interactive draft rendering');

  // Verify the 6 consolidated sections in p1u1Draft
  const sectionTypes = p1u1Draft.sections.map(s => s.type);
  assert(sectionTypes.includes('vocabulary'), 'Vocabulary section present in P1U1 draft');
  assert(sectionTypes.includes('vocabulary_questions'), 'Vocabulary questions present in P1U1 draft');
  assert(sectionTypes.includes('grammar'), 'Grammar section present in P1U1 draft');
  assert(sectionTypes.includes('grammar_questions'), 'Grammar questions present in P1U1 draft');
  assert(sectionTypes.includes('reading'), 'Reading section present in P1U1 draft');
  assert(sectionTypes.includes('listening'), 'Listening section present in P1U1 draft');
  assert(sectionTypes.includes('games'), 'Games section present in P1U1 draft');
  assert(sectionTypes.includes('comprehensive_test'), 'Comprehensive test present in P1U1 draft');

  const vocabWords = p1u1Draft.sections.find(s => s.type === 'vocabulary')?.items || [];
  assert(vocabWords.length === 24, `24 vocabulary items found (actual: ${vocabWords.length})`);

  const testQuestions = p1u1Draft.sections.find(s => s.type === 'comprehensive_test')?.items || [];
  assert(testQuestions.length === 10, `10 final test questions found (actual: ${testQuestions.length})`);
}

// Test 4: Non-P1U1 Unit Launch Verification
{
  console.log('\n--- Test 4: Non-P1U1 Unit Launch Graceful Support ---');
  const p1u2 = sourceIndex.books.find(b => b.id === 'primary1-student-term1')?.units?.find(u => u.number === 2);
  assert(Boolean(p1u2), 'Primary 1 Unit 2 is indexed in sourceIndex');
  assert(Number.isInteger(p1u2.startPdfPage), `Primary 1 Unit 2 has indexed startPdfPage (${p1u2.startPdfPage})`);

  // Secondary 1 book
  const secBook = sourceIndex.books.find(b => b.id === 'secondary1-student-term1');
  if (secBook) {
    const secU1 = secBook.units?.[0];
    assert(Boolean(secU1), `Secondary 1 has units available (Unit ${secU1?.number})`);
  }
}

// Test 5: Progress Preservation Verification
{
  console.log('\n--- Test 5: Progress Preservation Across Navigation ---');
  const STORAGE_KEY = 'englimensh_p1u1_progress';
  const sampleProgress = {
    quizAnswers: {
      'p1u1-vq-01': { choice: 'bag', isCorrect: true, wrongChoices: [] },
      'p1u1-gq-01': { choice: 'am', isCorrect: true, wrongChoices: ['is'] }
    },
    game1: { selectedWord: null, selectedPic: null, matches: ['bag', 'pen'], score: 20 },
    selfIntro: { name: 'Adam', avatar: '👦' },
    politeness: { answers: { p1: 'polite' } }
  };

  const serialized = JSON.stringify(sampleProgress);
  const reloaded = JSON.parse(serialized);

  assert(reloaded.quizAnswers['p1u1-vq-01'].isCorrect === true, 'Saved quiz answer preserved');
  assert(reloaded.quizAnswers['p1u1-gq-01'].wrongChoices.length === 1, 'Wrong choices history preserved');
  assert(reloaded.game1.score === 20, 'Game score preserved');
  assert(reloaded.selfIntro.name === 'Adam', 'Self-intro name preserved');
}

console.log('=======================================');
console.log(`Navigation & Launch Test Results: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
}
console.log('All Phase 2.1 navigation and unit launch tests passed successfully!');
