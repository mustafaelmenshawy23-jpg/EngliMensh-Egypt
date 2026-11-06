import curriculum from './data/curriculum/structure.json';
import sourceIndex from '../data/curriculum/source-book-index.draft.json';
import reviewCandidates from './data/extracted/manual-recovery-candidates.json';
import lessonDrafts from './data/lessons/lessons.draft.json';
import unitModules from './data/lessons/unit-modules.draft.json';
import './style.css';

const app = document.querySelector('#app');
const state = { stage: 'primary', grade: 1, path: 'general', search: '', preview: null };

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
  const path = `${import.meta.env.BASE_URL}books/${encodeURIComponent(file)}`;
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
    { type: 'speaking', title: 'Speaking', subtitle: 'Pair-work dialogues and speaking prompts' },
    { type: 'phonics', title: 'Phonics', subtitle: 'Letter patterns, IPA sounds, and printed examples' }
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
    const content = items.length ? '<ul>' + items.map(({ lesson, item }) => {
      const data = item.content || {};
      const heading = data.word || data.title || data.instruction || item.itemId;
      const detailHtml = Object.entries(data).filter(([key, value]) => !['word', 'title'].includes(key) && value !== null && value !== undefined && value !== '')
        .map(([key, value]) => `<span><strong>${escapeHtml(key.replaceAll(/([A-Z])/g, ' $1'))}:</strong> ${renderValue(value)}</span>`).join('');
      return `<li><strong>${escapeHtml(heading)}</strong>${detailHtml}<small>PDF page ${item.sourcePdfPage || lesson.pdfPage} · ${escapeHtml(item.reviewStatus || lesson.reviewStatus || 'needs_review')}</small></li>`;
    }).join('') + '</ul>' : '<p class="unit-module-empty">No extracted source content is recorded in this section yet.</p>';
    const hasItems = items.length > 0;
    const sectionStatus = hasItems ? 'Review pending' : (baseSection?.status === 'not_populated' ? 'Not populated' : 'No source data');
    return `<section class="unit-module" data-module="${definition.type}"><div class="unit-module-head"><div><h5>${definition.title}</h5><p>${definition.subtitle}</p></div><span class="lesson-status">${sectionStatus}</span></div>${content}</section>`;
  }).join('');
  const lessonHeadings = lessonRecords.map((lesson) => `<p class="lesson-draft-note"><strong>${escapeHtml(lesson.title)}</strong> · ${escapeHtml(lesson.grade)} · PDF page ${lesson.pdfPage} · ${escapeHtml(lesson.reviewStatus)}</p>`).join('');
  return `<section class="unit-workspace" aria-label="Unit details">
    <div class="unit-workspace-head"><div><p class="eyebrow">UNIT WORKSPACE · SOURCE-LINKED</p><h3>Unit ${unit.number}: ${escapeHtml(unit.title)}</h3><p>${escapeHtml(book.grade)} · ${book.term ? `Term ${book.term}` : 'Course book'} · ${Number.isInteger(unit.startPdfPage) ? `PDF page ${unit.startPdfPage}` : 'Unit opening page not yet indexed'}</p></div><button type="button" class="preview-close" data-close-unit>Close unit ✕</button></div>
    ${detail('Language focus', unit.languageFocus)}${detail('Integrated activity', unit.integratedActivity)}${detail('Concept', unit.concept)}
    ${unit.topics?.length ? `<div class="unit-metadata"><span>Topics recorded in the index</span>${tags(unit.topics)}</div>` : ''}
    ${unit.vocabulary?.length ? `<div class="unit-metadata"><span>Vocabulary recorded in the index</span>${tags(unit.vocabulary)}</div>` : ''}
    ${lessonHeadings}
    <div class="unit-module-grid">${modules}</div>
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

  app.querySelectorAll('[data-unit-book]').forEach((button) => button.addEventListener('click', () => { state.unitSelection = { bookId: button.dataset.unitBook, unitNumber: Number(button.dataset.unitNumber) }; state.preview = null; render(); app.querySelector('.unit-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
  app.querySelector('[data-close-unit]')?.addEventListener('click', () => { state.unitSelection = null; render(); });
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
