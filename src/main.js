import curriculum from './data/curriculum/structure.json';
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

function render() {
  const stage = currentStage();
  const paths = stage.paths;
  const selectedPath = paths.find((item) => item.id === state.path) || paths[0];
  state.path = selectedPath.id;
  const grades = stage.grades;

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
      <section class="content-panel">
        <div class="content-copy"><p class="eyebrow">YOUR LEARNING CONTENT</p><h2>${selectedPath.series || selectedPath.name}</h2><p>${selectedPath.status === 'reserved_empty' ? 'This pathway is reserved and will remain empty until its official source books are uploaded.' : 'The curriculum library is being prepared from your official PDF books. No lessons or questions will be displayed until the source material is uploaded and reviewed.'}</p></div>
        <div class="empty-state"><div class="book-icon">▤</div><strong>Books will appear here</strong><span>Official source materials only</span></div>
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
