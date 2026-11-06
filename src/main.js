import curriculum from './data/curriculum/structure.json';
import sourceIndex from '../data/curriculum/source-book-index.draft.json';
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
  const pathwayId = state.stage === 'primary'
    ? (state.path === 'advanced' ? 'commercial-reference-guides' : 'egypt-primary-general')
    : state.stage === 'preparatory'
      ? (state.path === 'advanced' ? 'commercial-reference-guides' : 'egypt-preparatory-general')
      : state.stage === 'secondary' ? 'egypt-secondary-general'
        : state.path === 'second-language' ? 'egypt-baccalaureate-second-language' : 'egypt-baccalaureate';
  return sourceIndex.books.filter((book) => book.pathwayId === pathwayId && (
    state.stage === 'egyptian-baccalaureate' || book.grade === gradeName
  ));
}

function bookUrl(file, page) {
  const path = `/books/${encodeURIComponent(file)}`;
  return page ? `${path}#page=${page}` : path;
}

function renderBookLibrary(books) {
  if (!books.length) {
    return '<div class="empty-state"><div class="book-icon">▤</div><strong>No indexed source book for this selection yet</strong><span>Existing source files remain preserved in the library</span></div>';
  }
  return books.map((book) => {
    const units = (book.units || []).map((unit) => {
      const pageLabel = Number.isInteger(unit.startPdfPage) ? `PDF page ${unit.startPdfPage}` : 'Page reference not indexed';
      const title = `Unit ${unit.number}: ${unit.title}`;
      return Number.isInteger(unit.startPdfPage)
        ? `<button class="unit-link" type="button" data-preview-file="${escapeHtml(book.sourceFile)}" data-preview-page="${unit.startPdfPage}"><strong>${escapeHtml(title)}</strong><span>${pageLabel} · Preview</span></button>`
        : `<div class="unit-link unavailable"><strong>${escapeHtml(title)}</strong><span>${pageLabel}</span></div>`;
    }).join('');
    const typeLabel = book.documentType === 'student_book' ? 'Student book'
      : book.documentType === 'assessment' ? 'Assessment book'
        : book.documentType === 'reader' ? 'Reader' : 'Supplementary reference';
    return `<article class="book-card"><div class="book-card-head"><div><span class="book-type">${typeLabel}</span><h3>${escapeHtml(book.grade)} · ${book.term ? `Term ${book.term}` : 'Course book'}</h3><p>${escapeHtml(book.sourceFile)}</p></div><button class="source-open" type="button" data-preview-file="${escapeHtml(book.sourceFile)}" data-preview-page="1">Preview full PDF ↗</button></div>${units ? `<div class="unit-list">${units}</div>` : '<p class="no-units">No unit list is indexed for this document yet. The original PDF is available in the preview above.</p>'}</article>`;
  }).join('');
}

function renderPreview() {
  if (!state.preview) return '';
  const { file, page } = state.preview;
  return `<section class="pdf-preview" aria-label="PDF preview"><div class="preview-heading"><div><p class="eyebrow">ORIGINAL SOURCE · READ ONLY</p><strong>${escapeHtml(file)}</strong><span>PDF page ${page}</span></div><button type="button" class="preview-close" data-close-preview>Close preview ✕</button></div><iframe title="Original source book preview" src="${bookUrl(file, page)}" loading="lazy"></iframe><p class="preview-note">The original PDF is displayed without modification. If your browser cannot display PDFs, use the full-file link below.</p><a class="source-open preview-fallback" href="${bookUrl(file, page)}" target="_blank" rel="noopener">Open PDF in a new tab ↗</a></section>`;
}

function render() {
  const stage = currentStage();
  const paths = stage.paths;
  const selectedPath = paths.find((item) => item.id === state.path) || paths[0];
  state.path = selectedPath.id;
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
                : path.id === (state.path === 'advanced' ? 'commercial-reference-guides' : state.path);
              const id = state.stage === 'egyptian-baccalaureate'
                ? (path.id === 'egypt-baccalaureate' ? 'first-language' : 'second-language') : path.id;
              return `<button class="path-button ${active ? 'active' : ''}" data-path="${id}"><strong>${escapeHtml(path.label || path.name)}</strong><span>${escapeHtml(path.officialSeries || path.series || 'Reserved pathway')}</span></button>`;
            }).join('')}
          </div>
        </div>
      </section>
      <section class="library-section">
        <div class="library-heading"><div><p class="eyebrow">YOUR LEARNING CONTENT</p><h2>${escapeHtml(selectedPath.series || selectedPath.name)}</h2><p class="library-intro">Source books are preserved unchanged. Search the selected grade or preview a book and jump to indexed unit pages.</p></div><span class="book-count">${books.length} source file${books.length === 1 ? '' : 's'}</span></div>
        <label class="library-search-label" for="library-search">Search books and units</label>
        <input id="library-search" class="library-search" type="search" placeholder="Type a book title, unit, or topic…" value="${escapeHtml(state.search)}" autocomplete="off">
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

  app.querySelectorAll('[data-preview-file]').forEach((button) => button.addEventListener('click', () => {
    state.preview = { file: button.dataset.previewFile, page: Number(button.dataset.previewPage) || 1 };
    render();
    app.querySelector('.pdf-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
  app.querySelector('[data-close-preview]')?.addEventListener('click', () => {
    state.preview = null;
    render();
  });
  app.querySelectorAll('[data-stage]').forEach((button) => button.addEventListener('click', () => {
    state.stage = button.dataset.stage;
    const next = currentStage();
    state.grade = next.grades[0] || null;
    state.path = next.paths[0].id;
    state.search = '';
    state.preview = null;
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
    render();
  }));
}

render();
