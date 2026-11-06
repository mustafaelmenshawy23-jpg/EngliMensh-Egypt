import curriculum from './data/curriculum/structure.json';
import sourceIndex from '../data/curriculum/source-book-index.draft.json';
import reviewCandidates from './data/extracted/manual-recovery-candidates.json';
import lessonDrafts from './data/lessons/lessons.draft.json';
import unitModules from './data/lessons/unit-modules.draft.json';
import './style.css';

const app = document.querySelector('#app');
const state = { stage: 'primary', grade: 1, path: 'general', search: '', preview: null, unitSelection: null, activeModule: null, quizAnswers: {} };

const stageNames = {
  primary: 'Primary',
  preparatory: 'Preparatory',
  secondary: 'Secondary',
  'egyptian-baccalaureate': 'Egyptian Baccalaureate'
};

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

function currentStage() {
  return curriculum.stages.find((item) => item.id === state.stage);
}

function selectedBooks() {
  const gradeName = state.stage === 'primary' ? `Primary ${state.grade}`
    : state.stage === 'preparatory' ? `Preparatory ${state.grade}`
      : state.stage === 'secondary' ? `Secondary ${state.grade}`
        : `Baccalaureate Year ${state.grade || 2}`;
  const pathwayId = state.stage === 'egyptian-baccalaureate'
    ? (state.path === 'second-language' ? 'egypt-baccalaureate-second-language' : 'egypt-baccalaureate')
    : currentStage().paths.find((item) => item.id === state.path)?.sourcePathwayId;
  return sourceIndex.books.filter((book) => book.pathwayId === pathwayId && (
    state.stage === 'egyptian-baccalaureate' || book.grade === gradeName
  ));
}

function bookUrl(file, page) {
  const base = import.meta.env.VITE_BOOKS_BASE_URL || `${import.meta.env.BASE_URL}books/`;
  const path = `${base}${encodeURIComponent(file)}`;
  return page ? `${path}#page=${page}` : path;
}


function renderCandidateContent(record) {
  const blocks = [];
  const paragraph = (label, value) => value ? `<p><strong>${label}:</strong> ${escapeHtml(value)}</p>` : '';
  const list = (label, values, formatter = (value) => escapeHtml(typeof value === 'string' ? value : JSON.stringify(value))) => {
    if (!Array.isArray(values) || !values.length) return '';
    return `<div class="candidate-content-group"><strong>${label}</strong><ul>${values.map((value) => `<li>${formatter(value)}</li>`).join('')}</ul></div>`;
  };
  blocks.push(paragraph('Instruction', record.instruction || record.pairInstruction));
  blocks.push(list('Vocabulary / labels', record.vocabulary || record.labels));
  blocks.push(list('Extracted words', record.items, (item) => {
    if (typeof item === 'string') return escapeHtml(item);
    return [item.text, item.printedString, item.visualCue].filter(Boolean).map(escapeHtml).join(' — ');
  }));
  blocks.push(list('Phonics patterns', record.patterns, (pattern) => {
    const examples = Array.isArray(pattern.examples) ? pattern.examples.join(', ') : '';
    return [pattern.grapheme, pattern.printedSound || pattern.sound, examples].filter(Boolean).map(escapeHtml).join(' — ');
  }));
  blocks.push(list('Dialogue', record.dialogue, (line) => `${escapeHtml(line.speaker || '')}: ${escapeHtml(line.text || '')}`));
  blocks.push(list('Picture prompts', record.picturePrompts));
  blocks.push(list('Printed reference labels', record.printedReferenceLabels, (item) => `${escapeHtml(item.number)}. ${escapeHtml(item.text)}`));
  blocks.push(paragraph('Follow-up question', record.followUpQuestion));
  if (record.sectionA) {
    blocks.push(`<div class="candidate-content-group"><strong>Section A</strong>${paragraph('Instruction', record.sectionA.instruction)}${list('Printed items', record.sectionA.items, (item) => escapeHtml(item.printedString || item))}</div>`);
  }
  if (record.sectionB) {
    blocks.push(`<div class="candidate-content-group"><strong>Section B</strong>${paragraph('Instruction', record.sectionB.instruction)}${list('Printed items', record.sectionB.items)}</div>`);
  }
  const content = blocks.filter(Boolean).join('');
  return content ? `<details class="candidate-content"><summary>Review extracted content</summary>${content}<p class="unit-source-note">Transcription only · verify wording and layout against the original PDF before approval.</p></details>` : '';
}

