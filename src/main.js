import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import curriculum from './data/curriculum/structure.json';
import primaryHtmlCurriculum from './data/curriculum/primary-connect-html-2026-2027.json';
import sourceIndex from '../data/curriculum/source-book-index.draft.json';
import reviewCandidates from './data/extracted/manual-recovery-candidates.json';
import lessonDrafts from './data/lessons/lessons.draft.json';
import unitModules from './data/lessons/unit-modules.draft.json';
import p1u1Draft from '../artifacts/unit-drafts/primary1-student-term1-unit-1.json';
import p1u2Draft from '../artifacts/unit-drafts/primary1-student-term1-unit-2.json';
import p1u3Draft from '../artifacts/unit-drafts/primary1-student-term1-unit-3.json';
import './style.css';

const app = document.querySelector('#app');

// Student App State (Preserves all progress across back-and-forth navigation and reloads)
const STORAGE_KEY = 'englimensh_p1u1_progress';

const vocabVisualMap = {
  hello: { icon: '👋', tag: 'Greeting', phonetic: '/həˈləʊ/' },
  goodbye: { icon: '🙋‍♂️', tag: 'Farewell', phonetic: '/ɡʊdˈbaɪ/' },
  name: { icon: '🏷️', tag: 'Identity', phonetic: '/neɪm/' },
  wave: { icon: '👋', tag: 'Action', phonetic: '/weɪv/' },
  'shake hands': { icon: '🤝', tag: 'Action', phonetic: '/ʃeɪk hændz/' },
  friend: { icon: '👫', tag: 'People', phonetic: '/frend/' },
  teacher: { icon: '👩‍🏫', tag: 'People', phonetic: '/ˈtiːtʃə/', image: '/assets/vocab/teacher.svg' },
  chair: { icon: '🪑', tag: 'Classroom', phonetic: '/tʃeə/', image: '/assets/vocab/chair.svg' },
  bag: { icon: '🎒', tag: 'School Supply', phonetic: '/bæɡ/', image: '/assets/vocab/bag.svg' },
  desk: { icon: '🧑‍💻', tag: 'Classroom', phonetic: '/desk/', image: '/assets/vocab/desk.svg' },
  pencil: { icon: '✏️', tag: 'School Supply', phonetic: '/ˈpensəl/', image: '/assets/vocab/pencil.svg' },
  board: { icon: '📋', tag: 'Classroom', phonetic: '/bɔːd/' },
  book: { icon: '📖', tag: 'School Supply', phonetic: '/bʊk/', image: '/assets/vocab/book.svg' },
  'stand up': { icon: '🧍', tag: 'Action Command', phonetic: '/stænd ʌp/' },
  'sit down': { icon: '🧎', tag: 'Action Command', phonetic: '/sɪt daʊn/' },
  open: { icon: '📖', tag: 'Action Command', phonetic: '/ˈəʊpən/' },
  close: { icon: '📕', tag: 'Action Command', phonetic: '/kləʊz/' },
  tiger: { icon: '🐯', tag: 'Phonics Letter T', phonetic: '/ˈtaɪɡə/', image: '/assets/vocab/tiger.svg' },
  tomato: { icon: '🍅', tag: 'Phonics Letter T', phonetic: '/təˈmɑːtəʊ/', image: '/assets/vocab/tomato.svg' },
  table: { icon: '🪵', tag: 'Phonics Letter T', phonetic: '/ˈteɪbəl/' },
  tree: { icon: '🌳', tag: 'Phonics Letter T', phonetic: '/triː/', image: '/assets/vocab/tree.svg' },
  in: { icon: '📥', tag: 'Phonics Letter I', phonetic: '/ɪn/' },
  ink: { icon: '🖋️', tag: 'Phonics Letter I', phonetic: '/ɪŋk/' },
  insect: { icon: '🐛', tag: 'Phonics Letter I', phonetic: '/ˈɪnsekt/', image: '/assets/vocab/insect.svg' }
};

const state = {
  navigationEpoch: 0,
  stage: 'primary',
  grade: 1,
  path: 'general',
  search: '',
  preview: null,
  unitSelection: null,
  importedUnitNumber: null,
  activeModule: null, // 'vocabulary', 'grammar', 'reading', 'listening', 'games', 'comprehensive_test'
  activeVocabSubtab: 'words', // 'words' or 'practice'
  activeGrammarSubtab: 'rules', // 'rules' or 'practice'
  activeGameTab: 1, // 1, 2, 3, 4
  vocabIndex: 0, // 0 to 23 for focused card view
  vocabViewMode: 'card', // 'card' or 'grid'
  testQuestionIndex: 0, // 0 to 9 for 1-question-at-a-time test
  listeningSpeed: 1.0, // 0.75, 1.0, 1.25
  quizAnswers: {},
  shuffledOptions: {},
  game1: { selectedWord: null, selectedPic: null, matches: [], score: 0 },
  game2: { index: 0, placed: [], score: 0, checkResult: null },
  game3: { index: 0, score: 0, selectedOption: null },
  game4: { index: 0, score: 0, selectedOption: null },
  selfIntro: { name: 'Omar', avatar: '👧' },
  politeness: { answers: {} }
};

const STUDENT_PROFILES_KEY = 'englimensh_student_profiles_v1';
const LEGACY_PROGRESS_KEY = 'englimensh_p1u1_progress';
let studentProfiles = [];
let activeStudentId = null;
function getProgressStorageKey() { return activeStudentId ? 'englimensh_progress_' + activeStudentId + '_' + state.stage + '_' + state.grade + '_' + state.path : LEGACY_PROGRESS_KEY; }
function loadStudentProfiles() { try { const saved = JSON.parse(window.localStorage.getItem(STUDENT_PROFILES_KEY) || '[]'); studentProfiles = Array.isArray(saved) ? saved.filter((item) => item && item.id && item.name) : []; } catch { studentProfiles = []; } }
function saveStudentProfiles() { try { window.localStorage.setItem(STUDENT_PROFILES_KEY, JSON.stringify(studentProfiles)); } catch (error) { console.warn('Student profile save warning:', error); } }
function resetStudentProgressState() { state.quizAnswers = {}; state.shuffledOptions = {}; state.activeModule = null; state.importedUnitNumber = null; state.activeVocabSubtab = 'words'; state.activeGrammarSubtab = 'rules'; state.activeGameTab = 1; state.vocabIndex = 0; state.vocabViewMode = 'card'; state.testQuestionIndex = 0; state.listeningSpeed = 1; state.game1 = { selectedWord:null, selectedPic:null, matches:[], score:0 }; state.game2 = { index:0, placed:[], score:0, checkResult:null }; state.game3 = { index:0, score:0, selectedOption:null }; state.game4 = { index:0, score:0, selectedOption:null }; state.politeness = { answers:{} }; }
function activateStudent(profile) { if (!profile) return; if (activeStudentId) saveProgressToStorage(); activeStudentId = profile.id; state.stage = profile.stage || 'primary'; state.grade = Number(profile.grade) || 1; state.path = profile.path || 'general'; const targetKey = getProgressStorageKey(); const previousProfileKey = 'englimensh_progress_' + profile.id; if (!window.localStorage.getItem(targetKey)) { const previous = window.localStorage.getItem(previousProfileKey); const legacy = studentProfiles.length === 1 ? window.localStorage.getItem(LEGACY_PROGRESS_KEY) : null; const migration = previous || legacy; if (migration) window.localStorage.setItem(targetKey, migration); } state.search = ''; state.preview = null; state.unitSelection = null; resetStudentProgressState(); loadProgressFromStorage(); render(); }
function renderStudentProfiles() {
 const cards = studentProfiles.map((p) => '<button type="button" class="student-profile-option" data-select-student="' + escapeHtml(p.id) + '">' + (p.photo ? '<img class="student-profile-photo" src="' + p.photo + '" alt="">' : '<span class="student-profile-placeholder">＋</span>') + '<span><strong>' + escapeHtml(p.name) + '</strong><small>' + escapeHtml(stageNames[p.stage] || 'Primary') + ' · Grade ' + escapeHtml(p.grade) + '</small></span><b>›</b></button>').join('');
 app.innerHTML = '<main class="profile-gate"><header class="classic-brand"><span class="classic-brand-mark">E</span><div><strong>EngliMensh-Egypt</strong><small>Learn · Practice · Achieve</small></div></header><section class="profile-picker-card"><p class="classic-eyebrow">WELCOME TO YOUR LEARNING SPACE</p><h1>Choose Your Profile</h1><p class="profile-lead">Select your profile to continue learning.</p><div class="student-profile-list">' + cards + '</div><form class="new-student-form" id="new-student-form"><h2>Create a Student Profile</h2><label>Student name<input name="studentName" maxlength="40" required placeholder="Enter your name"></label><label>Choose your stage<select name="studentStage"><option value="primary">Primary</option><option value="preparatory">Preparatory</option><option value="secondary">Secondary</option><option value="egyptian-baccalaureate">Egyptian Baccalaureate</option></select></label><label>Choose your grade<select name="studentGrade"><option value="1">Grade 1</option><option value="2">Grade 2</option><option value="3">Grade 3</option><option value="4">Grade 4</option><option value="5">Grade 5</option><option value="6">Grade 6</option></select></label><p class="profile-curricula-note"><strong>Available curricula</strong><span>Connect</span><span>Connect Plus</span><small>You can choose either curriculum from your learning screen.</small></p><label>Choose a photo from your gallery (optional)<input name="studentPhoto" type="file" accept="image/*"></label><label>Or take a photo with your camera<input name="studentPhotoCamera" type="file" accept="image/*" capture="user"></label><button class="classic-primary-button" type="submit">Create Profile</button></form></section><footer class="classic-footer">Your learning progress is saved separately in each profile.</footer></main>';
 app.querySelectorAll('[data-select-student]').forEach((b) => b.addEventListener('click', () => activateStudent(studentProfiles.find((p) => p.id === b.dataset.selectStudent))));
 const stageField = app.querySelector('#new-student-form')?.elements.studentStage;
 const gradeField = app.querySelector('#new-student-form')?.elements.studentGrade;
 const refreshProfileChoices = () => { const stageInfo = curriculum.stages.find((item) => item.id === stageField?.value); if (gradeField) gradeField.innerHTML = (stageInfo?.grades || [1]).map((grade) => '<option value="' + grade + '">Grade ' + grade + '</option>').join(''); };
 stageField?.addEventListener('change', refreshProfileChoices);
 refreshProfileChoices();

 app.querySelector('#new-student-form')?.addEventListener('submit', (event) => { event.preventDefault(); const form = event.currentTarget; const name = String(form.elements.studentName.value || '').trim(); if (!name) return; const profile = { id:'student_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,7), name, stage:form.elements.studentStage.value, grade:Number(form.elements.studentGrade.value) || 1, path:'general', paths:(form.elements.studentStage.value === 'primary' ? ['general','advanced'] : (curriculum.stages.find((item) => item.id === form.elements.studentStage.value)?.paths || []).map((item) => item.id)), photo:'' }; const finish = () => { studentProfiles.push(profile); saveStudentProfiles(); activateStudent(profile); }; const file = (form.elements.studentPhotoCamera.files && form.elements.studentPhotoCamera.files[0]) || (form.elements.studentPhoto.files && form.elements.studentPhoto.files[0]); if (file) { const reader = new FileReader(); reader.onload = () => { const source = String(reader.result || ''); const image = new Image(); image.onload = () => { const scale = Math.min(1, 640 / Math.max(image.width, image.height)); const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale)); const context = canvas.getContext('2d'); if (context) { context.drawImage(image, 0, 0, canvas.width, canvas.height); profile.photo = canvas.toDataURL('image/jpeg', 0.78); } finish(); }; image.onerror = finish; image.src = source; }; reader.onerror = finish; reader.readAsDataURL(file); } else finish(); });
}
function getActiveStudentProfile() { return studentProfiles.find((item) => item.id === activeStudentId) || null; }
function getUnitCertificateKey() { return [state.stage, state.grade, state.path, state.importedUnitNumber].join(':'); }
function buildUnitCertificate(unit, track, grade, questions, prefix) {
  const profile = getActiveStudentProfile();
  if (!profile || !unit || !questions.length) return '<p class="unit-source-note">Complete the unit assessment to unlock your certificate.</p>';
  const answers = questions.map((_, index) => getQuestionState(prefix + '-' + index));
  const correct = answers.filter((item) => item.isCorrect).length;
  const attempted = answers.filter((item) => item.isCorrect || item.wrongChoices.length).length;
  const score = Math.round(correct / questions.length * 100);
  const complete = attempted === questions.length && score >= 90;
  const key = getUnitCertificateKey();
  if (complete) {
    profile.certificates = profile.certificates || {};
    if (!profile.certificates[key]) profile.certificates[key] = { studentName: profile.name, stage: stageNames[state.stage] || state.stage, grade: grade.grade, curriculum: track.name, unit: unit.title, unitNumber: unit.number, score, completedAt: new Date().toISOString() };
    saveStudentProfiles();
  }
  const certificate = profile.certificates?.[key];
  if (!certificate) return '<section class="certificate-progress-card"><h3>Certificate progress</h3><p>You answered ' + correct + ' of ' + questions.length + ' questions correctly (' + score + '%).</p><p>Finish the assessment with at least 90% to earn your certificate.</p></section>';
  const date = new Date(certificate.completedAt).toLocaleDateString('en-GB');
  return '<section class="certificate-card" aria-label="Certificate of Excellence"><button type="button" class="certificate-pdf-button" data-save-certificate>Save as PDF</button><div class="certificate-student-photo">' + (profile.photo ? '<img src="' + profile.photo + '" alt="Student portrait">' : '<span>Student Photo</span>') + '</div><div class="certificate-text"><p class="certificate-kicker">ENG L I M E N S H · EGYPT</p><h3>Certificate of Excellence</h3><p>This certificate is proudly presented to</p><h2>' + escapeHtml(certificate.studentName) + '</h2><p>For successfully completing</p><h3 class="certificate-unit">' + escapeHtml(certificate.unit) + '</h3><p>' + escapeHtml(certificate.stage) + ' · Grade ' + certificate.grade + ' · ' + escapeHtml(certificate.curriculum) + '</p><strong class="certificate-score">' + certificate.score + '%</strong><p class="certificate-message">Excellent work! Keep learning, keep growing, and believe in yourself.</p><small>Completed: ' + date + '</small></div></section>'
}

function renderStudentHub() {
 const profile = getActiveStudentProfile();
 if (!profile) return '';
 const certificates = Object.values(profile.certificates || {});
 const answers = Object.values(state.quizAnswers || {});
 const correct = answers.filter((item) => item && item.isCorrect).length;
 const mistakes = answers.reduce((sum,item) => sum + (Array.isArray(item?.wrongChoices) ? item.wrongChoices.length : 0),0);
 const tab = state.studentTool || 'overview';
 const tabs = [['overview','My Progress'],['certificates','My Certificates'],['mistakes','Mistake Review'],['favorites','Favorites'],['achievements','Achievements'],['settings','Settings'],['creator','Meet the App Creator']];
 let content = '';
 if (tab === 'overview') content = '<div class="student-hub-stats"><article><strong>' + correct + '</strong><span>Correct answers</span></article><article><strong>' + mistakes + '</strong><span>Practice retries</span></article><article><strong>' + certificates.length + '</strong><span>Certificates</span></article></div><p class="unit-source-note">Your learning record is saved in this profile and kept separate from other students.</p>';
 if (tab === 'certificates') content = certificates.length ? certificates.map((c) => '<section class="certificate-card" aria-label="Certificate of Excellence"><button type="button" class="certificate-pdf-button" data-save-certificate>Save as PDF</button><div class="certificate-student-photo">' + (profile.photo ? '<img src="' + profile.photo + '" alt="Student portrait">' : '<span>Student Photo</span>') + '</div><div class="certificate-text"><p class="certificate-kicker">ENG L I M E N S H · EGYPT</p><h3>Certificate of Excellence</h3><p>This certificate is proudly presented to</p><h2>' + escapeHtml(c.studentName || profile.name) + '</h2><p>For successfully completing</p><h3 class="certificate-unit">' + escapeHtml(c.unit || 'Completed unit') + '</h3><p>' + escapeHtml(c.stage || '') + ' · Grade ' + c.grade + ' · ' + escapeHtml(c.curriculum || '') + '</p><strong class="certificate-score">' + Number(c.score || 0) + '%</strong><p class="certificate-message">Excellent work! Keep learning, keep growing, and believe in yourself.</p><small>Completed: ' + new Date(c.completedAt).toLocaleDateString('en-GB') + '</small></div></section>').join('') : '<p class="unit-source-note">Your certificates will appear here after you complete a unit assessment with 90% or more.</p>';
 if (tab === 'mistakes') content = '<p class="unit-source-note">Review questions you have tried more than once. Your wrong answers are saved so you can practise again.</p><strong>' + mistakes + ' recorded retry attempts in the current grade and curriculum.</strong>';
 if (tab === 'favorites') content = '<p class="unit-source-note">Save units to your Favorites from the unit list. Your saved units will be kept in this student profile.</p><div class="student-favorite-list">' + (profile.favorites || []).map(x => '<span>★ ' + escapeHtml(x) + '</span>').join('') + '</div>';
 if (tab === 'achievements') content = '<div class="student-hub-stats"><article><strong>' + certificates.length + '</strong><span>Certificates earned</span></article><article><strong>' + certificates.filter(c => Number(c.score) >= 95).length + '</strong><span>Excellent scores</span></article><article><strong>' + (profile.favorites || []).length + '</strong><span>Saved units</span></article></div><p class="unit-source-note">Every completed unit assessment and high score is celebrated here.</p>';
 if (tab === 'settings') content = '<label class="student-setting-row">Learning theme <select data-student-theme><option value="classic" ' + ((profile.theme || 'classic') === 'classic' ? 'selected' : '') + '>Classic Cream</option><option value="ocean" ' + (profile.theme === 'ocean' ? 'selected' : '') + '>Ocean Blue</option><option value="forest" ' + (profile.theme === 'forest' ? 'selected' : '') + '>Forest Green</option><option value="lavender" ' + (profile.theme === 'lavender' ? 'selected' : '') + '>Lavender</option></select></label><p class="unit-source-note">Your selected theme is saved with this profile.</p><form class="profile-edit-form" data-edit-student-profile><h3>Edit Student Profile</h3><label>Student name<input name="editStudentName" maxlength="40" required value="' + escapeHtml(profile.name) + '"></label><label>Stage<select name="editStudentStage">' + curriculum.stages.map((stage) => '<option value="' + escapeHtml(stage.id) + '" ' + (profile.stage === stage.id ? 'selected' : '') + '>' + escapeHtml(stageNames[stage.id] || stage.name) + '</option>').join('') + '</select></label><label>Grade<select name="editStudentGrade">' + (curriculum.stages.find((stage) => stage.id === profile.stage)?.grades || [1]).map((grade) => '<option value="' + grade + '" ' + (Number(profile.grade) === grade ? 'selected' : '') + '>Grade ' + grade + '</option>').join('') + '</select></label><label>Choose a new photo from gallery<input name="editStudentPhoto" type="file" accept="image/*"></label><label>Or take a new photo<input name="editStudentCamera" type="file" accept="image/*" capture="user"></label><button class="classic-primary-button" type="submit">Save Profile Changes</button></form>';
 if (tab === 'creator') content = '<div class="creator-card"><img src="/assets/teacher-portrait.jpeg" alt="App creator"><div><strong>Your Teacher</strong><p>Welcome to EngliMensh-Egypt. Keep learning, practising and achieving!</p></div></div>';
 return '<section class="student-hub panel"><div class="student-hub-heading"><div><p class="eyebrow">STUDENT SPACE</p><h2>' + escapeHtml(profile.name) + ' · My Learning</h2></div>' + (profile.photo ? '<img class="student-hub-avatar" src="' + profile.photo + '" alt="">' : '') + '</div><nav class="student-hub-tabs">' + tabs.map(([id,label]) => '<button type="button" data-student-hub="' + id + '" class="' + (tab === id ? 'active' : '') + '">' + label + '</button>').join('') + '</nav><div class="student-hub-content">' + content + '</div></section>';
}

function getQuestionState(qId) {
  const val = state.quizAnswers[qId];
  if (!val) return { choice: null, isCorrect: false, wrongChoices: [] };
  if (typeof val === 'string') {
    return { choice: val, isCorrect: true, wrongChoices: [] };
  }
  return {
    choice: val.choice || null,
    isCorrect: Boolean(val.isCorrect),
    wrongChoices: Array.isArray(val.wrongChoices) ? val.wrongChoices : []
  };
}

function getShuffledOptions(itemId, options) {
  if (!Array.isArray(options)) return [];
  if (!state.shuffledOptions) state.shuffledOptions = {};
  if (!state.shuffledOptions[itemId]) {
    const copy = [...options];
    let seed = 0;
    const idStr = String(itemId || 'q');
    for (let i = 0; i < idStr.length; i++) {
      seed = (seed * 31 + idStr.charCodeAt(i)) % 1000000007;
    }
    for (let i = copy.length - 1; i > 0; i--) {
      seed = (seed * 16807) % 2147483647;
      const j = Math.floor((seed / 2147483647) * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    state.shuffledOptions[itemId] = copy;
    saveProgressToStorage();
  }
  return state.shuffledOptions[itemId];
}

function resetReadingProgress() {
  if (!p1u1Draft) return;
  const readSec = p1u1Draft.sections.find((s) => s.type === 'reading');
  const items = readSec?.items?.filter(i => i.content?.question) || [];
  items.forEach(q => {
    delete state.quizAnswers[q.itemId];
  });
  saveProgressToStorage();
}

function resetListeningProgress() {
  if (!p1u1Draft) return;
  const listSec = p1u1Draft.sections.find((s) => s.type === 'listening');
  const items = listSec?.items?.filter(i => i.content?.question) || [];
  items.forEach(q => {
    delete state.quizAnswers[q.itemId];
  });
  saveProgressToStorage();
}

function loadProgressFromStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const raw = window.localStorage.getItem(getProgressStorageKey()) || (!activeStudentId ? window.localStorage.getItem(LEGACY_PROGRESS_KEY) : null);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const isPlainObject = (val) => Boolean(val && typeof val === 'object' && !Array.isArray(val));
    if (parsed && typeof parsed === 'object') {
      if (isPlainObject(parsed.quizAnswers)) state.quizAnswers = parsed.quizAnswers;
      if (isPlainObject(parsed.shuffledOptions)) state.shuffledOptions = parsed.shuffledOptions;
      if (parsed.activeModule !== undefined) state.activeModule = parsed.activeModule;
      if (Number.isInteger(parsed.importedUnitNumber)) state.importedUnitNumber = parsed.importedUnitNumber;
      if (parsed.activeVocabSubtab) state.activeVocabSubtab = parsed.activeVocabSubtab;
      if (parsed.activeGrammarSubtab) state.activeGrammarSubtab = parsed.activeGrammarSubtab;
      if (parsed.activeGameTab) state.activeGameTab = parsed.activeGameTab;
      if (typeof parsed.vocabIndex === 'number' && parsed.vocabIndex >= 0 && parsed.vocabIndex < 24) state.vocabIndex = parsed.vocabIndex;
      if (parsed.vocabViewMode === 'card' || parsed.vocabViewMode === 'grid') state.vocabViewMode = parsed.vocabViewMode;
      if (typeof parsed.testQuestionIndex === 'number' && parsed.testQuestionIndex >= 0 && parsed.testQuestionIndex < 10) state.testQuestionIndex = parsed.testQuestionIndex;
      if (typeof parsed.listeningSpeed === 'number') state.listeningSpeed = parsed.listeningSpeed;
      if (isPlainObject(parsed.game1)) state.game1 = { ...state.game1, ...parsed.game1 };
      if (isPlainObject(parsed.game2)) {
        state.game2 = { ...state.game2, ...parsed.game2 };
        if (typeof state.game2.index !== 'number' || state.game2.index < 0) state.game2.index = 0;
        if (state.game2.index > 6) state.game2.index = 6;
      }
      if (isPlainObject(parsed.game3)) {
        state.game3 = { ...state.game3, ...parsed.game3 };
        if (typeof state.game3.index !== 'number' || state.game3.index < 0) state.game3.index = 0;
        if (state.game3.index > 6) state.game3.index = 6;
      }
      if (isPlainObject(parsed.game4)) {
        state.game4 = { ...state.game4, ...parsed.game4 };
        if (typeof state.game4.index !== 'number' || state.game4.index < 0) state.game4.index = 0;
        if (state.game4.index > 4) state.game4.index = 4;
      }
      if (isPlainObject(parsed.selfIntro)) state.selfIntro = { ...state.selfIntro, ...parsed.selfIntro };
      if (isPlainObject(parsed.politeness)) state.politeness = { ...state.politeness, ...parsed.politeness };
    }
  } catch (err) {
    console.warn('Safe recovery from storage parse error:', err);
  }
}

function saveProgressToStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const dataToSave = {
      quizAnswers: state.quizAnswers,
      shuffledOptions: state.shuffledOptions,
      activeModule: state.activeModule,
      importedUnitNumber: state.importedUnitNumber,
      activeVocabSubtab: state.activeVocabSubtab,
      activeGrammarSubtab: state.activeGrammarSubtab,
      activeGameTab: state.activeGameTab,
      vocabIndex: state.vocabIndex,
      vocabViewMode: state.vocabViewMode,
      testQuestionIndex: state.testQuestionIndex,
      listeningSpeed: state.listeningSpeed,
      game1: state.game1,
      game2: state.game2,
      game3: state.game3,
      game4: state.game4,
      selfIntro: state.selfIntro,
      politeness: state.politeness
    };
    window.localStorage.setItem(getProgressStorageKey(), JSON.stringify(dataToSave));
  } catch (err) {
    console.warn('LocalStorage save warning:', err);
  }
}

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

// Use Android's native TextToSpeech engine inside the APK; keep browser TTS for web.
async function speakText(text, rate = null) {
  const phrase = String(text || '').trim();
  if (!phrase) return;
  const speechRate = Number(rate || state.listeningSpeed || 0.85);

  if (Capacitor.isNativePlatform()) {
    try {
      if ('speechSynthesis' in window && window.speechSynthesis) window.speechSynthesis.cancel();
      await TextToSpeech.stop().catch(() => {});
      await TextToSpeech.speak({
        text: phrase,
        lang: 'en-US',
        rate: speechRate,
        pitch: 1,
        volume: 1,
        queueStrategy: 1
      });
      return;
    } catch (nativeError) {
      console.warn('Native Android TTS unavailable; trying browser speech:', nativeError);
    }
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.lang = 'en-US';
      utterance.rate = speechRate;
      utterance.volume = 1;
      utterance.onerror = (event) => console.warn('Browser speech playback error:', event.error);
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.warn('Audio playback error:', error);
    }
  } else {
    console.warn('No supported text-to-speech engine is available.');
  }
}

