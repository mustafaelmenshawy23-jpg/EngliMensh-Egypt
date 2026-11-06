import curriculum from './data/curriculum/structure.json';
import sourceIndex from '../data/curriculum/source-book-index.draft.json';
import './style.css';

const app = document.querySelector('#app');
const state = { stage: 'primary', grade: 1, path: 'general' };

const stageNames = {
  primary: 'Primary',
  preparatory: 'Preparatory',
  secondary: 'Secondary',
  'egyptian-baccalaureate': 'Egyptian Baccalaureate'
};

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
      : state.stage === 'secondary' ? 'egypt-secondary-general' : 'egypt-baccalaureate';
  return sourceIndex.books.filter((book) => book.grade === gradeName && book.pathwayId === pathwayId);
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
        ? `<a class="unit-link" href="${bookUrl(book.sourceFile, unit.startPdfPage)}" target="_blank" rel="noopener"><strong>${title}</strong><span>${pageLabel} ↗</span></a>`
        : `<div class="unit-link unavailable"><strong>${title}</strong><span>${pageLabel}</span></div>`;
    }).join('');
    const typeLabel = book.documentType === 'student_book' ? 'Student book'
      : book.documentType === 'assessment' ? 'Assessment book'
        : book.documentType === 'reader' ? 'Reader' : 'Supplementary reference';
    return `<article class="book-card"><div class="book-card-head"><div><span class="book-type">${typeLabel}</span><h3>${book.grade} · ${book.term ? `Term ${book.term}` : 'Course book'}</h3><p>${book.sourceFile}</p></div><a class="source-open" href="${bookUrl(book.sourceFile)}" target="_blank" rel="noopener">Open PDF ↗</a></div>${units ? `<div class="unit-list">${units}</div>` : '<p class="no-units">No unit list is indexed for this document yet. The original PDF is available above.</p>'}</article>`;
  }).join('');
}

function render() {
  const stage = currentStage();
  const paths = stage.paths;
  const selectedPath = paths.find((item) => item.id === state.path) || paths[0];
  state.path = selectedPath.id;
  const grades = stage.grades;
  const books = selectedBooks();

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
            ${grades.length ? grades.map((grade) => `<button class="grade-button ${grade === state.grade ? 'active' : ''}" data-grade="${grade}">Grade ${grade}</button>`).join('') : '<span class="reserved-note">Standalone pathway</span>'}
          </div>
        </div>
        <div class="selection-row path-row">
          <div><p class="eyebrow">STEP 03</p><h2>Choose your pathway</h2></div>
          <div class="path-grid">
            ${paths.map((path) => `<button class="path-button ${path.id === state.path ? 'active' : ''}" data-path="${path.id}"><strong>${path.name}</strong><span>${path.series || 'Reserved pathway'}</span></button>`).join('')}
          </div>
        </div>
      </section>
      <section class="library-section">
        <div class="library-heading"><div><p class="eyebrow">YOUR LEARNING CONTENT</p><h2>${selectedPath.series || selectedPath.name}</h2><p class="library-intro">Source books are preserved unchanged. Open a book or jump directly to an indexed unit page.</p></div><span class="book-count">${books.length} source file${books.length === 1 ? '' : 's'}</span></div>
        <div class="book-library">${selectedPath.status === 'reserved_empty' ? '<div class="empty-state"><div class="book-icon">▤</div><strong>This pathway is reserved</strong><span>No source book is indexed for it yet</span></div>' : renderBookLibrary(books)}</div>
      </section>
      <footer>EngliMensh <span>•</span> Egyptian Curriculum <span>•</span> Source-based learning</footer>
    </main>`;

  app.querySelectorAll('[data-stage]').forEach((button) => button.addEventListener('click', () => {
    state.stage = button.dataset.stage;
    const next = currentStage();
    state.grade = next.grades[0] || null;
    state.path = next.paths[0].id;
    render();
  }));
  app.querySelectorAll('[data-grade]').forEach((button) => button.addEventListener('click', () => {
    state.grade = Number(button.dataset.grade);
    render();
  }));
  app.querySelectorAll('[data-path]').forEach((button) => button.addEventListener('click', () => {
    state.path = button.dataset.path;
    render();
  }));
}

render();