function renderReviewCandidates(book, unitNumber = null) {
  const candidates = reviewCandidates.records.filter((record) => record.sourceFilename === book.sourceFile && (unitNumber === null ? !Number.isInteger(record.unitLink?.unitNumber) : record.unitLink?.unitNumber === unitNumber));
  if (!candidates.length) return '';
  return `<section class="review-candidates"><div class="review-candidates-heading"><div><p class="eyebrow">SOURCE TRANSCRIPTION CANDIDATES</p><strong>Extracted material · academic review pending</strong></div><span>${candidates.length} candidate${candidates.length === 1 ? '' : 's'}</span></div>
    ${candidates.map((record) => `<article class="candidate-row"><div><strong>${escapeHtml(record.heading || record.header || record.instruction || record.contentType)}</strong><span>${escapeHtml(record.contentType.replaceAll('_',' '))} · PDF page ${record.pdfPage}</span></div><button type="button" class="candidate-source" data-candidate-file="${escapeHtml(record.sourceFilename)}" data-candidate-page="${record.pdfPage}">View source page ↗</button><small>${record.unitLink?.status === 'proposed_needs_review' ? 'Proposed unit link · review pending' : record.unitLink?.status === 'cross_unit_reference' ? 'Shared cross-unit reference · review pending' : 'Not assigned to a unit · review pending'} · Not used in tests or answer keys</small>${record.unitLink?.evidence ? `<small>${escapeHtml(record.unitLink.evidence)}</small>` : ''}${renderCandidateContent(record)}</article>`).join('')}
  </section>`;
}

function renderBookLibrary(books) {
  if (!books.length) {
    return '<div class="empty-state"><div class="book-icon">▤</div><strong>No indexed source book for this selection yet</strong><span>Existing source files remain preserved in the library</span></div>';
  }
  return books.map((book) => {
    const units = (book.units || []).map((unit) => {
      const pageLabel = Number.isInteger(unit.startPdfPage) ? `PDF page ${unit.startPdfPage}` : 'Page reference not indexed';
      const title = `Unit ${unit.number}: ${unit.title}`;
      const hasLessonDraft = lessonDrafts.records.some((lesson) => lesson.bookId === book.id && lesson.unitNumber === unit.number);
      return Number.isInteger(unit.startPdfPage) || hasLessonDraft
        ? `<button class="unit-link" type="button" data-unit-book="${escapeHtml(book.id)}" data-unit-number="${unit.number}"><strong>${escapeHtml(title)}</strong><span>${pageLabel} · Open unit</span></button>`
        : `<div class="unit-link unavailable"><strong>${escapeHtml(title)}</strong><span>${pageLabel}</span></div>`;
    }).join('');
    const typeLabel = book.documentType === 'student_book' ? 'Student book'
      : book.documentType === 'assessment' ? 'Assessment book'
        : book.documentType === 'reader' ? 'Reader' : 'Supplementary reference';
    return `<article class="book-card"><div class="book-card-head"><div><span class="book-type">${typeLabel}</span><h3>${escapeHtml(book.grade)} · ${book.term ? `Term ${book.term}` : 'Course book'}</h3><p>${escapeHtml(book.sourceFile)}</p></div><button class="source-open" type="button" data-preview-file="${escapeHtml(book.sourceFile)}" data-preview-page="1">Preview full PDF ↗</button></div>${units ? `<div class="unit-list">${units}</div>` : '<p class="no-units">No unit list is indexed for this document yet. The original PDF is available in the preview above.</p>'}${renderReviewCandidates(book)}</article>`;
  }).join('');
}