async function stopAudio() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis) {
    try { window.speechSynthesis.cancel(); } catch (error) { console.warn('Browser stop error:', error); }
  }
  if (Capacitor.isNativePlatform()) {
    try { await TextToSpeech.stop(); } catch (error) { console.warn('Native stop error:', error); }
  }
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
  return sourceIndex.books.filter((book) => book.pathwayId !== 'commercial-reference-guides' && book.pathwayId === pathwayId && (
    state.stage === 'egyptian-baccalaureate' || book.grade === gradeName
  ));
}

function bookUrl(file, page) {
  const base = import.meta.env.VITE_BOOKS_BASE_URL || `${import.meta.env.BASE_URL}books/`;
  const path = `${base}${encodeURIComponent(file)}`;
  return page ? `${path}#page=${page}` : path;
}


function explainGrammarRule(rule, examples = []) {
  const text = String(rule || '').toLowerCase();
  const exampleList = examples.filter((item) => !/(key pattern|verification|correct structure|incorrect syntax)/i.test(String(item))).slice(0, 3);
  let title = 'Understand the pattern';
  let explanation = 'Read the pattern, then notice how the words work together in each example.';
  let formula = rule || 'Grammar pattern';
  let tip = 'Say each example aloud, then change one word and make a new sentence.';
  if (/expressing feelings|i feel \+ adjective/.test(text)) {
    title = 'Talking about feelings';
    explanation = 'Use “feel” before an adjective to describe an emotion or condition. After “I”, use “feel”; after he or she, use “feels”. Ask “How do you feel?” when you want to know someone’s emotion.';
    formula = 'I / You / We / They feel + adjective · He / She feels + adjective';
    tip = 'I feel happy. / She feels excited. / How do you feel?';
    exampleList.splice(0, exampleList.length, 'I feel happy.', 'She feels excited.', 'How do you feel?');
  } else if (/expressing illness|i have a \+ illness/.test(text)) {
    title = 'Talking about illness';
    explanation = 'Use “have” or “has” with an illness. Use “have” with I, you, we and they; use “has” with he, she and it. Many common illnesses take “a” before the noun.';
    formula = 'I / You / We / They have a + illness · He / She has a + illness';
    tip = 'I have a cold. / She has a headache.';
    exampleList.splice(0, exampleList.length, 'I have a cold.', 'She has a headache.');
  } else if (/giving directions/.test(text)) {
    title = 'Giving directions';
    explanation = 'Start a direction with the base form of the verb. Use direction phrases such as “go straight”, “turn right” and “turn left” to explain the route.';
    formula = 'Go / Turn + direction';
    tip = 'Go straight. / Turn right at the traffic lights. / Turn left at the next street.';
    exampleList.splice(0, exampleList.length, 'Go straight.', 'Turn right at the traffic lights.', 'Turn left at the next street.');
  } else if (/questions: is there/.test(text)) {
    title = 'Asking about things that exist';
    explanation = 'Use “Is there …?” to ask about one thing. Use “Are there …?” to ask about more than one. In short answers, repeat the verb: “Yes, there is” or “No, there aren’t.”';
    formula = 'Is there + a / an + singular noun? · Are there + plural noun?';
    tip = 'Is there a river? Yes, there is. / Are there any trees? Yes, there are.';
    exampleList.splice(0, exampleList.length, 'Is there a river? Yes, there is.', 'Are there any trees? Yes, there are.');
  } else if (/telling time/.test(text)) {
    title = 'Telling the time';
    explanation = 'For an exact hour, say “It’s” followed by the number and “o’clock”. Use the same pattern to ask and answer about daily schedules.';
    formula = 'It is / It’s + number + o’clock';
    tip = 'It’s seven o’clock. / It’s eight o’clock.';
    exampleList.splice(0, exampleList.length, 'It’s seven o’clock.', 'School starts at eight o’clock.');
  } else if (/day and night routines/.test(text)) {
    title = 'Describing daily and natural routines';
    explanation = 'Use the present simple for routines and facts that happen regularly. Use the base verb with I, you, we and they; add -s or -es with he, she and it.';
    formula = 'I / We + base verb · He / She / It + verb-s';
    tip = 'The sun rises in the morning. / Stars appear at night.';
    exampleList.splice(0, exampleList.length, 'The sun rises in the morning.', 'The moon appears at night.');
  } else if (/singular vs plural clothes/.test(text)) {
    title = 'Talking about one item or more than one';
    explanation = 'Use “this is” with one item and “these are” with two or more. The noun must match: a singular noun after “this”, and a plural noun after “these”.';
    formula = 'This is + singular noun · These are + plural noun';
    tip = 'This is my dress. / These are my shoes.';
    exampleList.splice(0, exampleList.length, 'This is my dress.', 'These are my shoes.');
  } else if (/adjectives: opposites/.test(text)) {
    title = 'Using adjectives and their opposites';
    explanation = 'Adjectives describe people, animals and things. Opposite adjectives give contrasting meanings. After “be”, use the adjective without adding -ly.';
    formula = 'subject + am / is / are + adjective';
    tip = 'The clown is funny and short. / The giraffe is tall.';
    exampleList.splice(0, exampleList.length, 'The clown is funny and short.', 'The giraffe is tall.', 'The old man is kind.');
  } else if (/animal classification|animal.*traits/.test(text)) {
    title = 'Describing animal groups and features';
    explanation = 'Use the present simple to state scientific facts. Use “are” to classify a group and “have” to describe features shared by animals.';
    formula = 'animal + is / are + group · animal + has / have + feature';
    tip = 'Lions and camels are mammals. / Fish and reptiles have scales.';
    exampleList.splice(0, exampleList.length, 'Lions and camels are mammals.', 'Snakes and lizards are reptiles.', 'Fish and reptiles have scales.');
  } else if (/geography|landscapes/.test(text)) {
    title = 'Describing places and landscapes';
    explanation = 'Use “be” with an adjective to describe a place. Use “there is” for one feature and “there are” for more than one.';
    formula = 'place + is / are + adjective · There is / There are + feature';
    tip = 'Mount Sinai is majestic. / The Nile Valley is fertile.';
    exampleList.splice(0, exampleList.length, 'Mount Sinai is majestic.', 'The Nile Valley is fertile.', 'The Nile River is long.');
  } else if (/nutrition|body needs/.test(text)) {
    title = 'Talking about food and healthy needs';
    explanation = 'Use “need” to say what the body requires. Use “should” for helpful advice and “shouldn’t” for advice against something.';
    formula = 'subject + need(s) + noun · subject + should / shouldn’t + base verb';
    tip = 'Your body needs water. / You should eat vegetables.';
    exampleList.splice(0, exampleList.length, 'Your body needs water.', 'You should eat vegetables.', 'You shouldn’t skip breakfast.');
  } else if (/good at \/ bad at|good at|bad at/.test(text)) {
    title = 'Saying what you are good or bad at';
    explanation = 'Use “good at” or “bad at” before a noun or an activity ending in -ing. After “am”, “is” or “are”, keep the phrase “good at” together.';
    formula = 'am / is / are + good at / bad at + noun or verb-ing';
    tip = 'I am good at playing squash. / I am bad at tennis.';
    exampleList.splice(0, exampleList.length, 'I am good at playing squash.', 'I am bad at tennis.');
  } else if (/could \/ couldn't|past ability/.test(text)) {
    title = 'Talking about ability in the past';
    explanation = 'Use “could” for an ability someone had in the past and “couldn’t” for an ability they did not have. Follow both forms with the base verb.';
    formula = 'subject + could / couldn’t + base verb';
    tip = 'When I was six, I couldn’t swim. / My sister could ride a bike.';
    exampleList.splice(0, exampleList.length, 'When I was six, I couldn’t swim.', 'My sister could ride a bike.');
  } else if (/present simple.*scientific life cycles|present simple for rural life|scientific facts about astronomy|food chains|present simple for natural cycles/.test(text)) {
    title = 'Using the present simple for facts';
    explanation = 'Use the present simple for scientific facts, natural processes and regular activities. Add -s or -es to the verb with he, she or it; use the base form with plural subjects.';
    formula = 'singular subject + verb-s / -es · plural subject + base verb';
    tip = 'The caterpillar eats leaves. / Planets orbit the sun. / Water evaporates when heated.';
    exampleList.splice(0, exampleList.length, 'The caterpillar eats leaves.', 'Planets orbit the sun.', 'Water evaporates when heated.');
  } else if (/past simple.*historical achievements/.test(text)) {
    title = 'Describing events in history';
    explanation = 'Use the past simple for completed events in the past. Regular verbs usually end in -ed; irregular verbs have special past forms such as “built”, “went” and “made”.';
    formula = 'subject + past form of the verb';
    tip = 'Ancient Egyptians built the pyramids. / Saladin built the Citadel.';
    exampleList.splice(0, exampleList.length, 'Ancient Egyptians built the pyramids.', 'Saladin built the Citadel.');
  } else if (/describing amusement parks/.test(text)) {
    title = 'Describing places and attractions';
    explanation = 'Use “there is” with one attraction and “there are” with more than one. Add adjectives to describe what an attraction is like.';
    formula = 'There is + singular noun · There are + plural noun';
    tip = 'There is a tall Ferris wheel. / There are exciting rides.';
    exampleList.splice(0, exampleList.length, 'There is a tall Ferris wheel.', 'There are exciting rides.');
  } else if (/present simple: to be.*nationalities/.test(text)) {
    title = 'Using be to introduce people and nationalities';
    explanation = 'Use “am” with I, “is” with he, she or it, and “are” with you, we or they. Nationality words begin with a capital letter in English.';
    formula = 'I am · He / She is · You / We / They are + nationality';
    tip = 'I am Egyptian. / They are Egyptian.';
    exampleList.splice(0, exampleList.length, 'I am Egyptian.', 'She is Egyptian.', 'They are Egyptian.');
  } else if (/expressing professions|daily tasks/.test(text)) {
    title = 'Describing jobs and daily tasks';
    explanation = 'Use the present simple to describe what people do as part of their jobs. With he, she or a singular job title, add -s or -es to most verbs.';
    formula = 'a / the + job + verb-s / -es';
    tip = 'A carpenter makes furniture. / A potter shapes clay.';
    exampleList.splice(0, exampleList.length, 'A carpenter makes furniture.', 'A potter shapes clay.', 'A tour guide shows visitors landmarks.');
  } else if (/functions of bodily systems/.test(text)) {
    title = 'Describing body functions and giving advice';
    explanation = 'Use the present simple for body functions and facts. Use “can” for ability and “should” or “must” when giving advice or explaining what is necessary.';
    formula = 'body system + verb-s · should / must / can + base verb';
    tip = 'The heart pumps blood. / You should drink enough water.';
    exampleList.splice(0, exampleList.length, 'The heart pumps blood.', 'You should drink enough water.');
  } else if (/conditionals.*cause and effect|cause and effect/.test(text)) {
    title = 'Showing causes and results';
    explanation = 'Use “if” or “when” to introduce a condition or cause. Use “as a result” or “therefore” to introduce the result. Keep the verb tense consistent with the meaning.';
    formula = 'if / when + condition, result · cause. As a result, + effect.';
    tip = 'If we save energy, we reduce pollution. / We saved energy; therefore, we reduced pollution.';
    exampleList.splice(0, exampleList.length, 'If we save energy, we reduce pollution.', 'We saved energy; therefore, we reduced pollution.');
  } else if (/causative verbs/.test(text)) {
    title = 'Saying that someone arranges a service';
    explanation = 'Use the causative when someone arranges for another person to do a job. The person arranging the service is the subject; the object receives the action.';
    formula = 'have / get + object + past participle';
    tip = 'They had the coral reefs mapped. / She got her bicycle repaired.';
    exampleList.splice(0, exampleList.length, 'They had the coral reefs mapped.', 'She got her bicycle repaired.');
  } else if (/these are my|plural demonstrative/.test(text)) {
    title = 'Introducing more than one person or thing';
    explanation = 'Use “These are my …” when you introduce two or more people or things. “These” points to a group nearby, “are” agrees with the plural subject, and “my” shows that the people or things belong to you. For one person or thing, use “This is my …”.';
    formula = 'These are my + plural noun · This is my + singular noun';
    tip = 'These are my parents. / These are my grandparents. One person: This is my cousin.';
    exampleList.splice(0, exampleList.length, 'These are my parents.', 'These are my grandparents.', 'This is my cousin.');
  } else if (/this is my|introducing people/.test(text)) {
    title = 'Talking about one person or thing';
    explanation = 'Use “This is my …” to introduce one person or one thing. “This” points to one thing, “is” is the verb, and “my” shows that it belongs to you.';
    formula = 'This is my + one person or thing';
    tip = 'Use a singular noun after “my”: This is my brother. / This is my book.';
  } else if (/imperative|verb in stem|rules \(must/.test(text)) {
    title = 'Giving instructions';
    explanation = 'An instruction usually starts with the base form of the verb. Do not add -s or -ing to the verb at the beginning.';
    formula = 'Base verb + the rest of the instruction';
    tip = 'Wash your hands. / Touch your nose. For a negative instruction, use “Don’t” + base verb.';
  } else if (/a vs an|indefinite article/.test(text)) {
    title = 'Choosing a or an';
    explanation = 'Use “a” before a consonant sound and “an” before a vowel sound. Listen to the first sound, not only the first letter.';
    formula = 'a + consonant sound · an + vowel sound';
    tip = 'a banana, a university, an apple, an orange.';
  } else if (/in vs on|prepositions of place/.test(text)) {
    title = 'Describing place';
    explanation = 'A preposition tells us where something is. “Next to” means beside something; “behind” means at the back of something. “In” means inside, while “on” means touching a surface. Put the preposition before the place or object it describes.';
    formula = 'subject + am / is / are + preposition + place';
    tip = 'The bakery is next to the school. / The park is behind the supermarket.';
    exampleList.splice(0, exampleList.length, 'The bakery is next to the school.', 'The park is behind the supermarket.', 'The book is in the bag.');
  } else if (/ability|can \+|modal verbs: can|could \/ couldn't/.test(text)) {
    title = 'Talking about ability';
    explanation = 'Use “can” before the base form of a verb to say what someone is able to do. The verb after can does not take -s or -ing.';
    formula = 'Subject + can / can’t + base verb';
    tip = 'I can swim. / She can’t fly.';
  } else if (/there is \/ there are|there is/.test(text)) {
    title = 'Saying that something exists';
    explanation = 'Use “There is” with one thing and “There are” with more than one thing.';
    formula = 'There is + singular noun · There are + plural noun';
    tip = 'There is a book. / There are two books.';
  } else if (/demonstratives|this \/ that \/ these \/ those/.test(text)) {
    title = 'Choosing this, that, these or those';
    explanation = 'Use “this” for one thing near you, “that” for one thing farther away, “these” for more than one thing near you, and “those” for more than one thing farther away.';
    formula = 'this = one near · that = one far · these = many near · those = many far';
    tip = 'This is my pen. / Those are my books.';
  } else if (/past perfect/.test(text)) {
    title = 'Showing which past action happened first';
    explanation = 'Use the past perfect for an action completed before another past action. Use the past simple for the later past event.';
    formula = 'had + past participle · later event: past simple';
    tip = 'The train had left before we arrived.';
  } else if (/past continuous|past simple vs past continuous/.test(text)) {
    title = 'Describing an action in progress in the past';
    explanation = 'Use the past continuous for an action that was happening at a particular time. Use the past simple for a shorter finished action that happened during it.';
    formula = 'was / were + verb-ing · past simple for the interrupting action';
    tip = 'I was reading when the phone rang. / While they were playing, it started to rain.';
  } else if (/passive voice/.test(text)) {
    title = 'Using the passive voice';
    explanation = 'Use the passive when the action or its result is more important than the person who does it. Make the object the subject, then use the correct form of “be” and the past participle.';
    formula = 'subject + be + past participle';
    tip = 'People grow rice. → Rice is grown. / The team built the bridge. → The bridge was built.';
  } else if (/relative pronouns|relative clauses/.test(text)) {
    title = 'Joining ideas with relative clauses';
    explanation = 'A relative clause gives more information about a person, thing or place. Use “who” for people, “which” for things and “where” for places. “Whose” shows possession.';
    formula = 'person + who · thing + which · place + where · possession + whose';
    tip = 'A doctor is a person who helps sick people. / This is the town where I live.';
  } else if (/reported speech/.test(text)) {
    title = 'Reporting what someone said';
    explanation = 'Reported speech tells us what a person said without repeating the exact words. The tense and pronouns may change to match the reporting sentence.';
    formula = 'said (that) + reported message';
    tip = '“I am tired,” Ali said. → Ali said that he was tired.';
  } else if (/quantifiers|some in affirmative|some.*any/.test(text)) {
    title = 'Choosing some or any';
    explanation = 'Use “some” most often in positive sentences and offers or requests. Use “any” most often in questions and negative sentences.';
    formula = 'some + plural / uncountable noun · any in questions and negatives';
    tip = 'There are some apples. / Are there any apples? / There isn’t any milk.';
  } else if (/adverbs of frequency/.test(text)) {
    title = 'Saying how often something happens';
    explanation = 'Adverbs of frequency tell us how often we do something. They usually come before the main verb, but after the verb “be”.';
    formula = 'subject + always / usually / often / sometimes / never + main verb';
    tip = 'I usually walk to school. / She is always kind.';
  } else if (/apostrophe|possession with/.test(text)) {
    title = 'Showing ownership with ’s';
    explanation = 'Add ’s to a singular owner to show that something belongs to that person. For a regular plural noun ending in s, add only an apostrophe.';
    formula = 'one owner + ’s + thing · plural owner ending in s + ’';
    tip = 'Mona’s bag / the students’ books.';
  } else if (/adjective ordering/.test(text)) {
    title = 'Putting adjectives in order';
    explanation = 'When several adjectives come before a noun, they usually follow a natural order. Opinion comes before size, age, shape, colour, origin, material and purpose.';
    formula = 'opinion → size → age → shape → colour → origin → material → noun';
    tip = 'a lovely small old wooden box.';
  } else if (/conjunctions|and vs but/.test(text)) {
    title = 'Joining ideas with and or but';
    explanation = 'Use “and” to add similar information. Use “but” to join two ideas that contrast or are different.';
    formula = 'idea 1 + and / but + idea 2';
    tip = 'I like apples and bananas. / I like tea, but I don’t like coffee.';
  } else if (/adverbs of degree/.test(text)) {
    title = 'Making adjectives stronger or softer';
    explanation = 'Adverbs of degree tell us how strong an adjective or action is. “Very” and “extremely” make the meaning stronger; “quite” can make it less strong.';
    formula = 'adverb of degree + adjective';
    tip = 'The water is very cold. / The test was quite easy.';
  } else if (/prepositions of movement/.test(text)) {
    title = 'Describing movement';
    explanation = 'Prepositions of movement show the direction or path of movement from one place to another.';
    formula = 'movement verb + preposition + destination';
    tip = 'Walk across the road. / The cat jumped onto the chair.';
  } else if (/modal verbs of possibility|modals of deduction/.test(text)) {
    title = 'Expressing possibility and deduction';
    explanation = 'Use “may”, “might” or “could” when something is possible but not certain. Use “must” for a strong logical conclusion and “can’t” when something seems impossible.';
    formula = 'modal verb + base verb';
    tip = 'It might rain. / She must be at home. / That can’t be true.';
  } else if (/will & going to|future with will/.test(text)) {
    title = 'Choosing will or going to';
    explanation = 'Use “will” for a decision made now or a prediction. Use “be going to” for a plan already made or a prediction based on what you can see.';
    formula = 'will + base verb · am / is / are going to + base verb';
    tip = 'I’ll answer the phone. / Look at those clouds! It is going to rain.';
  } else if (/has got|have got/.test(text)) {
    title = 'Talking about possession';
    explanation = 'Use “have got” with I, you, we and they, but “has got” with he, she and it. The form stays the same before the thing someone owns. In negatives, use “haven’t got” or “hasn’t got”. In questions, move “have” or “has” before the subject.';
    formula = 'I / You / We / They have got + noun · He / She / It has got + noun';
    tip = 'I have got a new bag. / She has got curly hair. / Have they got a cousin?';
    exampleList.splice(0, exampleList.length, 'I have got a new bag.', 'She has got curly hair.', 'Have they got a cousin?');
  } else if (/like \+ verb-ing/.test(text)) {
    title = 'Talking about likes';
    explanation = 'When an action follows “like”, use the -ing form of the verb.';
    formula = 'like / likes + verb-ing';
    tip = 'I like reading. / He likes playing football.';
  } else if (/comparative.*superlative|superlative.*comparative/.test(text)) {
    title = 'Comparing two things and comparing a whole group';
    explanation = 'Use a comparative to compare two things, often with “than”. Use a superlative to identify the top or bottom member of a group, usually with “the”.';
    formula = 'comparative: -er / more + adjective + than · superlative: the -est / the most + adjective';
    tip = 'Mona is taller than Ali. / Mona is the tallest student in the class.';
  } else if (/comparative/.test(text)) {
    title = 'Comparing two things';
    explanation = 'A comparative adjective compares two people or things. Short adjectives often take -er; longer adjectives often use “more”.';
    formula = 'adjective-er + than · more + adjective + than';
    tip = 'A tiger is faster than a cat. / This book is more interesting than that one.';
  } else if (/superlative/.test(text)) {
    title = 'Comparing three or more things';
    explanation = 'A superlative describes the top or bottom of a group. Short adjectives often use -est; longer adjectives often use “the most”.';
    formula = 'the + adjective-est · the most + adjective';
    tip = 'the tallest tree / the most beautiful place.';
  } else if (/present simple/.test(text)) {
    title = 'Using the present simple';
    explanation = 'Use the present simple for routines and facts. With he, she or it, most verbs add -s or -es. Use the base form with I, you, we and they.';
    formula = 'I / You / We / They + base verb · He / She / It + verb-s';
    tip = 'I play every day. / She plays every day.';
  } else if (/past simple/.test(text)) {
    title = 'Talking about the past';
    explanation = 'Use the past simple for a finished action in the past. Regular verbs often end in -ed; irregular verbs have their own past forms.';
    formula = 'Subject + past form of the verb';
    tip = 'We visited Luxor. / She went to school.';
  } else if (/future|going to|future plans/.test(text)) {
    title = 'Talking about future plans';
    explanation = 'Use “be going to” before the base verb for a plan or intention.';
    formula = 'am / is / are + going to + base verb';
    tip = 'I am going to study. / They are going to travel.';
  } else if (/should/.test(text)) {
    title = 'Giving advice';
    explanation = 'Use “should” for a good idea and “shouldn’t” for advice not to do something. Follow it with the base form of the verb.';
    formula = 'should / shouldn’t + base verb';
    tip = 'You should sleep early. / You shouldn’t eat too much sugar.';
  } else if (/zero & first conditional/.test(text)) {
    title = 'Using zero and first conditionals';
    explanation = 'Use the zero conditional for facts and results that are generally true. Use the first conditional for a real future possibility.';
    formula = 'zero: if + present, present · first: if + present, will + base verb';
    tip = 'If you heat ice, it melts. / If it rains, we will stay inside.';
  } else if (/second conditional/.test(text)) {
    title = 'Imagining an unlikely or unreal situation';
    explanation = 'Use the second conditional to imagine a present or future situation that is unlikely or unreal.';
    formula = 'If + past simple, would + base verb';
    tip = 'If I had wings, I would fly.';
  } else if (/third conditional/.test(text)) {
    title = 'Imagining a different past';
    explanation = 'Use the third conditional to imagine a past situation that did not happen and its imagined result.';
    formula = 'If + past perfect, would have + past participle';
    tip = 'If we had left earlier, we would have caught the bus.';
  } else if (/conditionals/.test(text)) {
    title = 'Using if sentences';
    explanation = 'An if-clause describes a condition. The other clause tells us the result. The verb forms change according to whether we mean a fact, a real possibility or an imaginary situation.';
    formula = 'If + condition, result';
    tip = 'Read both parts together and check the time and meaning before choosing the verb form.';
  }
  return { title, explanation, formula, tip, examples: exampleList };
}

function renderImportedPrimaryCurriculum() {
  if (state.stage !== 'primary' || !['general', 'advanced'].includes(state.path)) return '';
  const track = primaryHtmlCurriculum.tracks.find((item) => item.id === state.path);
  const grade = track?.grades.find((item) => item.grade === state.grade);
  if (!grade) return '';
  const unit = grade.units.find((item) => item.number === Number(state.importedUnitNumber));
  // Render the unit list before accessing any unit-specific fields.
  // On a fresh launch there is no selected unit yet.
  if (!unit) {
    return '<section class="panel imported-curriculum"><div class="section-heading"><div><p class="eyebrow">PRIMARY 2026/2027 · ' + escapeHtml(track.name) + '</p><h2>Grade ' + grade.grade + ' · Units</h2><p class="unit-source-note">Select a unit to open its own learning dashboard.</p></div><span class="book-count">' + grade.units.length + ' units</span></div><div class="imported-unit-list">' +
      grade.units.map((item) => '<button type="button" class="imported-unit-card imported-unit-button" data-imported-unit="' + item.number + '"><span class="imported-unit-number">UNIT ' + item.number + '</span><strong>' + escapeHtml(item.title) + '</strong><span>' + item.vocabulary.length + ' words · ' + item.examQuestions.length + ' exam questions</span><b>Open unit ›</b></button>').join('') + '</div></section>';
  }
  const unitWords = unit?.vocabulary || [];
  const choiceOptions = (answer, index = 0, limit = 4) => {
    const pool = unitWords.map((item) => item.en).filter((word) => word && word.toLowerCase() !== String(answer).toLowerCase());
    const distractors = [];
    for (let step = 0; step < pool.length && distractors.length < limit - 1; step++) {
      const word = pool[(index + step * 3) % pool.length];
      if (word && !distractors.includes(word)) distractors.push(word);
    }
    return [answer, ...distractors];
  };
  const grammarDistractors = {
    my: ['your', 'his', 'her'], your: ['my', 'his', 'her'], his: ['her', 'my', 'their'], her: ['his', 'my', 'their'],
    is: ['are', 'am', 'be'], are: ['is', 'am', 'be'], am: ['is', 'are', 'be'], have: ['has', 'had', 'are'], has: ['have', 'had', 'is'],
    this: ['that', 'these', 'those'], these: ['this', 'that', 'those'], that: ['this', 'these', 'those'], those: ['these', 'this', 'that'],
    a: ['an', 'the', 'some'], an: ['a', 'the', 'some'], in: ['on', 'under', 'behind'], on: ['in', 'under', 'behind'],
    can: ['could', 'must', 'are'], will: ['would', 'is', 'has'], who: ['which', 'where', 'whose'], which: ['who', 'where', 'whose'],
    was: ['were', 'is', 'are'], were: ['was', 'is', 'are'], had: ['has', 'have', 'is'],
    next: ['behind', 'between', 'under'], behind: ['next to', 'in front of', 'between'],
    happy: ['sad', 'angry', 'tired'], cold: ['headache', 'fever', 'cough'], rises: ['rise', 'rising', 'rose'],
    mammals: ['reptiles', 'amphibians', 'birds'], majestic: ['fertile', 'vast', 'narrow'], needs: ['need', 'needing', 'needed'],
    eats: ['eat', 'eating', 'ate'], am: ['is', 'are', 'be'], makes: ['make', 'making', 'made'],
    mapped: ['map', 'mapping', 'maps'], reduce: ['reduces', 'reduced', 'reducing'], "o'clock": ['clock', 'hour', 'minutes']
  };
  const makeCloze = (sentence, index, prefix, targetOverride = null) => {
    const tokens = String(sentence || '').match(/[A-Za-z][A-Za-z']*/g) || [];
    if (!tokens.length) return null;
    const targetWord = targetOverride || tokens[Math.min(tokens.length - 1, Math.max(0, Math.floor(tokens.length / 2)))];
    const rawSentence = String(sentence);
    const targetAt = rawSentence.toLowerCase().indexOf(String(targetWord).toLowerCase());
    const prompt = targetAt >= 0 ? rawSentence.slice(0, targetAt) + '____' + rawSentence.slice(targetAt + String(targetWord).length) : rawSentence;
    const grammarOptions = grammarDistractors[String(targetWord).toLowerCase()];
    const options = /grammar/i.test(prefix) && grammarOptions ? [targetWord, ...grammarOptions] : choiceOptions(targetWord, index);
    return { q: prefix + prompt, opts: options, ans: 0 };
  };
  const sourceGrammarExamples = (unit?.grammar?.examples || []).filter((example) => !/(key pattern|verification|correct structure|incorrect syntax)/i.test(String(example)));
  const grammarLesson = explainGrammarRule(unit?.grammar?.rule, sourceGrammarExamples);
  const grammarLessonExamples = grammarLesson.examples.length ? grammarLesson.examples : unitWords.map((word) => word.ex).filter(Boolean).slice(0, 3);
  const grammarPractice = [...(unit?.grammar?.quiz || []).filter((item) => !/(verification|application check|key pattern|correct structure|incorrect syntax)/i.test(String(item.q || '')))];
  const grammarRuleText = String(unit?.grammar?.rule || '').toLowerCase();
  const grammarQuestionSets = [
    [/expressing feelings|i feel \+ adjective/, [
      { q: 'How do you feel today? I feel ___.', opts: ['happy', 'happily', 'happiness'], ans: 0 },
      { q: 'She ___ excited.', opts: ['feels', 'feel', 'feeling'], ans: 0 },
      { q: 'I feel ___ after a good rest.', opts: ['better', 'wellness', 'bestly'], ans: 0 }
    ]],
    [/expressing illness|i have a \+ illness/, [
      { q: 'I have a ___.', opts: ['cold', 'coldly', 'colder'], ans: 0 },
      { q: 'She ___ a headache.', opts: ['has', 'have', 'having'], ans: 0 },
      { q: 'They ___ a cough.', opts: ['have', 'has', 'having'], ans: 0 }
    ]],
    [/giving directions/, [
      { q: '___ straight at the next street.', opts: ['Go', 'Goes', 'Going'], ans: 0 },
      { q: 'Turn ___ at the traffic lights.', opts: ['left', 'between', 'under'], ans: 0 },
      { q: '___ right to reach the station.', opts: ['Turn', 'Turns', 'Turning'], ans: 0 }
    ]],
    [/telling time/, [
      { q: 'It is seven ___.', opts: ["o'clock", 'clock', 'hours'], ans: 0 },
      { q: 'School starts ___ eight o’clock.', opts: ['at', 'in', 'on'], ans: 0 },
      { q: 'What time is it? It ___ nine o’clock.', opts: ['is', 'are', 'am'], ans: 0 }
    ]],
    [/day and night routines/, [
      { q: 'The sun ___ in the morning.', opts: ['rises', 'rise', 'rising'], ans: 0 },
      { q: 'Stars ___ at night.', opts: ['appear', 'appears', 'appearing'], ans: 0 },
      { q: 'The moon ___ at night.', opts: ['shines', 'shine', 'shining'], ans: 0 }
    ]],
    [/animal classification|animal.*traits/, [
      { q: 'Lions and camels are ___.', opts: ['mammals', 'reptiles', 'amphibians'], ans: 0 },
      { q: 'Fish and reptiles ___ scales.', opts: ['have', 'has', 'having'], ans: 0 },
      { q: 'A frog is an ___.', opts: ['amphibian', 'mammal', 'reptile'], ans: 0 }
    ]],
    [/geography|landscapes/, [
      { q: 'Mount Sinai is ___.', opts: ['majestic', 'majestically', 'majesty'], ans: 0 },
      { q: 'The Nile Valley ___ fertile.', opts: ['is', 'are', 'am'], ans: 0 },
      { q: 'There ___ a river in the valley.', opts: ['is', 'are', 'be'], ans: 0 }
    ]],
    [/nutrition|body needs/, [
      { q: 'Your body ___ water every day.', opts: ['needs', 'need', 'needing'], ans: 0 },
      { q: 'You ___ eat vegetables.', opts: ['should', 'should to', 'shoulds'], ans: 0 },
      { q: 'You ___ skip breakfast.', opts: ["shouldn't", 'should', 'must to'], ans: 0 }
    ]],
    [/present simple.*scientific life cycles|present simple for rural life|scientific facts about astronomy|food chains|present simple for natural cycles/, [
      { q: 'The caterpillar ___ leaves.', opts: ['eats', 'eat', 'eating'], ans: 0 },
      { q: 'Planets ___ the sun.', opts: ['orbit', 'orbits', 'orbiting'], ans: 0 },
      { q: 'A predator ___ its prey.', opts: ['eats', 'eat', 'eating'], ans: 0 }
    ]],
    [/present simple: to be.*nationalities/, [
      { q: 'I ___ Egyptian.', opts: ['am', 'is', 'are'], ans: 0 },
      { q: 'She ___ Egyptian.', opts: ['is', 'am', 'are'], ans: 0 },
      { q: 'They ___ Egyptian.', opts: ['are', 'is', 'am'], ans: 0 }
    ]],
    [/expressing professions|daily tasks/, [
      { q: 'A carpenter ___ furniture.', opts: ['makes', 'make', 'making'], ans: 0 },
      { q: 'A potter ___ clay.', opts: ['shapes', 'shape', 'shaping'], ans: 0 },
      { q: 'Tour guides ___ visitors around landmarks.', opts: ['show', 'shows', 'showing'], ans: 0 }
    ]],
    [/causative verbs/, [
      { q: 'They had the coral reefs ___.', opts: ['mapped', 'map', 'mapping'], ans: 0 },
      { q: 'She got her bicycle ___.', opts: ['repaired', 'repair', 'repairing'], ans: 0 },
      { q: 'Have + object + past ___.', opts: ['participle', 'present', 'infinitive'], ans: 0 }
    ]],
    [/conditionals.*cause and effect|cause and effect/, [
      { q: 'If we save energy, we ___ pollution.', opts: ['reduce', 'reduces', 'reduced'], ans: 0 },
      { q: 'If water reaches 100°C, it ___.', opts: ['boils', 'boil', 'boiling'], ans: 0 },
      { q: 'We planted trees. As a result, the air ___.', opts: ['improved', 'improve', 'improving'], ans: 0 }
    ]],
    [/has got|have got/, [
      { q: 'She ___ got curly hair.', opts: ['has', 'have', 'is'], ans: 0 },
      { q: 'They ___ got two cousins.', opts: ['have', 'has', 'are'], ans: 0 },
      { q: 'I ___ got a new bag.', opts: ['have', 'has', 'am'], ans: 0 },
      { q: '___ he got glasses?', opts: ['Has', 'Have', 'Does'], ans: 0 },
      { q: 'We ___ got a big family.', opts: ['have', 'has', 'is'], ans: 0 }
    ]],
    [/prepositions.*(place|next to|behind)|in vs on/, [
      { q: 'The bakery is ___ to the school.', opts: ['next', 'behind', 'under'], ans: 0 },
      { q: 'The park is ___ the supermarket.', opts: ['behind', 'between', 'on'], ans: 0 },
      { q: 'The book is ___ the bag.', opts: ['in', 'next', 'behind'], ans: 0 },
      { q: 'The picture is ___ the wall.', opts: ['on', 'in', 'between'], ans: 0 }
    ]],
    [/these are my|plural demonstrative/, [
      { q: '___ are my parents.', opts: ['These', 'This', 'That'], ans: 0 },
      { q: 'These ___ my grandparents.', opts: ['are', 'is', 'am'], ans: 0 },
      { q: 'These are my ___.', opts: ['friends', 'friend', 'friendly'], ans: 0 },
      { q: 'This is my ___.', opts: ['cousin', 'cousins', 'cousin are'], ans: 0 }
    ]],
    [/this is my|demonstrative/, [
      { q: '___ is my book.', opts: ['This', 'These', 'Those'], ans: 0 },
      { q: 'This ___ my teacher.', opts: ['is', 'are', 'am'], ans: 0 },
      { q: 'This is ___ bag.', opts: ['my', 'me', 'I'], ans: 0 },
      { q: '___ are my parents.', opts: ['These', 'This', 'That'], ans: 0 }
    ]],
    [/imperative|verb in stem/, [
      { q: '___ your hands.', opts: ['Wash', 'Washing', 'Washes'], ans: 0 },
      { q: '___ run in the classroom.', opts: ["Don't", "Doesn't", 'Not'], ans: 0 },
      { q: '___ your book, please.', opts: ['Open', 'Opens', 'Opening'], ans: 0 }
    ]],
    [/a vs an|indefinite articles/, [
      { q: 'I have ___ apple.', opts: ['an', 'a', 'the'], ans: 0 },
      { q: 'This is ___ bag.', opts: ['a', 'an', 'the'], ans: 0 },
      { q: 'She has ___ orange.', opts: ['an', 'a', 'the'], ans: 0 }
    ]],
    [/there is \/ there are|there is|there are/, [
      { q: 'There ___ a book on the desk.', opts: ['is', 'are', 'am'], ans: 0 },
      { q: 'There ___ two pencils in the bag.', opts: ['are', 'is', 'am'], ans: 0 },
      { q: '___ there a park near here?', opts: ['Is', 'Are', 'Do'], ans: 0 }
    ]],
    [/ability|can \+|modal verbs: can/, [
      { q: 'She can ___.', opts: ['swim', 'swims', 'swimming'], ans: 0 },
      { q: 'I ___ play football.', opts: ['can', 'cans', 'am'], ans: 0 },
      { q: 'He can ___ a ball.', opts: ['kick', 'kicks', 'kicking'], ans: 0 }
    ]],
    [/present simple/, [
      { q: 'He ___ to school every day.', opts: ['goes', 'go', 'going'], ans: 0 },
      { q: 'They ___ football on Fridays.', opts: ['play', 'plays', 'playing'], ans: 0 },
      { q: 'She ___ her teeth every morning.', opts: ['brushes', 'brush', 'brushing'], ans: 0 }
    ]],
    [/past simple/, [
      { q: 'Yesterday, we ___ to the park.', opts: ['went', 'go', 'goes'], ans: 0 },
      { q: 'She ___ her homework last night.', opts: ['finished', 'finish', 'finishes'], ans: 0 },
      { q: 'They ___ a museum last week.', opts: ['visited', 'visit', 'visits'], ans: 0 }
    ]],
    [/comparative/, [
      { q: 'A tiger is ___ than a cat.', opts: ['faster', 'fastest', 'fast'], ans: 0 },
      { q: 'This book is ___ interesting than that one.', opts: ['more', 'most', 'many'], ans: 0 },
      { q: 'My bag is ___ than yours.', opts: ['heavier', 'heaviest', 'heavy'], ans: 0 }
    ]],
    [/superlative/, [
      { q: 'The Nile is one of the ___ rivers in the world.', opts: ['longest', 'longer', 'long'], ans: 0 },
      { q: 'This is the ___ picture in the class.', opts: ['most beautiful', 'more beautiful', 'beautiful'], ans: 0 },
      { q: 'Mona is the ___ student in her team.', opts: ['tallest', 'taller', 'tall'], ans: 0 }
    ]],
    [/passive voice/, [
      { q: 'The bridge ___ built in 2020.', opts: ['was', 'were', 'are'], ans: 0 },
      { q: 'Rice ___ grown in Egypt.', opts: ['is', 'are', 'be'], ans: 0 },
      { q: 'The letters ___ delivered yesterday.', opts: ['were', 'was', 'is'], ans: 0 }
    ]],
    [/conditionals/, [
      { q: 'If you heat ice, it ___.', opts: ['melts', 'melt', 'will melted'], ans: 0 },
      { q: 'If it rains tomorrow, we ___ stay at home.', opts: ['will', 'would', 'are'], ans: 0 },
      { q: 'If I had more time, I ___ learn French.', opts: ['would', 'will', 'am'], ans: 0 }
    ]],
    [/future plans|going to/, [
      { q: 'She is going to ___ for her test.', opts: ['study', 'studies', 'studying'], ans: 0 },
      { q: 'They are going to ___ tomorrow.', opts: ['travel', 'travels', 'travelled'], ans: 0 },
      { q: 'I am ___ to visit my aunt.', opts: ['going', 'go', 'goes'], ans: 0 }
    ]],
    [/relative pronouns|relative clauses/, [
      { q: 'A doctor is a person ___ helps people.', opts: ['who', 'which', 'where'], ans: 0 },
      { q: 'This is the school ___ I study.', opts: ['where', 'who', 'whose'], ans: 0 },
      { q: 'A laptop is a device ___ stores information.', opts: ['which', 'who', 'where'], ans: 0 }
    ]],
    [/past perfect/, [
      { q: 'The train ___ left before we arrived.', opts: ['had', 'has', 'have'], ans: 0 },
      { q: 'She had ___ dinner before the guests came.', opts: ['cooked', 'cook', 'cooking'], ans: 0 },
      { q: 'After they had finished, they ___ home.', opts: ['went', 'go', 'going'], ans: 0 }
    ]],
    [/reported speech/, [
      { q: 'Ali said that he ___ tired.', opts: ['was', 'is', 'am'], ans: 0 },
      { q: 'Mona said that she ___ the answer.', opts: ['knew', 'knows', 'know'], ans: 0 },
      { q: 'He said that he ___ help us.', opts: ['would', 'will', 'can'], ans: 0 }
    ]]
  ];
  const matchingGrammarSet = grammarQuestionSets.find(([pattern]) => pattern.test(grammarRuleText));
  if (matchingGrammarSet) {
    matchingGrammarSet[1].forEach((question) => {
      if (!grammarPractice.some((item) => item.q === question.q)) grammarPractice.push(question);
    });
  }
  grammarLessonExamples.slice(0, 2).forEach((example, index) => {
    const question = makeCloze(example, index + 1, 'Complete the grammar example: ');
    if (question) grammarPractice.push(question);
  });
  const grammarExampleSource = grammarLessonExamples[0] || '';
  const grammarTargets = [...new Set(unitWords.map((item) => item.en).filter((word) =>
    word && grammarLessonExamples.some((example) => String(example).toLowerCase().includes(String(word).toLowerCase()))
  ))];
  grammarTargets.forEach((target, index) => {
    if (grammarPractice.length >= 8) return;
    const sentence = grammarLessonExamples.find((example) => String(example).toLowerCase().includes(String(target).toLowerCase()));
    const question = makeCloze(sentence, index + 4, 'Choose the word that completes the grammar example: ', target);
    if (question && !grammarPractice.some((item) => item.q === question.q)) grammarPractice.push(question);
  });
  const grammarTokens = String(grammarExampleSource).match(/[A-Za-z][A-Za-z']*/g) || [];
  while (grammarPractice.length < 3 && grammarTokens.length) {
    const target = grammarTokens[grammarPractice.length % grammarTokens.length];
    const question = makeCloze(grammarExampleSource, grammarPractice.length, 'Complete the grammar example: ', target);
    if (question) grammarPractice.push(question);
    else break;
  }
  const readingSentences = String(unit?.readingText || '').split(/(?<=[.!?])\s+/).filter(Boolean);
  const readingPractice = [];
  const readingTargets = unitWords.map((item) => item.en).filter((word) => word && String(unit?.readingText || '').toLowerCase().includes(word.toLowerCase()));
  const passageWords = (String(unit?.readingText || '').match(/[A-Za-z][A-Za-z']*/g) || []).filter((word, index, all) => all.findIndex((x) => x.toLowerCase() === word.toLowerCase()) === index);
  const readingPool = [...readingTargets, ...passageWords.filter((word) => !readingTargets.some((x) => x.toLowerCase() === word.toLowerCase()))].slice(0, 5);
  readingPool.forEach((word, index) => {
    const sentence = readingSentences.find((line) => line.toLowerCase().includes(word.toLowerCase())) || unit.readingText || '';
    const question = makeCloze(sentence, index, 'Complete the reading sentence: ', word);
    if (question) readingPractice.push(question);
  });
  const listeningPractice = unitWords.slice(0, 5).map((word, index) => ({
    q: 'Listen to the word and choose the matching English word.',
    audio: word.en,
    opts: choiceOptions(word.en, index),
    ans: 0
  }));
  const speakingPrompts = unitWords.slice(0, 10).map((word, index) => ({
    prompt: index % 2 === 0 ? 'Say the word clearly:' : 'Use the word in a complete sentence:',
    target: index % 2 === 0 ? word.en : (word.ex || word.en)
  }));
  const authenticDialogue = (unit?.dialogue || []).filter((line) => {
    const text = String(line.text || '');
    return text && !/welcome class! today we explore|welcome to unit \d+:|ministerial exercises|ready to learn and pronounce clearly|\.\.\./i.test(text)
      && !/أ\. محمد المنشاوي/.test(String(line.speaker || ''));
  });
  const modelDialogue = authenticDialogue.length ? authenticDialogue : [
    { speaker: 'Teacher', text: 'What can you say about ' + (unitWords[0]?.en || unit.title) + '?' },
    { speaker: 'Student', text: unitWords[0]?.ex || sourceGrammarExamples[0] || 'I can talk about ' + unit.title + '.' }
  ];
  const authenticSpeakingQuestions = (unit?.speakingQuestions || []).filter((item) =>
    item.q && !/where does the conversation take place|other topic/i.test(String(item.q) + ' ' + (item.opts || []).join(' '))
  );
  const vocabularySupplementary = unitWords.flatMap((word, index) => {
    const arabicOptions = [word.ar, ...unitWords
      .filter((item) => item.en !== word.en && item.ar)
      .map((item) => item.ar)
      .filter((meaning, meaningIndex, all) => meaning && meaning !== word.ar && all.indexOf(meaning) === meaningIndex)
      .slice(index % 3, (index % 3) + 2)];
    return [
      { q: 'Choose the English word for: ' + word.ar, opts: choiceOptions(word.en, index), ans: 0 },
      { q: 'What does "' + word.en + '" mean?', opts: arabicOptions, ans: 0 }
    ];
  });
  const unitTestQuestions = [
    ...(unit?.vocabularyQuestions || []).slice(0, 5),
    ...grammarPractice.slice(0, 8),
    ...readingPractice.slice(0, 5),
    ...listeningPractice.slice(0, 4),
    ...(unit?.examQuestions || []).slice(0, 2)
  ].slice(0, 24);
  const modules = [
    { id: 'vocabulary', title: 'Vocabulary', subtitle: 'Words, meanings and examples', icon: '📚', count: unit?.vocabulary?.length || 0 },
    { id: 'grammar', title: 'Grammar', subtitle: 'Clear explanation, examples and practice', icon: '✏️', count: grammarPractice.length },
    { id: 'phonics', title: 'Phonics', subtitle: 'Sounds and word patterns', icon: '🔤', count: (unit?.phonics?.words || []).length },
    { id: 'reading', title: 'Reading', subtitle: 'Passage and 5 reading activities', icon: '📖', count: (unit?.readingText ? 1 : 0) + readingPractice.length },
    { id: 'dialogue', title: 'Dialogue & Speaking', subtitle: 'Conversation and 10 speaking prompts', icon: '🎤', count: (unit?.dialogue || []).length + (unit?.speakingQuestions || []).length + speakingPrompts.length },
    { id: 'listening', title: 'Listening Practice', subtitle: '5 listen-and-choose questions', icon: '🎧', count: listeningPractice.length },
    { id: 'games', title: 'Word Games', subtitle: '4 interactive games using unit words', icon: '🎮', count: 4 },
    { id: 'vocabulary-practice', title: 'Vocabulary Practice', subtitle: 'Source quiz plus 20 extra questions', icon: '🧠', count: (unit?.vocabularyQuestions || []).length + vocabularySupplementary.length },
    { id: 'tests', title: 'Unit Tests', subtitle: 'Up to 24 mixed review questions', icon: '📝', count: unitTestQuestions.length }
  ];
  const moduleGroups = [
    { title: 'Learn', subtitle: 'Build understanding before you practise.', items: modules.filter((item) => ['vocabulary', 'grammar', 'phonics', 'reading'].includes(item.id)) },
    { title: 'Practice', subtitle: 'Use the new language in activities and games.', items: modules.filter((item) => ['dialogue', 'listening', 'games', 'vocabulary-practice'].includes(item.id)) },
    { title: 'Check your progress', subtitle: 'Review what you have learned in this unit.', items: modules.filter((item) => item.id === 'tests') }
  ];
  const renderQuestions = (items, prefix) => (items || []).map((q, index) => {
    const sourceOptions = Array.isArray(q.opts) ? q.opts : [];
    const answer = Number.isInteger(q.ans) ? q.ans : 0;
    const id = prefix + '-' + index;
    const optionText = (option) => typeof option === 'string' ? option : String(option?.text ?? option?.label ?? option?.value ?? '');
    const correctOption = sourceOptions[answer];
    const opts = [...sourceOptions.filter((_, originalIndex) => originalIndex !== answer)];
    const isArabicOptions = sourceOptions.some((option) => /[\u0600-\u06FF]/.test(optionText(option)));
    const grammarCandidates = grammarDistractors[String(correctOption || '').toLowerCase()] || [];
    const extraCandidates = /-r(?:-|$)/.test(prefix)
      ? grammarCandidates
      : unitWords.map((word) => isArabicOptions ? word.ar : word.en);
    for (const candidate of extraCandidates) {
      if (opts.length >= 3) break;
      if (candidate && optionText(candidate) !== optionText(correctOption) && !opts.some((item) => optionText(item) === optionText(candidate))) opts.push(candidate);
    }
    if (opts.length < 3) {
      const safeFallbacks = isArabicOptions ? ['إجابة أخرى', 'كلمة أخرى'] : ['another', 'different'];
      for (const candidate of safeFallbacks) {
        if (opts.length >= 3) break;
        if (!opts.some((item) => optionText(item) === candidate) && optionText(correctOption) !== candidate) opts.push(candidate);
      }
    }
    const distractors = opts;
    let seed = 0;
    for (const char of id) seed = (seed * 31 + char.charCodeAt(0)) % 2147483647;
    for (let i = distractors.length - 1; i > 0; i--) {
      seed = (seed * 16807) % 2147483647;
      const j = Math.floor((seed / 2147483647) * (i + 1));
      [distractors[i], distractors[j]] = [distractors[j], distractors[i]];
    }
    // Question-specific seeded randomization prevents the predictable A/B/C/D cycle.\n     const correctPosition = seed % 4;
    const shuffled = [...distractors];
    shuffled.splice(correctPosition, 0, correctOption);
    const correct = correctPosition;
    const saved = getQuestionState(id);
    const wrong = saved.wrongChoices.map(String);
    const rawPrompt = String(q.q || 'Choose the correct answer');
    const meaningMatch = rawPrompt.match(/ما معنى كلمة\s*[（(]([^）)]+)[）)]\s*[؟?]?/);
    const displayPrompt = meaningMatch
      ? 'Choose the correct meaning of “' + meaningMatch[1].trim() + '”.'
      : rawPrompt;
    return '<article class="interactive-question imported-question" data-imported-question="' + escapeHtml(id) + '" data-answered="' + (saved.isCorrect ? 'true' : 'false') + '">' +
      (q.audio ? '<button type="button" class="tts-play-btn small imported-question-audio" data-tts-text="' + escapeHtml(q.audio) + '">🔊 Listen</button>' : '') + '<p class="question-prompt-text" dir="auto">' + escapeHtml(displayPrompt) + '</p><div class="quiz-options">' +
      shuffled.map((option, oi) => {
        const good = saved.isCorrect && Number(saved.choice) === oi;
        const bad = wrong.includes(String(oi));
        return '<button type="button" class="quiz-option imported-answer ' + (good ? 'is-correct' : bad ? 'is-wrong' : '') + '" data-question="' + escapeHtml(id) + '" data-choice="' + oi + '" data-correct="' + correct + '"' + (saved.isCorrect || bad ? ' disabled' : '') + '><span class="option-letter">' + String.fromCharCode(65 + oi) + '</span><span class="option-text" dir="auto">' + escapeHtml(optionText(option)) + '</span></button>';
      }).join('') + '</div><p class="imported-feedback ' + (saved.isCorrect ? 'correct' : wrong.length ? 'incorrect' : '') + '" aria-live="polite">' + (saved.isCorrect ? 'Correct! Well done.' : wrong.length ? 'Not quite. Try another answer.' : '') + '</p></article>';
  }).join('');
  const prefix = unit ? 'g' + grade.grade + '-' + track.id + '-u' + unit.number : '';
  const vocab = (unit?.vocabulary || []).map((v) => '<article class="imported-vocab"><span>' + escapeHtml(v.e || '📘') + '</span><strong dir="ltr">' + escapeHtml(v.en || '') + '</strong><span dir="rtl">' + escapeHtml(v.ar || '') + '</span><small dir="ltr">' + escapeHtml(v.ex || '') + '</small><button type="button" class="tts-play-btn small" data-tts-text="' + escapeHtml(v.en || '') + '">🔊 Listen to pronunciation</button>' + (v.ex ? '<button type="button" class="tts-play-btn small secondary" data-tts-text="' + escapeHtml(v.ex) + '">▶ Listen to example</button>' : '') + '</article>').join('');
  let body = '';
  if (unit && state.activeModule) {
    switch (state.activeModule) {
      case 'vocabulary': body = '<div class="imported-vocab-grid">' + vocab + '</div>'; break;
      case 'grammar': body = '<article class="imported-section-card grammar-lesson-card"><p class="eyebrow">GRAMMAR GUIDE</p><h3>' + escapeHtml(grammarLesson.title) + '</h3><p>' + escapeHtml(grammarLesson.explanation) + '</p><div class="grammar-formula"><strong>Pattern</strong><span>' + escapeHtml(grammarLesson.formula) + '</span></div><p class="grammar-tip"><strong>Remember:</strong> ' + escapeHtml(grammarLesson.tip) + '</p><h4>Examples</h4><ul>' + grammarLesson.examples.map((x) => '<li dir="auto">' + escapeHtml(x) + ' <button type="button" class="tts-play-btn small" data-tts-text="' + escapeHtml(x) + '">🔊 Listen</button></li>').join('') + '</ul><p class="unit-source-note">The guide is a simplified learning explanation based on this unit’s grammar heading and examples.</p></article><h3 class="module-subheading">Grammar practice · ' + grammarPractice.length + ' questions</h3>' + renderQuestions(grammarPractice, prefix + '-r'); break;
      case 'phonics': body = '<article class="imported-section-card"><h3>' + escapeHtml(unit.phonics?.title || 'Phonics') + '</h3><p>' + escapeHtml(unit.phonics?.desc || '') + '</p><p class="unit-source-note">Listen to each sound and repeat it aloud.</p><div class="imported-chip-list">' + (unit.phonics?.words || []).map((w) => '<button type="button" class="imported-phonics-word" data-tts-text="' + escapeHtml(w) + '">🔊 ' + escapeHtml(w) + '</button>').join('') + '</div></article>'; break;
      case 'reading': body = '<article class="imported-section-card"><h3>Reading passage</h3><p class="imported-reading-text" dir="auto">' + escapeHtml(unit.readingText || 'No reading passage supplied.') + '</p><button type="button" class="big-audio-btn" data-tts-text="' + escapeHtml(unit.readingText || '') + '">🔊 Listen to the full passage</button></article><h3 class="module-subheading">Reading comprehension · 5 activities</h3><p class="unit-source-note">Supplementary sentence-completion practice generated from the passage text.</p>' + renderQuestions(readingPractice, prefix + '-read'); break;
      case 'dialogue': body = '<p class="unit-source-note">Model conversation and speaking prompts for extra practice, based on this unit’s examples.</p><div class="imported-dialogue">' + modelDialogue.map((line) => '<article><strong>' + escapeHtml(line.speaker || '') + '</strong><p dir="auto">' + escapeHtml(line.text || '') + '</p><button type="button" class="tts-play-btn small" data-tts-text="' + escapeHtml(line.text || '') + '">🔊 Listen</button></article>').join('') + '</div><h3 class="module-subheading">Speaking practice</h3>' + renderQuestions(authenticSpeakingQuestions, prefix + '-s') + '<div class="imported-speaking-prompts">' + speakingPrompts.map((item) => '<article class="imported-section-card"><strong>' + escapeHtml(item.prompt) + '</strong><p dir="ltr">' + escapeHtml(item.target) + '</p><button type="button" class="tts-play-btn small" data-tts-text="' + escapeHtml(item.target) + '">🔊 Hear a model</button></article>').join('') + '</div>'; break;
      case 'listening': body = '<p class="unit-source-note">Listen to each word, then choose the word you heard.</p>' + renderQuestions(listeningPractice, prefix + '-listen'); break;
      case 'games': body = renderGames(); break;
      case 'vocabulary-practice': body = '<h3 class="module-subheading">Textbook-source questions</h3>' + renderQuestions(unit.vocabularyQuestions, prefix + '-v') + '<h3 class="module-subheading">Extra meaning practice</h3><p class="unit-source-note">Extra questions generated from this unit’s vocabulary list.</p>' + renderQuestions(vocabularySupplementary, prefix + '-vs'); break;
      case 'tests': body = '<h3 class="module-subheading">Unit assessment · ' + unitTestQuestions.length + ' questions</h3><p class="unit-source-note">A mixed review using vocabulary, grammar, reading, listening and the supplied exam questions. Extra generated items are not presented as printed textbook questions.</p>' + renderQuestions(unitTestQuestions, prefix + '-test') + buildUnitCertificate(unit, track, grade, unitTestQuestions, prefix + '-test'); break;
    }
    const active = modules.find((item) => item.id === state.activeModule);
    return '<section class="panel imported-curriculum imported-module-screen ' + (state._routeChanged ? 'route-enter' : '') + '"><button type="button" class="imported-back-button" data-imported-back="unit">← Back to Unit ' + unit.number + '</button><div class="section-heading"><div><p class="eyebrow">' + escapeHtml(track.name) + ' · GRADE ' + grade.grade + ' · UNIT ' + unit.number + '</p><h2>' + escapeHtml(active?.title || 'Unit section') + '</h2><p>' + escapeHtml(active?.subtitle || '') + '</p></div></div><div class="imported-module-content">' + body + '</div></section>';
  }
  if (unit) {
    return '<section class="panel imported-curriculum imported-unit-dashboard ' + (state._routeChanged ? 'route-enter' : '') + '"><button type="button" class="imported-back-button" data-imported-back="grade">← Back to all units</button><div class="unit-hero-banner imported-unit-hero"><div><p class="eyebrow">' + escapeHtml(track.name) + ' · GRADE ' + grade.grade + '</p><h2>Unit ' + unit.number + ': ' + escapeHtml(unit.title) + '</h2><p>Choose a section. Each section opens on its own screen.</p></div><span class="book-count">' + unit.vocabulary.length + ' words</span><button type="button" class="favorite-unit-button" data-favorite-current>☆ Save Unit</button></div><div class="imported-module-groups">' +
      moduleGroups.map((group) => '<section class="imported-module-group"><div class="imported-module-group-heading"><h3>' + group.title + '</h3><p>' + group.subtitle + '</p></div><div class="imported-section-grid">' + group.items.map((item) => '<button type="button" class="unit-section-card" data-imported-section="' + item.id + '"><span class="section-card-icon">' + item.icon + '</span><span class="section-card-copy"><strong class="section-card-label">' + item.title + '</strong><small>' + item.subtitle + '</small><span class="section-card-progress">' + item.count + ' items</span></span><span class="section-card-arrow">›</span></button>').join('') + '</div></section>').join('') + '</div></section>';
  }
  return '<section class="panel imported-curriculum"><div class="section-heading"><div><p class="eyebrow">PRIMARY 2026/2027 · ' + escapeHtml(track.name) + '</p><h2>Grade ' + grade.grade + ' · Units</h2><p class="unit-source-note">Select a unit to open its own learning dashboard.</p></div><span class="book-count">' + grade.units.length + ' units</span></div><div class="imported-unit-list">' +
    grade.units.map((item) => '<button type="button" class="imported-unit-card imported-unit-button" data-imported-unit="' + item.number + '"><span class="imported-unit-number">UNIT ' + item.number + '</span><strong>' + escapeHtml(item.title) + '</strong><span>' + item.vocabulary.length + ' words · ' + item.examQuestions.length + ' exam questions</span><b>Open unit ›</b></button>').join('') + '</div></section>';
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
  return content ? `<details class="candidate-content"><summary>Review extracted content</summary>${content}<p class="unit-source-note">Transcription only · verify wording and layout against original PDF before approval.</p></details>` : '';
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
      const hasLessonDraft = lessonDrafts.records.some((lesson) => lesson.bookId === book.id && lesson.unitNumber === unit.number) || (book.id === 'primary1-student-term1' && unit.number === 1);
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

// Digital Visual Activity 1: Self-Introduction Widget (Page 9)
function renderSelfIntroWidget() {
  const { name, avatar } = state.selfIntro;
  const avatars = ['👧', '👦', '🐝', '👩‍🏫'];
  const greetingText = `Hello! I am ${name.trim() || '________'}.`;
  return `
    <div class="visual-activity-card">
      <div class="visual-activity-badge">DIGITAL ACTIVITY · PAGE 9</div>
      <h4>Self-Introduction: "Hello! I am..."</h4>
      <p class="visual-activity-desc">Type your name and choose an avatar to introduce yourself to your friends!</p>
      <div class="self-intro-controls">
        <label class="self-intro-label">Your Name:
          <input type="text" class="self-intro-input" value="${escapeHtml(name)}" placeholder="Type your name..." data-intro-name>
        </label>
        <div class="avatar-picker">
          <span>Avatar:</span>
          ${avatars.map((av) => `<button type="button" class="avatar-btn ${av === avatar ? 'active' : ''}" data-intro-avatar="${av}">${av}</button>`).join('')}
        </div>
      </div>
      <div class="self-intro-preview">
        <div class="self-intro-avatar-display">${avatar}</div>
        <div class="self-intro-bubble">
          <strong>${escapeHtml(greetingText)}</strong>
          <small>Connect Primary 1</small>
        </div>
        <button type="button" class="tts-play-btn" data-tts-text="${escapeHtml(greetingText)}">🔊 Listen</button>
      </div>
    </div>
  `;
}

// Digital Visual Activity 2: Friendship & Politeness Checkmarks (Page 13)
function renderPolitenessActivity() {
  const scenarios = [
    { id: 'sc1', icon: '🤝', text: 'Shaking hands and saying "Hello!"', correct: 'polite', desc: 'Greeting friends warmly is polite classroom behavior.' },
    { id: 'sc2', icon: '👋', text: 'Waving and smiling at a new classmate', correct: 'polite', desc: 'Waving helps make new friends feel welcome.' },
    { id: 'sc3', icon: '🎒', text: 'Pulling a friend’s bag away without asking', correct: 'impolite', desc: 'Taking items without asking is not polite.' },
    { id: 'sc4', icon: '🙋', text: 'Saying "Goodbye, teacher!" politely', correct: 'polite', desc: 'Saying goodbye shows respect and kindness.' }
  ];
  const userAnswers = state.politeness.answers;
  const totalAnswered = Object.keys(userAnswers).length;
  const correctCount = scenarios.filter((sc) => userAnswers[sc.id] === sc.correct).length;

  return `
    <div class="visual-activity-card">
      <div class="visual-activity-badge">DIGITAL ACTIVITY · PAGE 13</div>
      <h4>Friendship & Politeness Checkmark Activity</h4>
      <p class="visual-activity-desc">Is the action polite ✔ or impolite ✘? Click to check your answer!</p>
      <div class="politeness-grid">
        ${scenarios.map((sc) => {
          const chosen = userAnswers[sc.id];
          const isRight = chosen === sc.correct;
          return `
            <div class="politeness-item ${chosen ? (isRight ? 'correct' : 'wrong') : ''}">
              <div class="politeness-icon">${sc.icon}</div>
              <div class="politeness-copy">
                <strong>${escapeHtml(sc.text)}</strong>
                ${chosen ? `<small class="politeness-feedback">${isRight ? '✔ Correct!' : '✘ Try again.'} ${escapeHtml(sc.desc)}</small>` : ''}
              </div>
              <div class="politeness-btns">
                <button type="button" class="politeness-btn polite ${chosen === 'polite' ? 'selected' : ''}" data-politeness-id="${sc.id}" data-politeness-val="polite">✔ Polite</button>
                <button type="button" class="politeness-btn impolite ${chosen === 'impolite' ? 'selected' : ''}" data-politeness-id="${sc.id}" data-politeness-val="impolite">✘ Impolite</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      ${totalAnswered > 0 ? `<div class="politeness-score">Score: <strong>${correctCount} / ${scenarios.length}</strong> correct choices recorded!</div>` : ''}
    </div>
  `;
}

// Game Registry (Stage-based mechanics)
const gameRegistry = {
  primary: {
    low: {
      grades: [1, 2, 3],
      games: [
        { title: '🧩 Picture–Word Matching', renderer: renderGame1Matching },
        { title: '🔤 Word Builder', renderer: renderGame2WordBuilder },
        { title: '🔊 Listen and Choose', renderer: renderGame3ListenChoose },
        { title: '📣 Classroom Commands', renderer: renderGame4CommandsChallenge }
      ]
    },
    high: {
      grades: [4, 5, 6],
      games: [
        { title: '🧠 Word Detective', renderer: renderGame1Matching },
        { title: '🧩 Sentence Builder', renderer: renderGame2WordBuilder },
        { title: '🎧 Listening Challenge', renderer: renderGame3ListenChoose },
        { title: '🏆 Meaning Challenge', renderer: renderGame4MeaningChallenge }
      ]
    }
  },
  preparatory: {
    grades: [1, 2, 3],
    games: [] // Content unavailable
  },
  secondary: {
    grades: [1, 2, 3],
    games: [] // Content unavailable
  },
  egyptian_baccalaureate: {
    grades: [1, 2, 3],
    games: [] // Content unavailable
  }
};

function getGamesForState(stage, grade) {
  if (stage === 'primary') {
    return grade <= 3 ? gameRegistry.primary.low.games : gameRegistry.primary.high.games;
  }
  return gameRegistry[stage]?.games || [];
}

function getImportedPrimaryUnitForGames() {
  if (state.stage !== 'primary' || !['general', 'advanced'].includes(state.path) || !state.importedUnitNumber) return null;
  const track = primaryHtmlCurriculum.tracks.find((item) => item.id === state.path);
  const grade = track?.grades.find((item) => item.grade === state.grade);
  return grade?.units.find((item) => item.number === Number(state.importedUnitNumber)) || null;
}

function getPrimaryGameWords(limit = 6) {
  const unit = getImportedPrimaryUnitForGames();
  if (!unit) return null;
  return (unit.vocabulary || []).filter((item) => item.en && item.ar).slice(0, limit).map((item) => {
    const english = String(item.en).trim();
    const rawMeaning = String(item.ar).trim();
    const englishAt = rawMeaning.toLowerCase().indexOf(english.toLowerCase());
    const arabicOnly = (englishAt >= 0
      ? rawMeaning.slice(0, englishAt) + rawMeaning.slice(englishAt + english.length)
      : rawMeaning).replace(/[()（）\[\]{}:：]/g, ' ').replace(/\s+/g, ' ').trim();
    return {
      target: english.toLowerCase(),
      arabic: arabicOnly || 'معنى غير متاح',
      icon: item.e || '🔤',
      label: arabicOnly || 'معنى غير متاح'
    };
  });
}

function renderGames() {
  const games = getGamesForState(state.stage, state.grade);
  if (games.length === 0) {
    return `
      <div class="empty-state">
        <div class="book-icon">🧩</div>
        <strong>Educational Games in Preparation</strong>
        <p>Interactive games for this stage and grade level are currently being developed and will be available soon.</p>
      </div>
    `;
  }
  
  const gameComponents = games.map(g => g.renderer);
  
  return `
    <div class="game-selector-bar">
      ${games.map((g, idx) => `
        <button type="button" class="game-tab-btn ${state.activeGameTab === idx + 1 ? 'active' : ''}" data-game-tab="${idx + 1}">${g.title}</button>
      `).join('')}
    </div>
    ${(gameComponents[state.activeGameTab - 1] || gameComponents[0])()}
  `;
}

// 4 Interactive Mini-Games (Purely Student View - No technical internal metadata)
function renderGame1Matching() {
  const importedWords = getPrimaryGameWords(6);
  const pairs = importedWords?.map((item) => ({ word: item.target, pic: item.icon, label: item.label })) || [
    { word: 'pencil', pic: '✏️', label: 'قلم رصاص' },
    { word: 'bag', pic: '🎒', label: 'حقيبة' },
    { word: 'chair', pic: '🪑', label: 'كرسي' },
    { word: 'tiger', pic: '🐯', label: 'نمر' },
    { word: 'tree', pic: '🌳', label: 'شجرة' },
    { word: 'tomato', pic: '🍅', label: 'طماطم' }
  ];
  const { selectedWord, selectedPic, matches } = state.game1;
  const isComplete = matches.length === pairs.length;

  return `
    <article class="interactive-game-container">
      <div class="game-header">
        <span class="game-badge">GAME 1 OF 4</span>
        <h4>🧩 Picture–Word Matching Game</h4>
        <p>Click a word on the left, then click its matching picture on the right!</p>
      </div>
      <div class="game-score-bar">Matched: <strong>${matches.length} / ${pairs.length}</strong></div>
      ${isComplete ? `
        <div class="game-victory-card">
          <h3>🎉 Great Job!</h3>
          <p>You matched all the words from this unit correctly!</p>
          <button type="button" class="game-reset-btn" data-reset-game="1">Play Again</button>
        </div>
      ` : ''}
      <div class="matching-game-grid">
        <div class="matching-col">
          <span class="col-title">Word Cards</span>
          ${pairs.map((p) => {
            const isMatched = matches.includes(p.word);
            const isSelected = selectedWord === p.word;
            return `
              <button type="button" class="matching-card word-card ${isMatched ? 'matched' : ''} ${isSelected ? 'selected' : ''}" data-match-word="${p.word}" ${isMatched ? 'disabled' : ''}>
                <span dir="ltr">${p.word}</span>
              </button>
            `;
          }).join('')}
        </div>
        <div class="matching-col">
          <span class="col-title">Picture Cards</span>
          ${[...pairs].reverse().map((p) => {
            const isMatched = matches.includes(p.word);
            const isSelected = selectedPic === p.word;
            return `
              <button type="button" class="matching-card pic-card ${isMatched ? 'matched' : ''} ${isSelected ? 'selected' : ''}" data-match-pic="${p.word}" ${isMatched ? 'disabled' : ''}>
                <span class="pic-symbol">${p.pic}</span>
                <small>${escapeHtml(p.label)}</small>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    </article>
  `;
}

function renderGame2WordBuilder() {
  const importedWords = getPrimaryGameWords(6);
  const wordsData = importedWords || [
    { target: 'tiger', arabic: 'نمر', icon: '🐯' },
    { target: 'tomato', arabic: 'طماطم', icon: '🍅' },
    { target: 'table', arabic: 'طاولة', icon: '🪑' },
    { target: 'tree', arabic: 'شجرة', icon: '🌳' },
    { target: 'ink', arabic: 'حبر', icon: '🖋️' },
    { target: 'insect', arabic: 'حشرة', icon: '🐛' }
  ];
  const { index, placed, score, checkResult } = state.game2;
  const current = wordsData[index];
  if (!current) {
    return `
      <article class="interactive-game-container">
        <div class="game-victory-card">
          <h3>🎉 Word Builder Complete!</h3>
          <p>You built all target unit words successfully! Score: <strong>${score} / ${wordsData.length}</strong></p>
          <button type="button" class="game-reset-btn" data-reset-game="2">Play Again</button>
        </div>
      </article>
    `;
  }
  const targetChars = current.target.split('');
  const tiles = [...targetChars].sort((a, b) => b.charCodeAt(0) - a.charCodeAt(0));

  return `
    <article class="interactive-game-container">
      <div class="game-header">
        <span class="game-badge">GAME 2 OF 4</span>
        <h4>🔤 Word Builder Game</h4>
        <p>Arrange the letter tiles in the correct order to spell the word!</p>
      </div>
      <div class="game-score-bar">Word <strong>${index + 1} / ${wordsData.length}</strong> · Score: <strong>${score}</strong></div>
      <div class="word-builder-card">
        <div class="word-builder-hint">
          <span class="hint-icon">${current.icon}</span>
          <div class="hint-copy">
            <strong>${current.arabic}</strong>
          </div>
          <button type="button" class="tts-play-btn" data-tts-text="${current.target}">🔊 Listen</button>
        </div>
        <div class="word-builder-slots">
          ${targetChars.map((_, slotIdx) => {
            const char = placed[slotIdx] || '';
            return `<button type="button" class="builder-slot ${char ? 'filled' : ''}" data-unplace-tile="${slotIdx}">${char}</button>`;
          }).join('')}
        </div>
        <div class="word-builder-tiles">
          ${tiles.map((char) => {
            const usedCount = placed.filter((c) => c === char).length;
            const availableCount = tiles.filter((c) => c === char).length;
            const isUsed = usedCount >= availableCount;
            return `<button type="button" class="builder-tile ${isUsed ? 'used' : ''}" data-place-tile="${char}" ${isUsed ? 'disabled' : ''}>${char}</button>`;
          }).join('')}
        </div>
        <div class="builder-actions">
          <button type="button" class="builder-action-btn clear" data-builder-clear>Clear Tiles</button>
          <button type="button" class="builder-action-btn check" data-builder-check="${current.target}" ${checkResult ? 'disabled' : ''}>Check Word</button>
        </div>
        ${checkResult ? `
          <div class="builder-feedback ${checkResult.isCorrect ? 'correct' : 'wrong'}">
            <p>${checkResult.isCorrect ? '✔ Outstanding! Word spelled correctly.' : `✘ Not quite. Try again!`}</p>
            <button type="button" class="next-word-btn" data-builder-next>Next Word ›</button>
          </div>
        ` : ''}
      </div>
    </article>
  `;
}

function renderGame3ListenChoose() {
  const importedWords = getPrimaryGameWords(6);
  const rounds = importedWords?.map((item, index) => ({
    target: item.target,
    options: [item.target, importedWords[(index + 1) % importedWords.length]?.target, importedWords[(index + 2) % importedWords.length]?.target].filter(Boolean),
    prompt: 'Listen and choose the matching unit word:'
  })) || [
    { target: 'hello', options: ['hello', 'goodbye', 'chair'], prompt: 'Listen to the greeting:' },
    { target: 'goodbye', options: ['pencil', 'goodbye', 'bag'], prompt: 'Listen to the farewell:' },
    { target: 'teacher', options: ['teacher', 'desk', 'board'], prompt: 'Listen to the classroom word:' },
    { target: 'board', options: ['book', 'board', 'tiger'], prompt: 'Listen to the classroom word:' },
    { target: 'desk', options: ['desk', 'tree', 'tomato'], prompt: 'Listen to the classroom object:' },
    { target: 'insect', options: ['ink', 'insect', 'table'], prompt: 'Listen to the phonics target:' }
  ];
  const { index, score, selectedOption } = state.game3;
  const current = rounds[index];
  if (!current) {
    return `
      <article class="interactive-game-container">
        <div class="game-victory-card">
          <h3>🎉 Listening Challenge Complete!</h3>
          <p>You identified all words from listening audio! Score: <strong>${score} / ${rounds.length}</strong></p>
          <button type="button" class="game-reset-btn" data-reset-game="3">Play Again</button>
        </div>
      </article>
    `;
  }

  return `
    <article class="interactive-game-container">
      <div class="game-header">
        <span class="game-badge">GAME 3 OF 4</span>
        <h4>🔊 Listen and Choose Game</h4>
        <p>Listen to the audio pronunciation and select the correct word card!</p>
      </div>
      <div class="game-score-bar">Round <strong>${index + 1} / ${rounds.length}</strong> · Score: <strong>${score}</strong></div>
      <div class="listen-game-card">
        <p class="listen-prompt-label">${escapeHtml(current.prompt)}</p>
        <button type="button" class="big-audio-btn" data-tts-text="${current.target}">
          <span class="speaker-icon">🔊</span>
          <span>Click to Listen to Word</span>
        </button>
        <div class="listen-options-grid">
          ${current.options.map((opt) => {
            const isChosen = selectedOption === opt;
            const isRight = opt === current.target;
            const optClass = selectedOption ? (isRight ? 'is-correct' : isChosen ? 'is-wrong' : '') : '';
            return `
              <button type="button" class="listen-opt-card ${optClass}" data-listen-choose="${opt}" ${selectedOption ? 'disabled' : ''}>
                <span dir="ltr">${opt}</span>
              </button>
            `;
          }).join('')}
        </div>
        ${selectedOption ? `
          <div class="listen-feedback ${selectedOption === current.target ? 'correct' : 'wrong'}">
            <p>${selectedOption === current.target ? '✔ Correct! You recognized the word.' : `✘ Try again next round!`}</p>
            <button type="button" class="next-word-btn" data-listen-next>Next Round ›</button>
          </div>
        ` : ''}
      </div>
    </article>
  `;
}

function renderGame4MeaningChallenge() {
  const importedWords = getPrimaryGameWords(4);
  const rounds = importedWords?.length ? importedWords.map((item) => ({
    target: item.target,
    meaning: item.arabic,
    options: importedWords
      .map((choice) => choice.arabic)
      .filter((meaning, index, all) => meaning && all.indexOf(meaning) === index)
      .sort((a, b) => a.localeCompare(b, 'ar'))
  })) : [
    { target: 'brave', meaning: 'شجاع', options: ['شجاع', 'سعيد', 'سريع', 'هادئ'] },
    { target: 'careful', meaning: 'حذر', options: ['قوي', 'حذر', 'طويل', 'جميل'] },
    { target: 'journey', meaning: 'رحلة', options: ['مدينة', 'رحلة', 'حديقة', 'مدرسة'] },
    { target: 'protect', meaning: 'يحمي', options: ['يكتشف', 'يساعد', 'يحمي', 'يتعلم'] }
  ];
  const { index, score, selectedOption } = state.game4;
  const current = rounds[index];
  if (!current) {
    return `
      <article class="interactive-game-container">
        <div class="game-victory-card">
          <h3>🎉 Meaning Challenge Complete!</h3>
          <p>You matched the English words with their Arabic meanings. Score: <strong>${score} / ${rounds.length}</strong></p>
          <button type="button" class="game-reset-btn" data-reset-game="4">Play Again</button>
        </div>
      </article>
    `;
  }

  return `
    <article class="interactive-game-container">
      <div class="game-header">
        <span class="game-badge">GAME 4 OF 4</span>
        <h4>🏆 Meaning Challenge</h4>
        <p>Read the English word and choose its correct meaning in Arabic.</p>
      </div>
      <div class="game-score-bar">Word <strong>${index + 1} / ${rounds.length}</strong> · Score: <strong>${score}</strong></div>
      <div class="commands-game-card">
        <div class="command-prompt-box meaning-prompt-box">
          <span class="meaning-word-label">What does this word mean?</span>
          <strong class="meaning-english-word" dir="ltr">${escapeHtml(current.target)}</strong>
          <button type="button" class="tts-play-btn" data-tts-text="${escapeHtml(current.target)}">🔊 Listen to the word</button>
        </div>
        <div class="command-options-grid meaning-options-grid" dir="rtl">
          ${current.options.map((opt) => {
            const isChosen = selectedOption === opt;
            const isRight = opt === current.meaning;
            const optClass = selectedOption ? (isRight ? 'is-correct' : isChosen ? 'is-wrong' : '') : '';
            return `
              <button type="button" class="command-action-card meaning-option-card ${optClass}" data-meaning-choose="${escapeHtml(opt)}" ${selectedOption ? 'disabled' : ''}>
                <span class="action-title" dir="rtl">${escapeHtml(opt)}</span>
              </button>
            `;
          }).join('')}
        </div>
        ${selectedOption ? `
          <div class="command-feedback ${selectedOption === current.meaning ? 'correct' : 'wrong'}">
            <p>${selectedOption === current.meaning ? '✔ Correct! Well done.' : '✘ Not quite. The correct meaning is: ' + escapeHtml(current.meaning)}</p>
            <button type="button" class="next-word-btn" data-meaning-next>Next Word ›</button>
          </div>
        ` : ''}
      </div>
    </article>
  `;
}

function renderGame4CommandsChallenge() {
  const importedWords = getPrimaryGameWords(4);
  const commands = importedWords?.map((item, index) => ({
    target: item.target,
    icon: item.icon,
    desc: item.arabic,
    options: importedWords.map((choice) => choice.target).sort((a, b) => a.localeCompare(b))
  })) || [
    { target: 'stand up', icon: '🧍', desc: 'Stand up on your feet', options: ['stand up', 'sit down', 'close your book', 'open your bag'] },
    { target: 'sit down', icon: '🪑', desc: 'Sit down on your chair', options: ['open your bag', 'sit down', 'stand up', 'close your book'] },
    { target: 'open your bag', icon: '🎒', desc: 'Open your school bag', options: ['open your bag', 'close your book', 'stand up', 'sit down'] },
    { target: 'close your book', icon: '📖', desc: 'Close your English book', options: ['sit down', 'open your bag', 'close your book', 'stand up'] }
  ];
  const { index, score, selectedOption } = state.game4;
  const current = commands[index];
  if (!current) {
    return `
      <article class="interactive-game-container">
        <div class="game-victory-card">
          <h3>🎉 Classroom Commands Challenge Complete!</h3>
          <p>You mastered all classroom imperatives! Score: <strong>${score} / ${commands.length}</strong></p>
          <button type="button" class="game-reset-btn" data-reset-game="4">Play Again</button>
        </div>
      </article>
    `;
  }

  return `
    <article class="interactive-game-container">
      <div class="game-header">
        <span class="game-badge">GAME 4 OF 4</span>
        <h4>📣 Classroom Commands Challenge</h4>
        <p>Listen to the teacher's command and choose the matching action card!</p>
      </div>
      <div class="game-score-bar">Command <strong>${index + 1} / ${commands.length}</strong> · Score: <strong>${score}</strong></div>
      <div class="commands-game-card">
        <div class="command-prompt-box">
          <button type="button" class="tts-play-btn big" data-tts-text="${current.target}">🔊 Listen: "${current.target}"</button>
        </div>
        <div class="command-options-grid">
          ${current.options.map((opt) => {
            const isChosen = selectedOption === opt;
            const isRight = opt === current.target;
            const optClass = selectedOption ? (isRight ? 'is-correct' : isChosen ? 'is-wrong' : '') : '';
            return `
              <button type="button" class="command-action-card ${optClass}" data-command-choose="${opt}" ${selectedOption ? 'disabled' : ''}>
                <span class="action-title" dir="ltr">${opt}</span>
              </button>
            `;
          }).join('')}
        </div>
        ${selectedOption ? `
          <div class="command-feedback ${selectedOption === current.target ? 'correct' : 'wrong'}">
            <p>${selectedOption === current.target ? `✔ Correct! "${current.target}" — ${current.desc}` : `✘ Try again!`}</p>
            <button type="button" class="next-word-btn" data-command-next>Next Command ›</button>
          </div>
        ` : ''}
      </div>
    </article>
  `;
}

// Interactive Questions Card Renderer (Clean Student View - NO technical data!)
function renderStudentQuestionCard(item, index, sectionType, customBadge = null) {
  const data = item.content || {};
  const qId = item.itemId || `${sectionType}-${index}`;
  const qState = getQuestionState(qId);
  const hasKey = typeof data.correctAnswer === 'string';
  const shuffledOpts = getShuffledOptions(qId, data.options);

  return `
    <article class="interactive-question">
      <div class="question-header-row">
        <span class="question-badge">${customBadge || `Question ${index + 1}`}</span>
        ${qState.isCorrect ? '<span class="status-chip correct">✓ Solved</span>' : (qState.wrongChoices.length > 0 ? '<span class="status-chip wrong">Try again</span>' : '')}
      </div>
      <p class="question-instruction">${escapeHtml(data.instruction || 'Choose the correct answer:')}</p>
      <h4 class="question-prompt-text">${escapeHtml(data.question)}</h4>
      <div class="quiz-options">
        ${shuffledOpts.map((opt, optIdx) => {
          const letter = String.fromCharCode(65 + optIdx);
          const isChosen = qState.choice === opt;
          const isWrong = qState.wrongChoices.includes(opt);
          const isCorrect = qState.isCorrect && opt === data.correctAnswer;

          let optClass = '';
          if (isCorrect) optClass = 'is-correct';
          else if (isWrong) optClass = 'is-wrong';
          else if (isChosen && !qState.isCorrect) optClass = 'is-wrong';

          // Disable button ONLY if the question was answered correctly OR this specific option was already tried and wrong
          const isBtnDisabled = qState.isCorrect || isWrong;

          return `<button type="button" class="quiz-option ${optClass}" data-quiz-question="${qId}" data-quiz-choice="${escapeHtml(opt)}" ${isBtnDisabled ? 'disabled' : ''}><span class="option-letter">${letter}</span><span class="option-text">${escapeHtml(opt)}</span>${isCorrect ? '<span class="option-indicator">✓</span>' : (isWrong ? '<span class="option-indicator">✗</span>' : '')}</button>`;
        }).join('')}
      </div>
      ${qState.isCorrect ? `<div class="quiz-feedback correct"><span class="feedback-icon">🌟</span> Correct! Well done.</div>` : (qState.wrongChoices.length > 0 ? `<div class="quiz-feedback incorrect"><span class="feedback-icon">💡</span> Not quite. Choose another option!</div>` : '')}
    </article>
  `;
}

// Renders the Unit Workspace Dashboard & Independent Section Screens
function renderUnitWorkspace() {
  if (!state.unitSelection) return '';
  const book = sourceIndex.books.find((item) => item.id === state.unitSelection.bookId);
  const unit = book?.units?.find((item) => item.number === state.unitSelection.unitNumber);
  if (!book || !unit) return '';

  const isP1U1 = book.id === 'primary1-student-term1' && unit.number === 1;
  const activeUnitDraft = book.id === 'primary1-student-term1'
    ? ({ 1: p1u1Draft, 2: p1u2Draft, 3: p1u3Draft }[unit.number] || null)
    : null;
  const isP1U2U3 = book.id === 'primary1-student-term1' && (unit.number === 2 || unit.number === 3);

  // Clear, named learning areas. Speaking is included because Unit 1 has a verified role-play.
  const sixSections = [
    { type: 'vocabulary', title: 'Vocabulary', subtitle: 'Words, meanings, pictures & pronunciation', icon: 'Aa', draftType: 'vocabulary' },
    { type: 'grammar', title: 'Grammar', subtitle: 'Rules and classroom language', icon: '文', draftType: 'grammar' },
    { type: 'reading', title: 'Reading', subtitle: 'Read the Maya & Hana dialogue', icon: '▤', draftType: 'reading' },
    { type: 'listening', title: 'Listening', subtitle: 'Listen, replay and answer', icon: '♫', draftType: 'listening' },
    { type: 'speaking', title: 'Speaking', subtitle: 'Practise the dialogue aloud', icon: '🎤', draftType: 'speaking' },
    { type: 'games', title: 'Games', subtitle: '4 interactive learning games', icon: '★', draftType: 'games' },
    { type: 'comprehensive_test', title: 'Tests', subtitle: '10-question unit assessment', icon: '✓', draftType: 'comprehensive_test' }
  ];

  // Helper to count answered questions without duplicates
  const countAnswered = (items) => {
    if (!Array.isArray(items)) return 0;
    return items.filter((q) => getQuestionState(q.itemId).isCorrect).length;
  };

  // SECTION SCREEN (When a student opens an independent section)
  if (state.activeModule) {
    const secDef = sixSections.find((s) => s.type === state.activeModule) || sixSections[0];
    let bodyHtml = '';

    if (isP1U2U3 && activeUnitDraft) {
      const getItems = (type) => activeUnitDraft.sections.find((section) => section.type === type)?.items || [];
      const vocabulary = getItems('vocabulary');
      const vocabularyQuestions = getItems('vocabulary_questions');
      const grammar = getItems('grammar');
      const grammarQuestions = getItems('grammar_questions');
      const reading = getItems('reading');
      const tests = getItems('comprehensive_test');
      const renderQuestionGroup = (items, type) => items.length
        ? `<div class="questions-stack">${items.map((q, idx) => renderStudentQuestionCard(q, idx, type)).join('')}</div>`
        : '<div class="empty-state">No questions are available in this section yet.</div>';

      if (state.activeModule === 'vocabulary') {
        bodyHtml = `
          <div class="vocab-grid-responsive">
            ${vocabulary.map((item, idx) => {
              const data = item.content || {};
              const icons = { bird: '🐦', flower: '🌸', butterfly: '🦋', grass: '🌱', sky: '🌤️', tree: '🌳', father: '👨', mother: '👩', parents: '👨‍👩‍👧', brother: '👦', sister: '👧', grandfather: '👴', grandmother: '👵', apple: '🍎', ant: '🐜', nurse: '👩‍⚕️', pencil: '✏️', potato: '🥔', parrot: '🦜', panda: '🐼', pizza: '🍕', hat: '🧢', horse: '🐴', dog: '🐶', duck: '🦆', door: '🚪', doll: '🪆', drum: '🥁' };
              return `<article class="vocab-compact-card"><div class="vocab-compact-top"><span class="vocab-compact-icon">${icons[(data.word || '').toLowerCase()] || '📘'}</span><span class="vocab-compact-num">#${idx + 1} · p.${data.sourcePdfPage || '—'}</span></div><strong class="vocab-compact-word" dir="ltr">${escapeHtml(data.word || '')}</strong><span class="vocab-compact-meaning" dir="rtl">${escapeHtml(data.arabicMeaning || '')}</span>${data.example ? `<p dir="ltr">${escapeHtml(data.example)}</p>` : ''}<button type="button" class="tts-play-btn small" data-tts-text="${escapeHtml(data.word || '')}">🔊 Listen</button></article>`;
            }).join('')}
          </div>
          <h3 class="module-subheading">Vocabulary practice</h3>
          ${renderQuestionGroup(vocabularyQuestions, 'vocabulary_questions')}
        `;
      } else if (state.activeModule === 'grammar') {
        bodyHtml = `
          <div class="grammar-lessons-container">
            ${grammar.map((item) => {
              const data = item.content || {};
              return `<article class="grammar-concept-card"><div class="grammar-concept-head"><span class="grammar-concept-badge">LANGUAGE STRUCTURE</span><span class="grammar-page-tag">PDF Page ${data.sourcePdfPage || '—'}</span></div><h3 class="grammar-concept-title">${escapeHtml(data.rule || '')}</h3><p class="grammar-explanation-text">${escapeHtml(data.explanation || '')}</p>${data.example ? `<div class="grammar-example-callout"><span class="example-badge">Textbook model</span><p class="example-content" dir="ltr">${escapeHtml(data.example)}</p><button type="button" class="tts-play-btn small" data-tts-text="${escapeHtml(data.example)}">🔊 Listen</button></div>` : ''}</article>`;
            }).join('')}
          </div>
          <h3 class="module-subheading">Grammar practice</h3>
          ${renderQuestionGroup(grammarQuestions, 'grammar_questions')}
        `;
      } else if (state.activeModule === 'reading' || state.activeModule === 'speaking' || state.activeModule === 'listening') {
        const passage = reading[0]?.content?.passage || '';
        const lines = passage.split('\\n').filter(Boolean);
        bodyHtml = `
          <article class="reading-passage-card"><div class="reading-card-head"><span class="reading-badge">OFFICIAL BOOK DIALOGUE · PDF PAGE ${reading[0]?.content?.sourcePdfPage || '—'}</span><h4>${escapeHtml(activeUnitDraft.unitTitle)}</h4><p class="reading-subtitle">Read each line, then listen and practise with a partner.</p></div>
          <div class="chat-dialogue-thread">${lines.map((line, idx) => { const split = line.match(/^([^:]+):\\s*(.*)$/); const speaker = split?.[1] || `Line ${idx + 1}`; const words = split?.[2] || line; return `<div class="chat-bubble ${idx % 2 ? 'hana' : 'maya'}"><div class="chat-avatar">${idx % 2 ? '👧' : '👦'}</div><div class="chat-body"><span class="chat-sender">${escapeHtml(speaker)}</span><p class="chat-text" dir="ltr">${escapeHtml(words)}</p></div><button type="button" class="tts-play-btn small" data-tts-text="${escapeHtml(words)}">🔊</button></div>`; }).join('')}</div>
          <button type="button" class="big-audio-btn secondary" data-tts-text="${escapeHtml(lines.join('. '))}">🔊 Listen to full dialogue</button></article>
          <p class="speaking-practice-note">Practise the dialogue aloud with a partner.</p>
        `;
      } else if (state.activeModule === 'comprehensive_test') {
        bodyHtml = `<div class="quiz-summary-pill">Unit assessment · ${tests.length} questions</div>${renderQuestionGroup(tests, 'comprehensive_test')}`;
      } else if (state.activeModule === 'games') {
        bodyHtml = `<div class="empty-state"><strong>Games are being prepared for this unit.</strong><span>Use Vocabulary, Reading and Tests to practise the source content.</span></div>`;
      }
    } else if (isP1U1 && p1u1Draft) {
      if (state.activeModule === 'vocabulary') {
        const vocabSec = p1u1Draft.sections.find((s) => s.type === 'vocabulary');
        const vocabQSec = p1u1Draft.sections.find((s) => s.type === 'vocabulary_questions');
        const words = vocabSec?.items || [];
        const questions = vocabQSec?.items || [];
        const answeredQ = countAnswered(questions);
        const currentIndex = Math.min(Math.max(0, state.vocabIndex || 0), words.length - 1);
        const currentItem = words[currentIndex] || words[0] || {};
        const currentData = currentItem.content || {};
        const wordKey = (currentData.word || '').toLowerCase();
        const visual = vocabVisualMap[wordKey] || { icon: '📖', tag: 'Vocabulary', phonetic: '' };

        bodyHtml = `
          <div class="section-subtab-bar">
            <button type="button" class="subtab-btn ${state.activeVocabSubtab === 'words' ? 'active' : ''}" data-vocab-subtab="words">
              📖 Learn Words (${words.length})
            </button>
            <button type="button" class="subtab-btn ${state.activeVocabSubtab === 'practice' ? 'active' : ''}" data-vocab-subtab="practice">
              ✏️ Practice Questions (${answeredQ}/${questions.length})
            </button>
          </div>

          ${state.activeVocabSubtab === 'words' ? `
            <div class="vocab-mode-bar">
              <span class="vocab-counter">Word <strong>${currentIndex + 1}</strong> of <strong>${words.length}</strong></span>
              <div class="vocab-view-toggle">
                <button type="button" class="toggle-btn ${state.vocabViewMode === 'card' ? 'active' : ''}" data-vocab-view="card" title="Flashcard Single Word View">🗂️ Card</button>
                <button type="button" class="toggle-btn ${state.vocabViewMode === 'grid' ? 'active' : ''}" data-vocab-view="grid" title="Grid All Words View">▦ Grid</button>
              </div>
            </div>

            ${state.vocabViewMode === 'card' ? `
              <!-- Single Focused Card View -->
              <div class="vocab-hero-card-container">
                <article class="vocab-hero-card">
                  <div class="vocab-card-header">
                    <span class="vocab-tag-pill">${escapeHtml(visual.tag)}</span>
                    <span class="vocab-page-tag">PDF Page ${currentData.sourcePdfPage || '8'}</span>
                  </div>

                  <div class="vocab-illustration-wrapper">
                    ${visual.image ? `<img src="${visual.image}" alt="${escapeHtml(visual.tag)}" class="vocab-hero-image">` : `<span class="vocab-hero-icon" aria-hidden="true">${visual.icon}</span>`}
                  </div>

                  <div class="vocab-card-body">
                    <h2 class="vocab-word-large" dir="ltr">${escapeHtml(currentData.word)}</h2>
                    ${visual.phonetic ? `<span class="vocab-phonetic">${visual.phonetic}</span>` : ''}
                    <div class="vocab-meaning-badge" dir="rtl">${escapeHtml(currentData.arabicMeaning)}</div>
                    ${currentData.example ? `
                      <div class="vocab-example-card" dir="ltr">
                        <span class="example-label">Example</span>
                        <p class="example-text">"${escapeHtml(currentData.example)}"</p>
                      </div>
                    ` : ''}
                  </div>

                  <div class="vocab-card-footer">
                    <button type="button" class="vocab-audio-hero-btn" data-tts-text="${escapeHtml(currentData.word)}">
                      🔊 Listen Pronunciation
                    </button>
                  </div>
                </article>

                <!-- Navigation Stepper -->
                <div class="vocab-stepper-row">
                  <button type="button" class="vocab-nav-btn prev" data-vocab-step="prev" ${currentIndex === 0 ? 'disabled' : ''}>
                    ‹ Previous
                  </button>
                  <div class="vocab-chips-scroller">
                    ${words.map((w, idx) => {
                      const isActive = idx === currentIndex;
                      return `<button type="button" class="vocab-chip ${isActive ? 'active' : ''}" data-vocab-jump="${idx}">${idx + 1}</button>`;
                    }).join('')}
                  </div>
                  <button type="button" class="vocab-nav-btn next" data-vocab-step="next" ${currentIndex === words.length - 1 ? 'disabled' : ''}>
                    Next ›
                  </button>
                </div>
              </div>
            ` : `
              <!-- Grid Reference View -->
              <div class="vocab-grid-responsive">
                ${words.map((item, idx) => {
                  const data = item.content || {};
                  const vKey = (data.word || '').toLowerCase();
                  const vInfo = vocabVisualMap[vKey] || { icon: '📖', tag: 'Word', phonetic: '' };
                  const isCurrent = idx === currentIndex;
                  return `
                    <article class="vocab-compact-card ${isCurrent ? 'current' : ''}" data-vocab-select="${idx}">
                      <div class="vocab-compact-top">
                        <span class="vocab-compact-icon">${vInfo.icon}</span>
                        <span class="vocab-compact-num">#${idx + 1}</span>
                      </div>
                      <strong class="vocab-compact-word" dir="ltr">${escapeHtml(data.word)}</strong>
                      <span class="vocab-compact-meaning" dir="rtl">${escapeHtml(data.arabicMeaning)}</span>
                      <button type="button" class="tts-play-btn small" data-tts-text="${escapeHtml(data.word)}">🔊</button>
                    </article>
                  `;
                }).join('')}
              </div>
            `}
          ` : `
            <div class="quiz-summary-pill">Answered: <strong>${answeredQ} / ${questions.length}</strong> Questions</div>
            <div class="questions-stack">
              ${questions.map((q, idx) => renderStudentQuestionCard(q, idx, 'vocabulary_questions')).join('')}
            </div>
          `}
        `;
      } else if (state.activeModule === 'grammar') {
        const gramSec = p1u1Draft.sections.find((s) => s.type === 'grammar');
        const gramQSec = p1u1Draft.sections.find((s) => s.type === 'grammar_questions');
        const rules = gramSec?.items || [];
        const questions = gramQSec?.items || [];
        const answeredQ = countAnswered(questions);

        bodyHtml = `
          <div class="section-subtab-bar">
            <button type="button" class="subtab-btn ${state.activeGrammarSubtab === 'rules' ? 'active' : ''}" data-grammar-subtab="rules">
              💡 Grammar Rules (${rules.length})
            </button>
            <button type="button" class="subtab-btn ${state.activeGrammarSubtab === 'practice' ? 'active' : ''}" data-grammar-subtab="practice">
              ✏️ Practice Questions (${answeredQ}/${questions.length})
            </button>
          </div>

          ${state.activeGrammarSubtab === 'rules' ? `
            <div class="grammar-lessons-container">
              ${rules.map((item, idx) => {
                const data = item.content || {};
                const isGreeting = idx === 0;
                return `
                  <article class="grammar-concept-card">
                    <div class="grammar-concept-head">
                      <span class="grammar-concept-badge">${isGreeting ? 'RULE 01 · GREETINGS' : 'RULE 02 · IMPERATIVES'}</span>
                      <span class="grammar-page-tag">PDF Page ${data.sourcePdfPage || '8'}</span>
                    </div>
                    <h3 class="grammar-concept-title">${escapeHtml(data.rule || 'Language Structure')}</h3>
                    <p class="grammar-explanation-text">${escapeHtml(data.explanation || '')}</p>

                    <div class="grammar-formula-box">
                      <span class="formula-label">Structured Formula</span>
                      ${isGreeting ? `
                        <div class="formula-grid">
                          <div class="formula-item">
                            <span class="formula-tag">Ask</span>
                            <strong>"Hello! What's your name?"</strong>
                            <button type="button" class="tts-play-btn small" data-tts-text="Hello! What's your name?">🔊</button>
                          </div>
                          <div class="formula-item">
                            <span class="formula-tag">Answer</span>
                            <strong>"My name is [name]" / "I am [name]"</strong>
                            <button type="button" class="tts-play-btn small" data-tts-text="My name is Maya.">🔊</button>
                          </div>
                        </div>
                      ` : `
                        <div class="imperatives-visual-grid">
                          <div class="command-tile"><span>🧍</span><strong>Stand up</strong><button type="button" class="tts-play-btn small" data-tts-text="Stand up">🔊</button></div>
                          <div class="command-tile"><span>🧎</span><strong>Sit down</strong><button type="button" class="tts-play-btn small" data-tts-text="Sit down">🔊</button></div>
                          <div class="command-tile"><span>🎒</span><strong>Open your bag</strong><button type="button" class="tts-play-btn small" data-tts-text="Open your bag">🔊</button></div>
                          <div class="command-tile"><span>📖</span><strong>Close your book</strong><button type="button" class="tts-play-btn small" data-tts-text="Close your book">🔊</button></div>
                        </div>
                      `}
                    </div>

                    ${data.example ? `
                      <div class="grammar-example-callout">
                        <span class="example-badge">Textbook Example</span>
                        <p class="example-content">${escapeHtml(data.example)}</p>
                        <button type="button" class="tts-play-btn small" data-tts-text="${escapeHtml(data.example)}">🔊 Listen</button>
                      </div>
                    ` : ''}
                  </article>
                `;
              }).join('')}
            </div>
          ` : `
            <div class="quiz-summary-pill">Answered: <strong>${answeredQ} / ${questions.length}</strong> Questions</div>
            <div class="questions-stack">
              ${questions.map((q, idx) => renderStudentQuestionCard(q, idx, 'grammar_questions')).join('')}
            </div>
          `}
        `;
      } else if (state.activeModule === 'reading') {
        const readSec = p1u1Draft.sections.find((s) => s.type === 'reading');
        const items = readSec?.items || [];
        const passageItem = items.find((i) => i.itemId === 'p1u1-rd-1');
        const readQuestions = items.filter((i) => i.content?.question);
        const answeredRead = countAnswered(readQuestions);

        bodyHtml = `
          <div class="reading-screen-wrapper">
            ${passageItem ? `
              <article class="reading-passage-card">
                <div class="reading-card-head">
                  <span class="reading-badge">SUPPLEMENTARY READING PRACTICE · PAGE 8</span>
                  <h4>Maya and Hana Meet at School</h4>
                  <p class="reading-subtitle">Read and listen to the complete official dialogue between Maya and Hana.</p>
                </div>

                <div class="chat-dialogue-thread">
                  <div class="chat-bubble maya">
                    <div class="chat-avatar">👧</div>
                    <div class="chat-body">
                      <span class="chat-sender">Maya</span>
                      <p class="chat-text">"Hello!"</p>
                    </div>
                    <button type="button" class="tts-play-btn small" data-tts-text="Hello!">🔊</button>
                  </div>

                  <div class="chat-bubble hana">
                    <div class="chat-avatar">👧</div>
                    <div class="chat-body">
                      <span class="chat-sender">Hana</span>
                      <p class="chat-text">"Hello! What's your name?"</p>
                    </div>
                    <button type="button" class="tts-play-btn small" data-tts-text="Hello! What's your name?">🔊</button>
                  </div>

                  <div class="chat-bubble maya">
                    <div class="chat-avatar">👧</div>
                    <div class="chat-body">
                      <span class="chat-sender">Maya</span>
                      <p class="chat-text">"My name is Maya."</p>
                    </div>
                    <button type="button" class="tts-play-btn small" data-tts-text="My name is Maya.">🔊</button>
                  </div>

                  <div class="chat-bubble hana">
                    <div class="chat-avatar">👧</div>
                    <div class="chat-body">
                      <span class="chat-sender">Hana</span>
                      <p class="chat-text">"I'm Hana!"</p>
                    </div>
                    <button type="button" class="tts-play-btn small" data-tts-text="I'm Hana!">🔊</button>
                  </div>

                  <div class="chat-bubble maya">
                    <div class="chat-avatar">👧</div>
                    <div class="chat-body">
                      <span class="chat-sender">Maya</span>
                      <p class="chat-text">"Nice to meet you, Maya!"</p>
                    </div>
                    <button type="button" class="tts-play-btn small" data-tts-text="Nice to meet you, Maya!">🔊</button>
                  </div>

                  <div class="chat-bubble hana">
                    <div class="chat-avatar">👧</div>
                    <div class="chat-body">
                      <span class="chat-sender">Hana</span>
                      <p class="chat-text">"Nice to meet you, too, Hana!"</p>
                    </div>
                    <button type="button" class="tts-play-btn small" data-tts-text="Nice to meet you, too, Hana!">🔊</button>
                  </div>

                  <div class="chat-bubble hana">
                    <div class="chat-avatar">👧</div>
                    <div class="chat-body">
                      <span class="chat-sender">Hana</span>
                      <p class="chat-text">"Do you want to shake hands?"</p>
                    </div>
                    <button type="button" class="tts-play-btn small" data-tts-text="Do you want to shake hands?">🔊</button>
                  </div>

                  <div class="chat-bubble maya">
                    <div class="chat-avatar">👧</div>
                    <div class="chat-body">
                      <span class="chat-sender">Maya</span>
                      <p class="chat-text">"Yes! (They shake hands)"</p>
                    </div>
                    <button type="button" class="tts-play-btn small" data-tts-text="Yes! They shake hands.">🔊</button>
                  </div>

                  <div class="chat-bubble maya">
                    <div class="chat-avatar">👧</div>
                    <div class="chat-body">
                      <span class="chat-sender">Maya</span>
                      <p class="chat-text">"Goodbye, Hana!"</p>
                    </div>
                    <button type="button" class="tts-play-btn small" data-tts-text="Goodbye, Hana!">🔊</button>
                  </div>
                </div>

                <div class="dialogue-full-audio-row">
                  <button type="button" class="big-audio-btn secondary" data-tts-text="Maya: Hello! Hana: Hello! What's your name? Maya: My name is Maya. Hana: I'm Hana! Nice to meet you, Maya! Nice to meet you, too, Hana! Do you want to shake hands? Yes! They shake hands. Goodbye, Hana!">
                    🔊 Play Entire Dialogue
                  </button>
                </div>
              </article>
            ` : ''}

            <section class="reading-comprehension-section">
              <div class="comprehension-head">
                <span class="comp-badge">READING COMPREHENSION · ${answeredRead} / ${readQuestions.length} ANSWERED</span>
                <h4>Check Your Understanding</h4>
                <button type="button" class="section-reset-btn" data-reset-reading>↺ Reset Reading Answers</button>
              </div>
              <div class="questions-stack">
                ${readQuestions.map((q, idx) => renderStudentQuestionCard(q, idx, 'reading', `Reading Question ${idx + 1} of ${readQuestions.length}`)).join('')}
              </div>
            </section>
          </div>
        `;
      } else if (state.activeModule === 'listening') {
        const listSec = p1u1Draft.sections.find((s) => s.type === 'listening');
        const items = listSec?.items || [];
        const scriptItem = items.find((i) => i.itemId === 'p1u1-ls-1');
        const listenQuestions = items.filter((i) => i.content?.question);
        const answeredListen = countAnswered(listenQuestions);
        const data = scriptItem?.content || {};
        const scriptText = data.script || 'Stand up. Sit down. Open your bag. Close your book.';

        bodyHtml = `
          <div class="listening-screen-wrapper">
            <article class="listening-console-card">
              <div class="listening-card-head">
                <span class="listening-badge">SUPPLEMENTARY LISTENING PRACTICE · PAGE 20</span>
                <h4>Listen and Point: Classroom Commands</h4>
                <p class="listening-prompt">${escapeHtml(data.activityInstruction || 'Listen to your teacher and point to the correct action.')}</p>
                <small class="tts-notice-badge">ℹ️ Note: Audio playback uses browser Text-to-Speech (TTS) synthesis.</small>
              </div>

              <!-- Dedicated Modern Audio Player Console -->
              <div class="audio-player-console">
                <div class="player-visual-wave">
                  <span class="wave-bar"></span>
                  <span class="wave-bar"></span>
                  <span class="wave-bar"></span>
                  <span class="wave-bar"></span>
                  <span class="wave-bar"></span>
                </div>

                <div class="player-controls-row">
                  <button type="button" class="player-btn play-btn" data-tts-text="${escapeHtml(scriptText)}" title="Play listening audio">
                    ▶ Play
                  </button>
                  <button type="button" class="player-btn stop-btn" data-audio-stop title="Stop audio">
                    ⏹ Stop
                  </button>
                  <button type="button" class="player-btn replay-btn" data-tts-text="${escapeHtml(scriptText)}" title="Replay from start">
                    🔄 Replay
                  </button>
                </div>

                <div class="speed-selector-row">
                  <span class="speed-label">Speed:</span>
                  <div class="speed-buttons">
                    <button type="button" class="speed-btn ${state.listeningSpeed === 0.75 ? 'active' : ''}" data-set-speed="0.75">0.75x Slow</button>
                    <button type="button" class="speed-btn ${(state.listeningSpeed || 1.0) === 1.0 ? 'active' : ''}" data-set-speed="1.0">1.0x Normal</button>
                    <button type="button" class="speed-btn ${state.listeningSpeed === 1.25 ? 'active' : ''}" data-set-speed="1.25">1.25x Fast</button>
                  </div>
                </div>

                <details class="transcript-collapsible">
                  <summary>Audio Script (Click to Reveal)</summary>
                  <p class="transcript-text">"${escapeHtml(scriptText)}"</p>
                </details>
              </div>
            </article>

            <section class="listening-comprehension-section">
              <div class="comprehension-head">
                <span class="comp-badge">LISTENING COMPREHENSION · ${answeredListen} / ${listenQuestions.length} ANSWERED</span>
                <h4>Answer the Questions</h4>
                <button type="button" class="section-reset-btn" data-reset-listening>↺ Reset Listening Answers</button>
              </div>
              <div class="questions-stack">
                ${listenQuestions.map((q, idx) => renderStudentQuestionCard(q, idx, 'listening', `Listening Question ${idx + 1} of ${listenQuestions.length}`)).join('')}
              </div>
            </section>
          </div>
        `;
      } else if (state.activeModule === 'speaking') {
        const speakingSection = p1u1Draft.sections.find((section) => section.type === 'speaking');
        const rolePlay = speakingSection?.items?.[0]?.content?.dialogue || [];
        bodyHtml = rolePlay.length ? `
          <div class="speaking-practice-card">
            <p class="speaking-instruction">Take turns with a partner. Listen to each line, then say it aloud.</p>
            <div class="speaking-dialogue-list">
              ${rolePlay.map((line, index) => `
                <article class="speaking-line-card">
                  <span class="speaking-line-speaker">${escapeHtml(line.speaker || `Speaker ${index + 1}`)}</span>
                  <p>${escapeHtml(line.text || '')}</p>
                  <button type="button" class="speaking-line-audio" data-tts-text="${escapeHtml(line.text || '')}">🔊 Listen</button>
                </article>
              `).join('')}
            </div>
            <p class="speaking-practice-note">Now practise the full dialogue with a classmate.</p>
            <button type="button" class="big-audio-btn secondary" data-tts-text="${escapeHtml(rolePlay.map((line) => `${line.speaker}: ${line.text}`).join('. '))}">🔊 Listen to Full Dialogue</button>
          </div>
        ` : '<div class="empty-state"><strong>Speaking practice is being prepared.</strong></div>';
      } else if (state.activeModule === 'games') {
        bodyHtml = renderGames();
      } else if (state.activeModule === 'comprehensive_test') {
        const testSec = p1u1Draft.sections.find((s) => s.type === 'comprehensive_test');
        const items = testSec?.items || [];
        const answeredQ = countAnswered(items);
        const testIdx = Math.min(Math.max(0, state.testQuestionIndex || 0), Math.max(0, items.length - 1));
        const currentQ = items[testIdx] || items[0];
        const isComplete = items.length > 0 && answeredQ === items.length;

        bodyHtml = `
          <div class="test-stepper-wrapper">
            <!-- Test Header with Progress Indicator -->
            <div class="test-progress-header">
              <div class="test-progress-info">
                <span class="test-badge">FINAL EVALUATION TEST · 10 QUESTIONS</span>
                <div class="test-progress-metrics">
                  <span>Question <strong>${testIdx + 1}</strong> of <strong>${items.length}</strong></span>
                  <span class="test-score-counter">Answered: <strong>${answeredQ} / ${items.length}</strong></span>
                </div>
              </div>
              <div class="test-progress-bar-track">
                <div class="test-progress-bar-fill" style="width: ${(answeredQ / items.length) * 100}%;"></div>
              </div>
              <!-- Quick Question Jump Navigator -->
              <div class="test-nav-chips">
                ${items.map((item, idx) => {
                  const qStatus = getQuestionState(item.itemId);
                  const isCurrent = idx === testIdx;
                  let chipClass = '';
                  if (isCurrent) chipClass += ' current';
                  if (qStatus.isCorrect) chipClass += ' correct';
                  else if (qStatus.wrongChoices.length > 0) chipClass += ' wrong';
                  return `<button type="button" class="test-q-chip ${chipClass}" data-test-jump="${idx}">${idx + 1}</button>`;
                }).join('')}
              </div>
            </div>

            <!-- Single Question Card -->
            <div class="test-active-question-card">
              ${currentQ ? renderStudentQuestionCard(currentQ, testIdx, 'comprehensive_test', `Question ${testIdx + 1} of ${items.length}`) : ''}
            </div>

            <!-- Stepper Footer -->
            <div class="test-stepper-footer">
              <button type="button" class="test-nav-btn prev" data-test-step="prev" ${testIdx === 0 ? 'disabled' : ''}>
                ‹ Previous Question
              </button>
              <span class="test-pos-indicator">${testIdx + 1} / ${items.length}</span>
              <button type="button" class="test-nav-btn next" data-test-step="next" ${testIdx === items.length - 1 ? 'disabled' : ''}>
                Next Question ›
              </button>
            </div>

            ${isComplete ? `
              <div class="test-completion-banner">
                <div class="completion-icon">🏆</div>
                <div class="completion-copy">
                  <h4>Assessment Completed!</h4>
                  <p>Congratulations! You answered all 10 evaluation questions correctly.</p>
                </div>
                <button type="button" class="completion-review-btn" data-back-unit>Return to Unit 1 Dashboard</button>
              </div>
            ` : ''}
          </div>
        `;
      }
    } else {
      bodyHtml = `
        <div class="empty-state">
          <div class="book-icon">📖</div>
          <strong>Digital interactive exercises for Unit ${unit.number} (${escapeHtml(secDef.title)}) are in preparation</strong>
          <span>This unit is mapped from the official curriculum textbook (${escapeHtml(book.sourceFile)}). You can view the original lesson material on PDF page ${unit.startPdfPage || 'N/A'}.</span>
          ${Number.isInteger(unit.startPdfPage) ? `<button type="button" class="source-open" data-unit-preview="${escapeHtml(book.sourceFile)}" data-unit-page="${unit.startPdfPage}">Open PDF Page ${unit.startPdfPage} ↗</button>` : ''}
        </div>
      `;
    }

    return `
      <section class="unit-module-screen">
        <div class="sticky-section-header">
          <button type="button" class="fixed-back-btn" data-back-unit>‹ Back to Unit ${unit.number} Dashboard</button>
        </div>
        <div class="module-screen-heading">
          <p class="eyebrow">${escapeHtml(book.grade || 'PRIMARY 1').toUpperCase()} · UNIT ${unit.number}</p>
          <h3>${escapeHtml(secDef.title)}</h3>
          <p>${escapeHtml(secDef.subtitle)}</p>
        </div>
        ${bodyHtml}
      </section>
    `;
  }

  // UNIT DASHBOARD (The 6 Consolidated Section Cards + 2 Visual Activities)
  const calculateProgress = (secType) => {
    if (!isP1U1 || !p1u1Draft) return 'Open section';
    if (secType === 'vocabulary') {
      const vocabQ = p1u1Draft.sections.find((s) => s.type === 'vocabulary_questions')?.items || [];
      const count = countAnswered(vocabQ);
      return `24 Words · ${count}/${vocabQ.length} Practice Qs`;
    }
    if (secType === 'grammar') {
      const gramQ = p1u1Draft.sections.find((s) => s.type === 'grammar_questions')?.items || [];
      const count = countAnswered(gramQ);
      return `2 Rules · ${count}/${gramQ.length} Practice Qs`;
    }
    if (secType === 'reading') {
      const readQ = p1u1Draft.sections.find((s) => s.type === 'reading')?.items?.filter(i => i.content?.question) || [];
      const count = countAnswered(readQ);
      return `1 Dialogue · ${count}/${readQ.length} Answered`;
    }
    if (secType === 'listening') {
      const listQ = p1u1Draft.sections.find((s) => s.type === 'listening')?.items?.filter(i => i.content?.question) || [];
      const count = countAnswered(listQ);
      return `1 Task · ${count}/${listQ.length} Answered`;
    }
    if (secType === 'speaking') return '1 Role-Play Dialogue';
    if (secType === 'games') return '4 Mini-Games';
    if (secType === 'comprehensive_test') {
      const testSec = p1u1Draft.sections.find((s) => s.type === 'comprehensive_test');
      const items = testSec?.items || [];
      const count = countAnswered(items);
      return `${count} / ${items.length} Scored`;
    }
    return 'Open section';
  };

  // Keep the progress numerator and denominator based on the exact same scored question set.
  // This automatically includes future questions added to any scored section.
  const scoredQuestionGroups = isP1U1 && p1u1Draft ? [
    p1u1Draft.sections.find((s) => s.type === 'vocabulary_questions')?.items || [],
    p1u1Draft.sections.find((s) => s.type === 'grammar_questions')?.items || [],
    p1u1Draft.sections.find((s) => s.type === 'reading')?.items?.filter((item) => item.content?.question) || [],
    p1u1Draft.sections.find((s) => s.type === 'listening')?.items?.filter((item) => item.content?.question) || [],
    p1u1Draft.sections.find((s) => s.type === 'comprehensive_test')?.items || []
  ] : [];
  const totalQuestions = scoredQuestionGroups.reduce((total, items) => total + items.length, 0);
  const totalAnswered = scoredQuestionGroups.reduce((total, items) => total + countAnswered(items), 0);
  const progressPercent = totalQuestions > 0
    ? Math.min(100, Math.round((totalAnswered / totalQuestions) * 100))
    : 0;

  const sectionCards = sixSections.map((sec) => `
    <button type="button" class="unit-section-card" data-open-section="${sec.type}" aria-label="Open ${sec.title}">
      <span class="section-card-icon" aria-hidden="true">${sec.icon}</span>
      <div class="section-card-copy">
        <div class="section-card-title-row">
          <strong class="section-card-label">${sec.title}</strong>
        </div>
        <small>${sec.subtitle}</small>
        <span class="section-card-progress">${calculateProgress(sec.type)}</span>
      </div>
      <span class="section-card-arrow" aria-hidden="true">›</span>
    </button>
  `).join('');

  return `
    <section class="unit-workspace" aria-label="Unit details">
      <!-- Modern Compact Unit Overview Header -->
      <div class="unit-hero-banner">
        <div class="unit-hero-left">
          <span class="unit-stage-tag">${escapeHtml(book.grade || 'PRIMARY 1').toUpperCase()} · ${book.term ? `TERM ${book.term}` : 'COURSE'}</span>
          <h2 class="unit-hero-title">Unit ${unit.number}: ${escapeHtml(unit.title)}</h2>
          <p class="unit-hero-subtitle">${escapeHtml(unit.theme || (isP1U1 ? 'Welcome to My School' : unit.title) || book.sourceFile)}</p>
        </div>
        <div class="unit-hero-right">
          ${isP1U1 ? `
            <div class="unit-progress-meter">
              <div class="meter-info">
                <span class="meter-label">Unit Progress</span>
                <strong class="meter-val">${totalAnswered} / ${totalQuestions} Completed (${progressPercent}%)</strong>
              </div>
              <div class="meter-track">
                <div class="meter-fill" style="width: ${progressPercent}%;"></div>
              </div>
            </div>
          ` : ''}
          <button type="button" class="preview-close unit-close-btn" data-close-unit>Close Unit ✕</button>
        </div>
      </div>

      ${!isP1U1 && Number.isInteger(unit.startPdfPage) ? `
        <div class="unit-source-preview-prompt">
          <p>Official curriculum source: <strong>${escapeHtml(book.sourceFile)}</strong> · Unit starts at PDF page <strong>${unit.startPdfPage}</strong></p>
          ${Array.isArray(unit.topics) && unit.topics.length ? `
            <div class="unit-topic-list" aria-label="Topics listed in the official book contents">
              <strong>Book topics</strong>
              ${unit.topics.map((topic) => `<span class="unit-topic-chip">${escapeHtml(topic)}</span>`).join('')}
            </div>
          ` : ''}
          <button type="button" class="source-open" data-unit-preview="${escapeHtml(book.sourceFile)}" data-unit-page="${unit.startPdfPage}">Preview Unit in Original PDF ↗</button>
        </div>
      ` : ''}

      <div class="six-sections-grid">
        ${sectionCards}
      </div>

      <!-- Secondary Interactive Digital Activities (Neat container below core sections) -->
      ${isP1U1 ? `
        <div class="complementary-activities-wrapper">
          <div class="activities-heading">
            <h4>Digital Interactive Activities</h4>
            <p>Practice self-introduction and polite classroom manners.</p>
          </div>
          <div class="activities-grid">
            ${renderSelfIntroWidget()}
            ${renderPolitenessActivity()}
          </div>
        </div>
      ` : ''}

      ${renderReviewCandidates(book, unit.number)}
    </section>
  `;
}

function renderPreview() {
  if (!state.preview) return '';
  const { file, page } = state.preview;
  return `<section class="pdf-preview" aria-label="PDF preview"><div class="preview-heading"><div><p class="eyebrow">ORIGINAL SOURCE · READ ONLY</p><strong>${escapeHtml(file)}</strong><span>PDF page ${page}</span></div><button type="button" class="preview-close" data-close-preview>Close preview ✕</button></div><iframe title="Original source book preview" src="${bookUrl(file, page)}" loading="lazy"></iframe><p class="preview-note">The original PDF is displayed without modification.</p><a class="source-open preview-fallback" href="${bookUrl(file, page)}" target="_blank" rel="noopener">Open PDF in a new tab ↗</a></section>`;
}

// Short, accessible feedback tones. These are generated locally, so no network/audio files are required.
let feedbackAudioContext = null;
function playFeedbackSound(result, game = null) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    feedbackAudioContext ||= new AudioContextClass();
    const context = feedbackAudioContext;
    if (context.state === 'suspended') context.resume().catch(() => {});
    const patterns = {
      questionCorrect: { notes: [659, 880], wave: 'sine', duration: 0.13 },
      questionWrong: { notes: [247, 185], wave: 'triangle', duration: 0.16 },
      matchCorrect: { notes: [523, 659, 784], wave: 'sine', duration: 0.11 },
      matchWrong: { notes: [196, 147], wave: 'triangle', duration: 0.17 },
      builderCorrect: { notes: [392, 523, 659, 784], wave: 'sine', duration: 0.10 },
      builderWrong: { notes: [220, 165], wave: 'square', duration: 0.13 },
      listenCorrect: { notes: [784, 988, 1175], wave: 'sine', duration: 0.10 },
      listenWrong: { notes: [262, 196], wave: 'triangle', duration: 0.16 },
      challengeCorrect: { notes: [587, 784, 988, 1175], wave: 'sine', duration: 0.10 },
      challengeWrong: { notes: [185, 139], wave: 'square', duration: 0.13 }
    };
    const key = game ? game + (result ? 'Correct' : 'Wrong') : 'question' + (result ? 'Correct' : 'Wrong');
    const pattern = patterns[key] || patterns['question' + (result ? 'Correct' : 'Wrong')];
    const start = context.currentTime + 0.015;
    pattern.notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const noteStart = start + index * pattern.duration * 0.82;
      oscillator.type = pattern.wave;
      oscillator.frequency.setValueAtTime(frequency, noteStart);
      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.12, noteStart + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + pattern.duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(noteStart);
      oscillator.stop(noteStart + pattern.duration + 0.02);
    });
  } catch (error) {
    // Audio feedback must never interrupt answering or game progress.
  }
}

function render() {
  if (!activeStudentId) { renderStudentProfiles(); return; }
  const previousScrollY = window.scrollY;
  const previousViewKey = state._renderViewKey || null;
  const currentViewKey = [state.stage, state.grade, state.path, state.importedUnitNumber || '', state.activeModule || ''].join(':');
  state._routeChanged = previousViewKey !== currentViewKey;
  const stage = currentStage();
  if (!stage) {
    app.innerHTML = '<main class="fatal-state"><h1>Curriculum selection unavailable</h1></main>';
    return;
  }
  const paths = stage.paths || [];
  const selectedPath = state.stage === 'egyptian-baccalaureate'
    ? (sourceIndex.pathways.find((item) => item.id === (state.path === 'second-language' ? 'egypt-baccalaureate-second-language' : 'egypt-baccalaureate')) || paths[0])
    : (paths.find((item) => item.id === state.path) || paths[0]);
  if (state.stage !== 'egyptian-baccalaureate') state.path = selectedPath.id;
  const grades = stage.grades;
  const books = selectedBooks();
  const importedPrimaryTrack = state.stage === 'primary' && ['general', 'advanced'].includes(state.path)
    ? primaryHtmlCurriculum.tracks.find((item) => item.id === state.path)
    : null;
  const importedPrimaryGrade = importedPrimaryTrack?.grades.find((item) => item.grade === state.grade) || null;
  const importedUnitView = Boolean(importedPrimaryGrade && state.importedUnitNumber);
  const importedModuleView = Boolean(importedUnitView && state.activeModule);
  const visiblePathways = state.stage === 'egyptian-baccalaureate'
    ? sourceIndex.pathways.filter((item) => item.id.startsWith('egypt-baccalaureate'))
    : paths;

  app.innerHTML = `
    <header class="topbar">
      <a class="brand" href="#" data-home aria-label="EngliMensh home"><span class="brand-mark">E</span><span>EngliMensh</span></a>
      <span class="country-tag">EGYPTIAN CURRICULUM</span><button type="button" class="profile-switch-btn" data-switch-profile>Switch Profile</button>
    </header>
    <main class="shell stage-${state.stage}">
      <section class="welcome" ${importedUnitView ? 'hidden' : ''}>
        <p class="eyebrow">YOUR ENGLISH LEARNING SPACE</p>
        <h1>Learn. Practice. Achieve.</h1>
        <p class="intro">Welcome back! Your selected grade is ready. Explore other stages only when you need them.</p><button type="button" class="explore-stages-btn" data-explore-stages>Explore Other Stages</button>
      </section>
      ${importedUnitView ? '' : renderStudentHub()}
      <section class="panel selection-panel" style="display:none">
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
              const pathTitle = state.stage === 'primary' ? (path.series || path.officialSeries || path.name) : (path.label || path.name);
              const pathSubtitle = state.stage === 'primary' ? '' : `<span>${escapeHtml(path.officialSeries || path.series || 'Reserved pathway')}</span>`;
              return `<button class="path-button ${active ? 'active' : ''}" data-path="${id}"><strong>${escapeHtml(pathTitle)}</strong>${pathSubtitle}</button>`;
            }).join('')}
          </div>
        </div>
      </section>
      <section class="library-section">
        ${importedUnitView ? '' : `<div class="library-heading"><div><p class="eyebrow">YOUR LEARNING CONTENT</p><h2>${escapeHtml(selectedPath.series || selectedPath.officialSeries || selectedPath.name || selectedPath.label || 'Curriculum pathway')}</h2><p class="library-intro">${importedPrimaryGrade ? 'Connect and Connect Plus lessons for the selected grade.' : 'Source books are preserved unchanged. Search the selected grade or preview a book and jump to indexed unit pages.'}</p></div><span class="book-count">${importedPrimaryGrade ? `${importedPrimaryGrade.units.length} units` : `${books.length} source file${books.length === 1 ? '' : 's'}`}</span></div>
        <label class="library-search-label" for="library-search">Search books and units</label>
        <input id="library-search" class="library-search" type="search" placeholder="Type a book title, unit, or topic…" value="${escapeHtml(state.search)}" autocomplete="off">`}

        ${importedPrimaryGrade ? '' : renderUnitWorkspace()}
        ${importedPrimaryGrade ? renderImportedPrimaryCurriculum() : ''}
        ${renderPreview()}
        ${importedPrimaryGrade ? '' : `<div class="book-library">${selectedPath.status === 'reserved_empty' ? '<div class="empty-state"><div class="book-icon">▤</div><strong>This pathway is reserved</strong><span>No source book is indexed for it yet</span></div>' : renderBookLibrary(books)}</div>`}
        <p class="search-empty" hidden>No books or units match your search in this selection.</p>
      </section>
      ${importedUnitView ? '' : '<footer>EngliMensh <span>•</span> Egyptian Curriculum <span>•</span> Source-based learning</footer>'}
    </main>`;

  const applySearch = () => {
    const query = state.search.trim().toLocaleLowerCase();
    let shown = 0;
    app.querySelectorAll('.book-card, .imported-unit-card').forEach((card) => {
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

  // Navigation & Workspace Listeners (Preserves student progress permanently)
  app.querySelectorAll('[data-unit-book]').forEach((button) => button.addEventListener('click', (e) => {
    e.stopPropagation();
    state.unitSelection = { bookId: button.dataset.unitBook, unitNumber: Number(button.dataset.unitNumber) };
    state.activeModule = null;
    state.preview = null;
    saveProgressToStorage();
    render();
    app.querySelector('.unit-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));

  app.querySelector('[data-close-unit]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    state.unitSelection = null;
    state.activeModule = null;
    saveProgressToStorage();
    render();
  });

  app.querySelectorAll('[data-open-section]').forEach((button) => button.addEventListener('click', (e) => {
    e.stopPropagation();
    state.activeModule = button.dataset.openSection;
    saveProgressToStorage();
    render();
    app.querySelector('.unit-module-screen')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));

  app.querySelector('[data-back-unit]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    state.activeModule = null;
    saveProgressToStorage();
    render();
    app.querySelector('.unit-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Subtab Listeners
  app.querySelectorAll('[data-vocab-subtab]').forEach((btn) => btn.addEventListener('click', () => {
    state.activeVocabSubtab = btn.dataset.vocabSubtab;
    saveProgressToStorage();
    render();
  }));

  app.querySelectorAll('[data-grammar-subtab]').forEach((btn) => btn.addEventListener('click', () => {
    state.activeGrammarSubtab = btn.dataset.grammarSubtab;
    saveProgressToStorage();
    render();
  }));

  app.querySelectorAll('[data-game-tab]').forEach((btn) => btn.addEventListener('click', () => {
    state.activeGameTab = Number(btn.dataset.gameTab);
    saveProgressToStorage();
    render();
  }));

  // Vocabulary Stepper, Jump & View Listeners
  app.querySelectorAll('[data-vocab-step]').forEach((btn) => btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const dir = btn.dataset.vocabStep;
    if (dir === 'prev') state.vocabIndex = Math.max(0, (state.vocabIndex || 0) - 1);
    else if (dir === 'next') state.vocabIndex = Math.min(23, (state.vocabIndex || 0) + 1);
    saveProgressToStorage();
    render();
  }));

  app.querySelectorAll('[data-vocab-jump]').forEach((btn) => btn.addEventListener('click', (e) => {
    e.stopPropagation();
    state.vocabIndex = Number(btn.dataset.vocabJump);
    saveProgressToStorage();
    render();
  }));

  app.querySelectorAll('[data-vocab-view]').forEach((btn) => btn.addEventListener('click', (e) => {
    e.stopPropagation();
    state.vocabViewMode = btn.dataset.vocabView;
    saveProgressToStorage();
    render();
  }));

  app.querySelectorAll('[data-vocab-select]').forEach((btn) => btn.addEventListener('click', (e) => {
    e.stopPropagation();
    state.vocabIndex = Number(btn.dataset.vocabSelect);
    state.vocabViewMode = 'card';
    saveProgressToStorage();
    render();
  }));

  // Listening Speed & Audio Control Listeners
  app.querySelectorAll('[data-set-speed]').forEach((btn) => btn.addEventListener('click', (e) => {
    e.stopPropagation();
    state.listeningSpeed = Number(btn.dataset.setSpeed);
    saveProgressToStorage();
    render();
  }));

  app.querySelector('[data-audio-stop]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    stopAudio();
  });

  // Final Test Stepper & Jump Listeners
  app.querySelectorAll('[data-test-step]').forEach((btn) => btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const dir = btn.dataset.testStep;
    if (dir === 'prev') state.testQuestionIndex = Math.max(0, (state.testQuestionIndex || 0) - 1);
    else if (dir === 'next') state.testQuestionIndex = Math.min(9, (state.testQuestionIndex || 0) + 1);
    saveProgressToStorage();
    render();
  }));

  app.querySelectorAll('[data-test-jump]').forEach((btn) => btn.addEventListener('click', (e) => {
    e.stopPropagation();
    state.testQuestionIndex = Number(btn.dataset.testJump);
    saveProgressToStorage();
    render();
  }));

  // Imported primary curriculum: each selection is a real screen in browser history.
  app.querySelectorAll('[data-imported-unit]').forEach((button) => button.addEventListener('click', () => {
    state.importedUnitNumber = Number(button.dataset.importedUnit);
    state.activeModule = null;
    state.activeGameTab = 1;
    state.game1 = { selectedWord: null, selectedPic: null, matches: [], score: 0 };
    state.game2 = { index: 0, placed: [], score: 0, checkResult: null };
    state.game3 = { index: 0, score: 0, selectedOption: null };
    state.game4 = { index: 0, score: 0, selectedOption: null };
    window.history.pushState({ app: 'englimensh', route: 'unit', unit: state.importedUnitNumber, epoch: state.navigationEpoch }, '', '#unit-' + state.importedUnitNumber);
    saveProgressToStorage();
    render();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }));
  app.querySelectorAll('[data-imported-section]').forEach((button) => button.addEventListener('click', () => {
    state.activeModule = button.dataset.importedSection;
    window.history.pushState({ app: 'englimensh', route: 'module', unit: state.importedUnitNumber, module: state.activeModule, epoch: state.navigationEpoch }, '', '#unit-' + state.importedUnitNumber + '-' + state.activeModule);
    saveProgressToStorage();
    render();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }));
  app.querySelectorAll('[data-imported-back]').forEach((button) => button.addEventListener('click', () => {
    const currentRoute = window.history.state;
    const expectedRoute = button.dataset.importedBack === 'unit' ? 'module' : 'unit';
    if (currentRoute?.app === 'englimensh' && currentRoute.epoch === state.navigationEpoch && currentRoute.route === expectedRoute) {
      window.history.back();
      return;
    }
    if (button.dataset.importedBack === 'unit' && state.importedUnitNumber) state.activeModule = null;
    else { state.importedUnitNumber = null; state.activeModule = null; }
    window.history.replaceState({ app: 'englimensh', route: state.importedUnitNumber ? 'unit' : 'grade', unit: state.importedUnitNumber || undefined, epoch: state.navigationEpoch }, '', state.importedUnitNumber ? '#unit-' + state.importedUnitNumber : '#grade');
    saveProgressToStorage();
    render();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }));
  app.querySelector('[data-favorite-current]')?.addEventListener('click', () => {
    const profile = getActiveStudentProfile();
    const track = primaryHtmlCurriculum.tracks.find((item) => item.id === state.path);
    const gradeData = track?.grades.find((item) => item.grade === state.grade);
    const unitData = gradeData?.units.find((item) => item.number === Number(state.importedUnitNumber));
    if (profile && unitData) {
      profile.favorites = profile.favorites || [];
      const label = track.name + ' · Grade ' + state.grade + ' · Unit ' + unitData.number + ': ' + unitData.title;
      profile.favorites = profile.favorites.includes(label) ? profile.favorites.filter((item) => item !== label) : [...profile.favorites, label];
      saveStudentProfiles(); render();
    }
  });
  app.querySelectorAll('[data-student-hub]').forEach((button) => button.addEventListener('click', () => { state.studentTool = button.dataset.studentHub; render(); }));
  app.querySelector('[data-student-theme]')?.addEventListener('change', (event) => {
    const profile = getActiveStudentProfile();
    if (profile) { profile.theme = event.target.value; saveStudentProfiles(); }
    document.documentElement.dataset.studentTheme = event.target.value;
  });
  app.querySelectorAll('[data-save-certificate]').forEach((button) => button.addEventListener('click', () => { document.body.classList.add('printing-certificate'); window.print(); window.setTimeout(() => document.body.classList.remove('printing-certificate'), 800); }));
  const editProfileForm = app.querySelector('[data-edit-student-profile]');
  editProfileForm?.elements.editStudentStage?.addEventListener('change', () => {
    const stageInfo = curriculum.stages.find((item) => item.id === editProfileForm.elements.editStudentStage.value);
    const oldGrade = Number(editProfileForm.elements.editStudentGrade.value);
    editProfileForm.elements.editStudentGrade.innerHTML = (stageInfo?.grades || [1]).map((grade) => '<option value="' + grade + '">Grade ' + grade + '</option>').join('');
    editProfileForm.elements.editStudentGrade.value = String((stageInfo?.grades || [1]).includes(oldGrade) ? oldGrade : (stageInfo?.grades || [1])[0]);
  });
  editProfileForm?.addEventListener('submit', (event) => {
    event.preventDefault(); const profile = getActiveStudentProfile(); if (!profile) return;
    const form = event.currentTarget, nextStage = form.elements.editStudentStage.value, nextGrade = Number(form.elements.editStudentGrade.value) || 1;
    const photoFile = (form.elements.editStudentCamera.files && form.elements.editStudentCamera.files[0]) || (form.elements.editStudentPhoto.files && form.elements.editStudentPhoto.files[0]);
    const finish = () => {
      const changed = profile.stage !== nextStage || Number(profile.grade) !== nextGrade;
      profile.name = String(form.elements.editStudentName.value || '').trim() || profile.name; profile.stage = nextStage; profile.grade = nextGrade;
      profile.paths = nextStage === 'primary' ? ['general','advanced'] : (curriculum.stages.find((item) => item.id === nextStage)?.paths || []).map((item) => item.id);
      profile.path = profile.paths.includes(profile.path) ? profile.path : (profile.paths[0] || 'general');
      if (changed) { saveProgressToStorage(); state.stage=profile.stage; state.grade=profile.grade; state.path=profile.path; resetStudentProgressState(); state.importedUnitNumber=null; state.activeModule=null; loadProgressFromStorage(); }
      saveStudentProfiles(); render();
    };
    if (!photoFile) { finish(); return; }
    const reader = new FileReader();
    reader.onload = () => { const image = new Image(); image.onload = () => { const scale=Math.min(1,640/Math.max(image.width,image.height)); const canvas=document.createElement('canvas'); canvas.width=Math.max(1,Math.round(image.width*scale)); canvas.height=Math.max(1,Math.round(image.height*scale)); const context=canvas.getContext('2d'); if(context){context.drawImage(image,0,0,canvas.width,canvas.height);profile.photo=canvas.toDataURL('image/jpeg',0.78);} finish(); }; image.onerror=finish; image.src=String(reader.result||''); };
    reader.onerror=finish; reader.readAsDataURL(photoFile);
  });
  const activeProfile = getActiveStudentProfile();
  document.documentElement.dataset.studentTheme = activeProfile?.theme || 'classic';
  app.querySelector('[data-switch-profile]')?.addEventListener('click', () => { saveProgressToStorage(); activeStudentId = null; state.importedUnitNumber = null; state.activeModule = null; render(); });
  app.querySelector('[data-explore-stages]')?.addEventListener('click', () => { const panel = app.querySelector('.selection-panel'); if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none'; });
  app.querySelector('[data-home]')?.addEventListener('click', (event) => {
    event.preventDefault();
    state.importedUnitNumber = null;
    state.activeModule = null;
    state.navigationEpoch += 1;
    window.history.replaceState({ app: 'englimensh', route: 'grade', epoch: state.navigationEpoch }, '', '#grade');
    saveProgressToStorage();
    render();
    window.scrollTo({ top: 0, behavior: 'auto' });
  });

  // Imported primary curriculum quiz listener (persists across navigation and reloads)
  app.querySelectorAll('.imported-answer').forEach((button) => button.addEventListener('click', () => {
    const card = button.closest('[data-imported-question]');
    if (!card || card.dataset.answered === 'true' || button.disabled) return;
    const questionId = card.dataset.importedQuestion;
    const correct = Number(button.dataset.correct);
    const chosen = Number(button.dataset.choice);
    const previous = getQuestionState(questionId);
    const wrongChoices = previous.wrongChoices.map(String);
    const feedback = card.querySelector('.imported-feedback');

    if (chosen === correct) {
      state.quizAnswers[questionId] = {
        choice: String(chosen),
        isCorrect: true,
        wrongChoices
      };
      card.dataset.answered = 'true';
      playFeedbackSound(true);
      button.classList.add('is-correct');
      feedback.textContent = 'Correct! Well done.';
      feedback.classList.remove('incorrect');
      feedback.classList.add('correct');
      card.querySelectorAll('.imported-answer').forEach((option) => {
        option.disabled = true;
        if (option !== button) option.classList.remove('is-wrong');
      });
    } else {
      playFeedbackSound(false);
      if (!wrongChoices.includes(String(chosen))) wrongChoices.push(String(chosen));
      state.quizAnswers[questionId] = {
        choice: null,
        isCorrect: false,
        wrongChoices
      };
      button.classList.add('is-wrong');
      button.disabled = true;
      feedback.textContent = 'Not quite. Try another answer.';
      feedback.classList.remove('correct');
      feedback.classList.add('incorrect');
    }
    saveProgressToStorage();
    if (state.activeModule === 'tests') render();
  }));

  // Quiz Option Retry Listener (Allows retrying wrong options until correct answer is chosen)
  app.querySelectorAll('[data-quiz-question]').forEach((button) => button.addEventListener('click', () => {
    const qId = button.dataset.quizQuestion;
    const choice = button.dataset.quizChoice;
    const qState = getQuestionState(qId);
    if (qState.isCorrect) return; // Locked once answered correctly

    // Lookup question correct answer from draft
    let correctAnswer = null;
    if (p1u1Draft && p1u1Draft.sections) {
      p1u1Draft.sections.forEach((sec) => {
        const found = sec.items?.find((it) => (it.itemId || '') === qId);
        if (found && found.content && typeof found.content.correctAnswer === 'string') {
          correctAnswer = found.content.correctAnswer;
        }
      });
    }

    if (correctAnswer) {
      if (choice === correctAnswer) {
        playFeedbackSound(true);
        state.quizAnswers[qId] = {
          choice,
          isCorrect: true,
          wrongChoices: qState.wrongChoices
        };
      } else {
        playFeedbackSound(false);
        const updatedWrong = qState.wrongChoices.includes(choice) ? qState.wrongChoices : [...qState.wrongChoices, choice];
        state.quizAnswers[qId] = {
          choice,
          isCorrect: false,
          wrongChoices: updatedWrong
        };
      }
    } else {
      playFeedbackSound(true);
      state.quizAnswers[qId] = { choice, isCorrect: true, wrongChoices: [] };
    }
    saveProgressToStorage();
    render();
  }));

  // Preview Listeners
  app.querySelectorAll('[data-candidate-file]').forEach((button) => button.addEventListener('click', (e) => { e.stopPropagation(); state.preview = { file: button.dataset.candidateFile, page: Number(button.dataset.candidatePage) || 1 }; render(); app.querySelector('.pdf-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
  app.querySelectorAll('[data-unit-preview]').forEach((button) => button.addEventListener('click', (e) => { e.stopPropagation(); state.preview = { file: button.dataset.unitPreview, page: Number(button.dataset.unitPage) || 1 }; render(); app.querySelector('.pdf-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
  app.querySelectorAll('[data-preview-file]').forEach((button) => button.addEventListener('click', (e) => { e.stopPropagation(); state.preview = { file: button.dataset.previewFile, page: Number(button.dataset.previewPage) || 1 }; render(); app.querySelector('.pdf-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
  app.querySelector('[data-close-preview]')?.addEventListener('click', (e) => { e.stopPropagation(); state.preview = null; render(); });
  const resetImportedRoute = () => { state.navigationEpoch += 1; window.history.replaceState({ app: 'englimensh', route: 'grade', epoch: state.navigationEpoch }, '', '#grade'); };
  app.querySelectorAll('.stage-card[data-stage]').forEach((button) => button.addEventListener('click', (e) => { e.stopPropagation(); saveProgressToStorage(); state.stage = button.dataset.stage; const next = currentStage(); state.grade = next?.grades?.[0] ?? null; state.path = next?.paths?.[0]?.id ?? ''; const profile = getActiveStudentProfile(); if (profile) { profile.stage = state.stage; profile.grade = state.grade || 1; profile.path = state.path; saveStudentProfiles(); } resetStudentProgressState(); loadProgressFromStorage(); state.search = ''; state.preview = null; state.unitSelection = null; resetImportedRoute(); render(); }));
  app.querySelectorAll('.grade-button[data-grade]').forEach((button) => button.addEventListener('click', (e) => { e.stopPropagation(); saveProgressToStorage(); state.grade = Number(button.dataset.grade); const profile = getActiveStudentProfile(); if (profile) { profile.grade = state.grade; saveStudentProfiles(); } resetStudentProgressState(); loadProgressFromStorage(); state.search = ''; state.preview = null; state.unitSelection = null; resetImportedRoute(); render(); }));
  app.querySelectorAll('.path-button[data-path]').forEach((button) => button.addEventListener('click', (e) => { e.stopPropagation(); saveProgressToStorage(); state.path = button.dataset.path; const profile = getActiveStudentProfile(); if (profile) { profile.path = state.path; saveStudentProfiles(); } resetStudentProgressState(); loadProgressFromStorage(); state.search = ''; state.preview = null; state.unitSelection = null; resetImportedRoute(); render(); }));

  // TTS Listeners
  app.querySelectorAll('[data-tts-text]').forEach((button) => button.addEventListener('click', (e) => {
    e.stopPropagation();
    speakText(button.dataset.ttsText);
  }));

  // Self Intro Listeners
  app.querySelector('[data-intro-name]')?.addEventListener('input', (e) => {
    state.selfIntro.name = e.target.value;
    saveProgressToStorage();
    const bubble = app.querySelector('.self-intro-bubble strong');
    if (bubble) bubble.textContent = `Hello! I am ${e.target.value.trim() || '________'}.`;
  });
  app.querySelectorAll('[data-intro-avatar]').forEach((btn) => btn.addEventListener('click', () => {
    state.selfIntro.avatar = btn.dataset.introAvatar;
    saveProgressToStorage();
    render();
  }));

  // Politeness Listeners
  app.querySelectorAll('[data-politeness-id]').forEach((btn) => btn.addEventListener('click', () => {
    state.politeness.answers[btn.dataset.politenessId] = btn.dataset.politenessVal;
    saveProgressToStorage();
    render();
  }));

  // Game 1 Matching Listeners
  app.querySelectorAll('[data-match-word]').forEach((btn) => btn.addEventListener('click', () => {
    const word = btn.dataset.matchWord;
    if (state.game1.matches.includes(word)) return;
    if (state.game1.selectedPic) {
      if (state.game1.selectedPic === word) { state.game1.matches.push(word); playFeedbackSound(true, 'match'); }
      else playFeedbackSound(false, 'match');
      state.game1.selectedWord = null;
      state.game1.selectedPic = null;
    } else {
      state.game1.selectedWord = word;
    }
    saveProgressToStorage();
    render();
  }));
  app.querySelectorAll('[data-match-pic]').forEach((btn) => btn.addEventListener('click', () => {
    const word = btn.dataset.matchPic;
    if (state.game1.matches.includes(word)) return;
    if (state.game1.selectedWord) {
      if (state.game1.selectedWord === word) { state.game1.matches.push(word); playFeedbackSound(true, 'match'); }
      else playFeedbackSound(false, 'match');
      state.game1.selectedWord = null;
      state.game1.selectedPic = null;
    } else {
      state.game1.selectedPic = word;
    }
    saveProgressToStorage();
    render();
  }));

  // Game 2 Word Builder Listeners
  app.querySelectorAll('[data-place-tile]').forEach((btn) => btn.addEventListener('click', () => {
    const char = btn.dataset.placeTile;
    const wordsData = getPrimaryGameWords(6)?.map((item) => item.target) || ['tiger', 'tomato', 'table', 'tree', 'ink', 'insect'];
    const target = wordsData[state.game2.index] || '';
    if (state.game2.placed.length < target.length) {
      state.game2.placed.push(char);
      saveProgressToStorage();
      render();
    }
  }));
  app.querySelectorAll('[data-unplace-tile]').forEach((btn) => btn.addEventListener('click', () => {
    const idx = Number(btn.dataset.unplaceTile);
    if (state.game2.placed[idx] !== undefined) {
      state.game2.placed.splice(idx, 1);
      state.game2.checkResult = null;
      saveProgressToStorage();
      render();
    }
  }));
  app.querySelector('[data-builder-clear]')?.addEventListener('click', () => {
    state.game2.placed = [];
    state.game2.checkResult = null;
    saveProgressToStorage();
    render();
  });
  app.querySelector('[data-builder-check]')?.addEventListener('click', (btn) => {
    const target = btn.target.dataset.builderCheck;
    if (!state.game2.checkResult) {
      const isCorrect = state.game2.placed.join('') === target;
      playFeedbackSound(isCorrect, 'builder');
      if (isCorrect) state.game2.score += 1;
      state.game2.checkResult = { isCorrect };
      saveProgressToStorage();
      render();
    }
  });
  app.querySelector('[data-builder-next]')?.addEventListener('click', () => {
    if (state.game2.index < 6) state.game2.index += 1;
    state.game2.placed = [];
    state.game2.checkResult = null;
    saveProgressToStorage();
    render();
  });

  // Game 3 Listen and Choose Listeners
  app.querySelectorAll('[data-listen-choose]').forEach((btn) => btn.addEventListener('click', () => {
    if (!state.game3.selectedOption) {
      const chosen = btn.dataset.listenChoose;
      state.game3.selectedOption = chosen;
      const targets = getPrimaryGameWords(6)?.map((item) => item.target) || ['hello', 'goodbye', 'teacher', 'board', 'desk', 'insect'];
      const isCorrect = chosen === targets[state.game3.index];
      playFeedbackSound(isCorrect, 'listen');
      if (isCorrect) state.game3.score += 1;
      saveProgressToStorage();
      render();
    }
  }));
  app.querySelector('[data-listen-next]')?.addEventListener('click', () => {
    if (state.game3.index < 6) state.game3.index += 1;
    state.game3.selectedOption = null;
    saveProgressToStorage();
    render();
  });

  // Game 4 Classroom Commands (Grades 1-3)
  app.querySelectorAll('[data-command-choose]').forEach((btn) => btn.addEventListener('click', () => {
    if (!state.game4.selectedOption) {
      const chosen = btn.dataset.commandChoose;
      state.game4.selectedOption = chosen;
      const targets = getPrimaryGameWords(4)?.map((item) => item.target) || ['stand up', 'sit down', 'open your bag', 'close your book'];
      const isCorrect = chosen === targets[state.game4.index];
      playFeedbackSound(isCorrect, 'challenge');
      if (isCorrect) state.game4.score += 1;
      saveProgressToStorage();
      render();
    }
  }));
  app.querySelector('[data-command-next]')?.addEventListener('click', () => {
    if (state.game4.index < 4) state.game4.index += 1;
    state.game4.selectedOption = null;
    saveProgressToStorage();
    render();
  });

  // Game 4 Meaning Challenge (Grades 4-6): English prompt, Arabic answer choices.
  app.querySelectorAll('[data-meaning-choose]').forEach((btn) => btn.addEventListener('click', () => {
    if (!state.game4.selectedOption) {
      const chosen = btn.dataset.meaningChoose;
      state.game4.selectedOption = chosen;
      const meaningWords = getPrimaryGameWords(4);
      const meanings = meaningWords?.length ? meaningWords.map((item) => item.arabic) : ['شجاع', 'حذر', 'رحلة', 'يحمي'];
      const isCorrect = chosen === meanings[state.game4.index];
      playFeedbackSound(isCorrect, 'challenge');
      if (isCorrect) state.game4.score += 1;
      saveProgressToStorage();
      render();
    }
  }));
  app.querySelector('[data-meaning-next]')?.addEventListener('click', () => {
    if (state.game4.index < 4) state.game4.index += 1;
    state.game4.selectedOption = null;
    saveProgressToStorage();
    render();
  });

  // Game Reset Listeners
  app.querySelectorAll('[data-reset-game]').forEach((btn) => btn.addEventListener('click', () => {
    const gNum = btn.dataset.resetGame;
    if (gNum === '1') state.game1 = { selectedWord: null, selectedPic: null, matches: [], score: 0 };
    if (gNum === '2') state.game2 = { index: 0, placed: [], score: 0, checkResult: null };
    if (gNum === '3') state.game3 = { index: 0, score: 0, selectedOption: null };
    if (gNum === '4') state.game4 = { index: 0, score: 0, selectedOption: null };
    saveProgressToStorage();
    render();
  }));

  app.querySelector('[data-reset-reading]')?.addEventListener('click', () => {
    resetReadingProgress();
    render();
  });

  app.querySelector('[data-reset-listening]')?.addEventListener('click', () => {
    resetListeningProgress();
    render();
  });

  state._renderViewKey = currentViewKey;
  if (!state._routeChanged && previousScrollY > 0) {
    requestAnimationFrame(() => window.scrollTo({ top: previousScrollY, behavior: 'instant' }));
  }
}

// Restore a coherent in-app back stack for Android Back and browser Back.
loadStudentProfiles();
activeStudentId = null;
window.history.replaceState({ app: 'englimensh', route: 'grade', epoch: state.navigationEpoch }, '', window.location.pathname + window.location.search + '#grade');
if (state.importedUnitNumber) {
  window.history.pushState({ app: 'englimensh', route: 'unit', unit: state.importedUnitNumber, epoch: state.navigationEpoch }, '', '#unit-' + state.importedUnitNumber);
  if (state.activeModule) window.history.pushState({ app: 'englimensh', route: 'module', unit: state.importedUnitNumber, module: state.activeModule, epoch: state.navigationEpoch }, '', '#unit-' + state.importedUnitNumber + '-' + state.activeModule);
}
window.addEventListener('popstate', (event) => {
  const route = event.state?.app === 'englimensh' && event.state.epoch === state.navigationEpoch ? event.state : { route: 'grade' };
  if (route.route === 'grade' && event.state?.epoch !== state.navigationEpoch) {
    window.history.replaceState({ app: 'englimensh', route: 'grade', epoch: state.navigationEpoch }, '', '#grade');
  }
  state.importedUnitNumber = route.route === 'unit' || route.route === 'module' ? Number(route.unit) : null;
  state.activeModule = route.route === 'module' ? route.module : null;
  saveProgressToStorage();
  render();
  window.scrollTo({ top: 0, behavior: 'auto' });
});
render();