function renderUnitWorkspace() {
  if (!state.unitSelection) return '';
  const book = sourceIndex.books.find((item) => item.id === state.unitSelection.bookId);
  const unit = book?.units?.find((item) => item.number === state.unitSelection.unitNumber);
  if (!book || !unit) return '';
  const tags = (items) => items?.length ? `<div class="unit-tags">${items.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}</div>` : '';
  const detail = (label, value) => value ? `<div class="unit-detail"><span>${label}</span><strong>${escapeHtml(value)}</strong></div>` : '';
  const lessonRecords = lessonDrafts.records.filter((lesson) => lesson.bookId === book.id && lesson.unitNumber === unit.number);
  const scaffold = unitModules.records.find((record) => record.bookId === book.id && record.unitNumber === unit.number);
  const moduleDefinitions = [
    { type: 'vocabulary', title: 'Vocabulary', subtitle: 'Words, meanings, pronunciation, and examples' },
    { type: 'vocabulary_questions', title: 'Vocabulary Questions', subtitle: 'A separate practice bank for unit words' },
    { type: 'grammar', title: 'Grammar', subtitle: 'Clear rule explanations and examples' },
    { type: 'grammar_questions', title: 'Grammar Questions', subtitle: 'A separate grammar practice bank' },
    { type: 'reading', title: 'Reading & Questions', subtitle: 'Reading texts, comprehension activities, and their questions in one section' },
    { type: 'listening', title: 'Listening & Questions', subtitle: 'Audio activities, listening tasks, and their questions in one section' },
    { type: 'games', title: 'Games', subtitle: 'Vocabulary and grammar games only; no reading or listening questions' },
    { type: 'comprehensive_test', title: 'Comprehensive Unit Test', subtitle: 'Full-unit assessment; blueprint and item mix must follow the applicable Egyptian MOE specifications' },

  ];
  const renderValue = (value) => {
    if (value === null || value === undefined || value === '') return '';
    if (Array.isArray(value)) return value.map((entry) => renderValue(entry)).filter(Boolean).join('; ');
    if (typeof value === 'object') return Object.entries(value).map(([key, entry]) => {
      const rendered = renderValue(entry);
      return rendered ? `<span><strong>${escapeHtml(key.replaceAll(/([A-Z])/g, ' $1'))}:</strong> ${rendered}</span>` : '';
    }).filter(Boolean).join(' ');
    return escapeHtml(value);
  };
  const modules = moduleDefinitions.map((definition) => {
    const baseSection = scaffold?.sections?.find((section) => section.type === definition.type);
    const sourcedSections = lessonRecords.flatMap((lesson) => (lesson.sections || [])
      .filter((section) => section.type === definition.type)
      .map((section) => ({ lesson, section })));
    const items = sourcedSections.flatMap(({ lesson, section }) => section.items.map((item) => ({ lesson, item })));
    // The source index may contain unit-level vocabulary or a grammar focus even
    // when no lesson transcription exists yet. Surface it honestly as index metadata.
    const indexedItems = definition.type === 'vocabulary'
      ? (unit.vocabulary || []).map((word, index) => ({ heading: word, provenance: 'Curriculum index · needs source-page verification', id: `index-vocab-${index}` }))
      : definition.type === 'grammar' && unit.languageFocus
        ? [{ heading: unit.languageFocus, provenance: 'Curriculum index · needs source-page verification', id: 'index-grammar-focus' }]
        : [];
    const content = items.length ? '<ul>' + items.map(({ lesson, item }) => {
      const data = item.content || {};
      const heading = data.word || data.title || data.instruction || item.itemId;
      const detailHtml = Object.entries(data).filter(([key, value]) => !['word', 'title'].includes(key) && value !== null && value !== undefined && value !== '')
        .map(([key, value]) => `<span><strong>${escapeHtml(key.replaceAll(/([A-Z])/g, ' $1'))}:</strong> ${renderValue(value)}</span>`).join('');
      const provenanceHtml = item.notes ? `<small class="source-provenance">${escapeHtml(item.notes)}</small>` : '';
      return `<li><strong>${escapeHtml(heading)}</strong>${detailHtml}${provenanceHtml}<small>PDF page ${item.sourcePdfPage || lesson.pdfPage} · ${escapeHtml(item.reviewStatus || lesson.reviewStatus || 'needs_review')}</small></li>`;
    }).join('') + '</ul>' : indexedItems.length
      ? '<ul>' + indexedItems.map((item) => `<li><strong>${escapeHtml(item.heading)}</strong><small>${escapeHtml(item.provenance)}</small></li>`).join('') + '</ul>'
      : '<p class="unit-module-empty">Content not added yet. This section is in progress; no questions or activities are being invented.</p>';
    const hasItems = items.length > 0 || indexedItems.length > 0;
    const sectionStatus = items.length ? 'Review pending' : indexedItems.length ? 'Index metadata' : (baseSection?.status === 'not_populated' ? 'In progress' : 'No source data');
    return `<button type="button" class="unit-module-launch" data-open-module="${definition.type}"><span class="unit-module-icon" aria-hidden="true">${({vocabulary:'Aa',vocabulary_questions:'✓',grammar:'文',grammar_questions:'?',reading:'▤',listening:'♫',games:'★',comprehensive_test:'◎'})[definition.type]}</span><span class="unit-module-launch-copy"><strong>${definition.title}</strong><small>${definition.subtitle}</small></span><span class="unit-module-count">${items.length || indexedItems.length ? (items.length || indexedItems.length) + ' items' : 'Open section'}</span><span class="unit-module-arrow" aria-hidden="true">›</span></button>`;
  }).join('');
  if (state.activeModule) {
    const definition = moduleDefinitions.find((entry) => entry.type === state.activeModule);
    const selectedSections = lessonRecords.flatMap((lesson) => (lesson.sections || [])
      .filter((section) => section.type === state.activeModule)
      .flatMap((section) => section.items.map((item) => ({ lesson, item, section }))));
    const indexedWords = state.activeModule === 'vocabulary' ? (unit.vocabulary || []).map((word) => ({ lesson: null, item: { content: { word } }, section: null })) : [];
    const words = [...selectedSections, ...indexedWords];
    const meanings = {
      read:'يقرأ',write:'يكتب',clean:'ينظّف',draw:'يرسم',sit:'يجلس',stand:'يقف',play:'يلعب',color:'يلوّن',
      shy:'خجول',tired:'متعب',bored:'يشعر بالملل',scared:'خائف',goal:'هدف',try:'يحاول',step:'خطوة',plan:'خطة',
      happy:'سعيد',sad:'حزين',angry:'غاضب',excited:'متحمس',share:'يشارك',care:'يهتم',family:'عائلة',
      'tidy up the bed':'يرتّب السرير',grandpa:'جد',grandma:'جدة',dad:'أب',mom:'أم',brother:'أخ',sister:'أخت',
      baby:'طفل رضيع',tall:'طويل',drip:'قطرة / يقطر',overflow:'يفيض',puddle:'بركة ماء',leak:'تسرّب',
      hallway:'ممر',hose:'خرطوم',tap:'صنبور',pipe:'أنبوب',drop:'قطرة'
    };
    const examples = {
      read:'I read a story every night.',write:'I write my name in my notebook.',clean:'I clean my room every day.',
      draw:'I draw a picture of my family.',sit:'Please sit on your chair.',stand:'Stand up, please.',
      play:'I play with my friends after school.',color:'I color the picture with blue.',shy:'The shy girl speaks quietly.',
      tired:'I feel tired after running.',bored:'I feel bored when I have nothing to do.',
      scared:'The little boy is scared of the dark.',goal:'My goal is to learn English.',
      try:'I try again when something is difficult.',step:'The first step is to read the question.',
      plan:'I have a plan for the weekend.',happy:'I feel happy with my friends.',
      sad:'She feels sad when she loses her toy.',angry:'He feels angry but speaks politely.',
      excited:'We are excited about the school trip.',share:'I share my books with my friends.',
      care:'We care for our family.',family:'My family is very kind.'
    };
    const renderQuestion = ({lesson,item}, index) => {
      const data = item.content || {};
      const questionId = item.itemId || `${state.activeModule}-${index}`;
      const chosen = state.quizAnswers[questionId];
      const options = Array.isArray(data.options) ? data.options : [];
      const hasKey = typeof data.correctAnswer === 'string' && data.correctAnswer.length > 0;
      return `<article class="interactive-question"><p class="question-instruction">${escapeHtml(data.instruction || 'Choose the correct answer.')}</p><h4>${escapeHtml(data.question || data.prompt || data.sentence || data.title)}</h4><div class="quiz-options">${options.map((option) => { const optionClass = chosen ? (hasKey && option === data.correctAnswer ? 'is-correct' : hasKey && option === chosen ? 'is-wrong' : !hasKey && option === chosen ? 'is-selected' : '') : ''; return `<button type="button" class="quiz-option ${optionClass}" data-quiz-question="${escapeHtml(questionId)}" data-quiz-choice="${escapeHtml(option)}" ${chosen ? 'disabled' : ''}>${escapeHtml(option)}</button>`; }).join('')}</div>${chosen ? `<p class="quiz-feedback ${hasKey ? (chosen === data.correctAnswer ? 'correct' : 'incorrect') : 'pending'}">${hasKey ? (chosen === data.correctAnswer ? 'Correct! Well done.' : `Not quite. Correct answer: ${escapeHtml(data.correctAnswer)}`) : 'Your answer has been recorded. Automatic marking is pending an approved answer key.'} ${data.explanation ? escapeHtml(data.explanation) : ''}</p>` : ''}<small class="quiz-origin">${escapeHtml(item.notes || (item.reviewStatus === 'needs_review' ? 'Practice draft · teacher review pending' : 'Practice question'))}</small></article>`;
    };
    let body = '';
    if (state.activeModule === 'vocabulary') {
      body = words.length ? `<div class="vocabulary-list">${words.map(({item}, index) => {
        const data = item.content || {};
        const word = data.word || data.title || item.itemId || 'Word';
        const meaning = data.arabicMeaning || data.arabicGloss || meanings[String(word).toLowerCase()] || 'المعنى قيد المراجعة';
        const example = data.example || examples[String(word).toLowerCase()] || 'Example sentence is being prepared.';
        return `<article class="vocabulary-entry"><div class="vocabulary-entry-top"><span class="vocabulary-number">${index+1}</span><strong class="vocabulary-word" dir="ltr">${escapeHtml(word)}</strong><span class="vocabulary-meaning" dir="rtl">${escapeHtml(meaning)}</span></div><p class="vocabulary-example" dir="ltr">${escapeHtml(example)}</p>${data.notes ? `<small>${escapeHtml(data.notes)}</small>` : ''}</article>`;
      }).join('')}</div>` : '<p class="unit-module-empty">Vocabulary has not been added to this unit yet.</p>';
    } else if (state.activeModule === 'vocabulary_questions' || state.activeModule === 'grammar_questions' || state.activeModule === 'comprehensive_test') {
      const playable = selectedSections.filter(({item}) => { const data = item.content || {}; const prompt = data.question || data.prompt || data.sentence || data.title; return typeof prompt === 'string' && prompt.trim().length > 0 && Array.isArray(data.options) && data.options.length >= 2; });
      const count = playable.filter(({item}, index) => state.quizAnswers[item.itemId || `${state.activeModule}-${index}`]).length;
      body = playable.length ? `<div class="quiz-summary"><strong>${count} / ${playable.length}</strong><span>answered</span></div>${playable.map(renderQuestion).join('')}` : '<p class="unit-module-empty">No playable questions are available in this section yet. Questions will appear here once their content and answer keys are prepared and reviewed.</p>';
    } else if (state.activeModule === 'games') {
      body = '<p class="unit-module-empty">Interactive vocabulary and grammar games will be added here after the unit question bank is ready. No empty game buttons are shown.</p>';
    } else {
      body = selectedSections.length ? selectedSections.map(({item}) => {
        const data = item.content || {};
        return `<article class="learning-content-entry">${Object.entries(data).map(([key,value]) => `<p><strong>${escapeHtml(key.replaceAll(/([A-Z])/g,' $1'))}:</strong> ${escapeHtml(Array.isArray(value) ? value.map((v)=>typeof v==='object'?JSON.stringify(v):v).join(' · ') : typeof value==='object'?JSON.stringify(value):value)}</p>`).join('')}</article>`;
      }).join('') : '<p class="unit-module-empty">Content is still being prepared. This section will open here when source material is ready.</p>';
    }
    return `<section class="unit-module-screen"><button type="button" class="module-back" data-back-modules>‹ Back to Unit ${unit.number}</button><div class="module-screen-heading"><p class="eyebrow">${escapeHtml(book.grade)} · UNIT ${unit.number}</p><h3>${escapeHtml(definition.title)}</h3><p>${escapeHtml(definition.subtitle)}</p></div>${state.activeModule.includes('questions') || state.activeModule === 'comprehensive_test' ? '<p class="practice-note">Supplementary practice is identified separately from official printed questions. Draft content may require teacher review.</p>' : ''}${body}</section>`;
  }
  const lessonHeadings = lessonRecords.map((lesson) => `<p class="lesson-draft-note"><strong>${escapeHtml(lesson.title)}</strong> · ${escapeHtml(lesson.grade)} · PDF page ${lesson.pdfPage} · ${escapeHtml(lesson.reviewStatus)}</p>`).join('');
  return `<section class="unit-workspace" aria-label="Unit details">
    <div class="unit-workspace-head"><div><p class="eyebrow">UNIT WORKSPACE · SOURCE-LINKED</p><h3>Unit ${unit.number}: ${escapeHtml(unit.title)}</h3><p>${escapeHtml(book.grade)} · ${book.term ? `Term ${book.term}` : 'Course book'} · ${Number.isInteger(unit.startPdfPage) ? `PDF page ${unit.startPdfPage}` : 'Unit opening page not yet indexed'}</p></div><button type="button" class="preview-close" data-close-unit>Close unit ✕</button></div>
    ${detail('Language focus', unit.languageFocus)}${detail('Integrated activity', unit.integratedActivity)}${detail('Concept', unit.concept)}
    ${unit.topics?.length ? `<div class="unit-metadata"><span>Topics recorded in the index</span>${tags(unit.topics)}</div>` : ''}
    ${unit.vocabulary?.length ? `<div class="unit-metadata"><span>Vocabulary recorded in the index</span>${tags(unit.vocabulary)}</div>` : ''}
    ${lessonHeadings}
    <div class="unit-module-grid" aria-label="Unit learning sections">${modules}</div>
    <p class="lesson-draft-note">Scaffold source: ${scaffold ? escapeHtml(scaffold.unitId) : 'No unit scaffold record found'}. Extracted items remain drafts until checked against the original PDF. Unreviewed content is excluded from student question banks and answer keys.</p>
    <div class="unit-source-actions">${Number.isInteger(unit.startPdfPage) ? `<button type="button" class="source-open" data-unit-preview="${escapeHtml(book.sourceFile)}" data-unit-page="${unit.startPdfPage}">Preview this unit in original book ↗</button><a class="source-open" href="${bookUrl(book.sourceFile, unit.startPdfPage)}" target="_blank" rel="noopener">Open PDF page ↗</a>` : '<span class="unit-source-note">Unit opening page not indexed; use the source-page links on pending candidates below.</span>'}</div>
    ${renderReviewCandidates(book, unit.number)}
    <p class="unit-source-note">Proposed unit links and transcriptions remain unapproved. They are shown for source review only and are not used in lessons, tests, or answer keys.</p>
  </section>`;
}

function renderPreview() {
  if (!state.preview) return '';
  const { file, page } = state.preview;
  return `<section class="pdf-preview" aria-label="PDF preview"><div class="preview-heading"><div><p class="eyebrow">ORIGINAL SOURCE · READ ONLY</p><strong>${escapeHtml(file)}</strong><span>PDF page ${page}</span></div><button type="button" class="preview-close" data-close-preview>Close preview ✕</button></div><iframe title="Original source book preview" src="${bookUrl(file, page)}" loading="lazy"></iframe><p class="preview-note">The original PDF is displayed without modification. If your browser cannot display PDFs, use the full-file link below.</p><a class="source-open preview-fallback" href="${bookUrl(file, page)}" target="_blank" rel="noopener">Open PDF in a new tab ↗</a></section>`;
}

function render() {
  const stage = currentStage();
  if (!stage) {
    app.innerHTML = '<main class="fatal-state"><h1>Curriculum selection unavailable</h1><p>The selected curriculum stage could not be loaded. Please refresh the page.</p></main>';
    return;
  }
  const paths = stage.paths || [];
  const selectedPath = state.stage === 'egyptian-baccalaureate'
    ? (sourceIndex.pathways.find((item) => item.id === (state.path === 'second-language' ? 'egypt-baccalaureate-second-language' : 'egypt-baccalaureate')) || paths[0])
    : (paths.find((item) => item.id === state.path) || paths[0]);
  if (!selectedPath) {
    app.innerHTML = '<main class="fatal-state"><h1>Pathway unavailable</h1><p>No pathway configuration is available for this selection yet.</p></main>';
    return;
  }
  if (state.stage !== 'egyptian-baccalaureate') state.path = selectedPath.id;
  const grades = stage.grades;
  const books = selectedBooks();
  const visiblePathways = state.stage === 'egyptian-baccalaureate'
    ? sourceIndex.pathways.filter((item) => item.id.startsWith('egypt-baccalaureate'))
    : paths;

  app.innerHTML = `
    <header class="topbar">
      <a class="brand" href="#" aria-label="EngliMensh home"><span class="brand-mark">E</span><span>EngliMensh</span></a>
      <span class="country-tag">EGYPTIAN CURRICULUM</span>
    </header>
    <main class="shell">
      <section class="welcome">
        <p class="eyebrow">YOUR ENGLISH LEARNING SPACE</p>
        <h1>Learn. Practice. Achieve.</h1>
        <p class="intro">Choose your educational stage and curriculum pathway to get started.</p>
      </section>
      <section class="panel">
        <div class="section-heading"><div><p class="eyebrow">STEP 01</p><h2>Choose your stage</h2></div></div>
        <div class="stage-grid">
          ${curriculum.stages.map((item) => `<button class="stage-card ${item.id === state.stage ? 'active' : ''}" data-stage="${item.id}"><span class="stage-icon">${item.id === 'primary' ? '01' : item.id === 'preparatory' ? '02' : item.id === 'secondary' ? '03' : '04'}</span><span>${stageNames[item.id]}</span><span class="chevron">›</span></button>`).join('')}
        </div>
        <div class="selection-row">
          <div><p class="eyebrow">STEP 02</p><h2>Choose your grade</h2></div>
          <div class="grade-grid">
            ${grades.length ? grades.map((grade) => `<button class="grade-button ${grade === state.grade ? 'active' : ''}" data-grade="${grade}">Grade ${grade}</button>`).join('') : '<span class="reserved-note">Choose a baccalaureate pathway below</span>'}
          </div>
        </div>
        <div class="selection-row path-row">
          <div><p class="eyebrow">STEP 03</p><h2>Choose your pathway</h2></div>
          <div class="path-grid">
            ${visiblePathways.map((path) => {
              const active = state.stage === 'egyptian-baccalaureate'
                ? (path.id === 'egypt-baccalaureate' ? state.path !== 'second-language' : state.path === 'second-language')
                : path.id === state.path;
              const id = state.stage === 'egyptian-baccalaureate'
                ? (path.id === 'egypt-baccalaureate' ? 'first-language' : 'second-language') : path.id;
              return `<button class="path-button ${active ? 'active' : ''}" data-path="${id}"><strong>${escapeHtml(path.label || path.name)}</strong><span>${escapeHtml(path.officialSeries || path.series || 'Reserved pathway')}</span></button>`;
            }).join('')}
          </div>
        </div>
      </section>
      <section class="library-section">
        <div class="library-heading"><div><p class="eyebrow">YOUR LEARNING CONTENT</p><h2>${escapeHtml(selectedPath.series || selectedPath.officialSeries || selectedPath.name || selectedPath.label || 'Curriculum pathway')}</h2><p class="library-intro">Source books are preserved unchanged. Search the selected grade or preview a book and jump to indexed unit pages.</p></div><span class="book-count">${books.length} source file${books.length === 1 ? '' : 's'}</span></div>
        <label class="library-search-label" for="library-search">Search books and units</label>
        <input id="library-search" class="library-search" type="search" placeholder="Type a book title, unit, or topic…" value="${escapeHtml(state.search)}" autocomplete="off">
        ${renderUnitWorkspace()}
        ${renderPreview()}
        <div class="book-library">${selectedPath.status === 'reserved_empty' ? '<div class="empty-state"><div class="book-icon">▤</div><strong>This pathway is reserved</strong><span>No source book is indexed for it yet</span></div>' : renderBookLibrary(books)}</div>
        <p class="search-empty" hidden>No books or units match your search in this selection.</p>
      </section>
      <footer>EngliMensh <span>•</span> Egyptian Curriculum <span>•</span> Source-based learning</footer>
    </main>`;

  const applySearch = () => {
    const query = state.search.trim().toLocaleLowerCase();
    let shown = 0;
    app.querySelectorAll('.book-card').forEach((card) => {
      const match = !query || card.textContent.toLocaleLowerCase().includes(query);
      card.hidden = !match;
      if (match) shown += 1;
    });
    const empty = app.querySelector('.search-empty');
    if (empty) empty.hidden = !query || shown > 0;
  };

  app.querySelector('#library-search')?.addEventListener('input', (event) => {
    state.search = event.target.value;
    applySearch();
  });
  applySearch();

  app.querySelectorAll('[data-unit-book]').forEach((button) => button.addEventListener('click', () => { state.unitSelection = { bookId: button.dataset.unitBook, unitNumber: Number(button.dataset.unitNumber) }; state.activeModule = null; state.quizAnswers = {}; state.preview = null; render(); app.querySelector('.unit-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
  app.querySelector('[data-close-unit]')?.addEventListener('click', () => { state.unitSelection = null; state.activeModule = null; state.quizAnswers = {}; render(); });
  app.querySelectorAll('[data-open-module]').forEach((button) => button.addEventListener('click', () => { state.activeModule = button.dataset.openModule; state.quizAnswers = {}; render(); app.querySelector('.unit-module-screen')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
  app.querySelector('[data-back-modules]')?.addEventListener('click', () => { state.activeModule = null; render(); app.querySelector('.unit-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  app.querySelectorAll('[data-quiz-question]').forEach((button) => button.addEventListener('click', () => { state.quizAnswers[button.dataset.quizQuestion] = button.dataset.quizChoice; render(); }));
  app.querySelectorAll('[data-candidate-file]').forEach((button) => button.addEventListener('click', () => { state.preview = { file: button.dataset.candidateFile, page: Number(button.dataset.candidatePage) || 1 }; render(); app.querySelector('.pdf-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
  app.querySelectorAll('[data-unit-preview]').forEach((button) => button.addEventListener('click', () => { state.preview = { file: button.dataset.unitPreview, page: Number(button.dataset.unitPage) || 1 }; render(); app.querySelector('.pdf-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
  app.querySelectorAll('[data-preview-file]').forEach((button) => button.addEventListener('click', () => {
    state.preview = { file: button.dataset.previewFile, page: Number(button.dataset.previewPage) || 1 };
    render();
    app.querySelector('.pdf-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
  app.querySelector('[data-close-preview]')?.addEventListener('click', () => {
    state.preview = null;
    state.unitSelection = null;
    state.activeModule = null;
    render();
  });
  app.querySelectorAll('[data-stage]').forEach((button) => button.addEventListener('click', () => {
    state.stage = button.dataset.stage;
    const next = currentStage();
    state.grade = next?.grades?.[0] ?? null;
    state.path = next?.paths?.[0]?.id ?? '';
    state.search = '';
    state.search = '';
    state.preview = null;
    state.unitSelection = null;
    render();
  }));
  app.querySelectorAll('[data-grade]').forEach((button) => button.addEventListener('click', () => {
    state.grade = Number(button.dataset.grade);
    state.search = '';
    state.preview = null;
    render();
  }));
  app.querySelectorAll('[data-path]').forEach((button) => button.addEventListener('click', () => {
    state.path = button.dataset.path;
    state.search = '';
    state.preview = null;
    state.unitSelection = null;
    render();
  }));
}

render();
