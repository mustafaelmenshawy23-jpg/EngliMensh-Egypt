import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { detectSpeakerGender, chooseSpeakerVoice } from './lib/tts-voice-selection.mjs';
import curriculum from './data/curriculum/structure.json';
import sourceIndex from '../data/curriculum/source-book-index.draft.json';
import unitModules from './data/lessons/unit-modules.draft.json';
import './style.css';
import { getPreparatoryHtmlCourse } from './data/preparatory-html-registry.js';
import preparatoryVocabulary from './data/preparatory-vocabulary.json';

const approvedDraftModules = import.meta.glob('./data/approved-unit-drafts/*.json', { eager: true, import: 'default' });
function isApprovedUnitDraft(draft) {
  const requiredTypes = unitModules.sectionTypes || [];
  if (!draft || draft.datasetStatus !== 'approved' || draft.reviewStatus !== 'approved' ||
      !draft.reviewedBy || !draft.reviewedAt || draft.approval?.confirmedVisualReview !== true ||
      !draft.sourceFingerprint || draft.approval?.sourceFingerprint !== draft.sourceFingerprint ||
      typeof draft.bookId !== 'string' || !Number.isInteger(draft.unitNumber) || !Array.isArray(draft.sections)) return false;
  const types = draft.sections.map((section) => section.type);
  if (types.length !== requiredTypes.length || new Set(types).size !== requiredTypes.length ||
      !requiredTypes.every((type) => types.includes(type))) return false;
  return draft.sections.every((section) =>
    Array.isArray(section.items) && section.items.every((item) => item.reviewStatus === 'approved')
  );
}
const unitDraftRegistry = new Map(
  Object.values(approvedDraftModules)
    .filter(isApprovedUnitDraft)
    .map((draft) => [`${draft.bookId}-unit-${draft.unitNumber}`, draft])
);
const p1u1Draft = unitDraftRegistry.get('primary1-student-term1-unit-1') || null;

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
  stage: 'primary',
  grade: 1,
  path: 'general',
  search: '',
  preview: null,
  htmlUnitSelection: null,
  htmlModuleSelection: null,
  htmlGame: { id: 'picture-match', index: 0, score: 0, selectedWord: null, selectedImage: null, matched: [], selectedOption: null, placed: [], flipped: false, opened: null, feedback: '' },
  unitSelection: null,
  activeModule: null, // 'vocabulary', 'grammar', 'reading', 'listening', 'games', 'comprehensive_test'
  activeVocabSubtab: 'words', // 'words' or 'practice'
  activeGrammarSubtab: 'rules', // 'rules' or 'practice'
  activeGameTab: 1, // 1, 2, 3, 4
  vocabIndex: 0, // 0 to 23 for focused card view
  vocabViewMode: 'card', // 'card' or 'grid'
  testQuestionIndex: 0, // 0 to 9 for 1-question-at-a-time test
  listeningSpeed: 1.0, // 0.75, 1.0, 1.25
  ttsVoicePrefs: { male: '', female: '' },
  availableTtsVoices: [],
  ttsVoiceStatus: 'loading',
  quizAnswers: {},
  shuffledOptions: {},
  game1: { selectedWord: null, selectedPic: null, matches: [], score: 0 },
  game2: { index: 0, placed: [], score: 0, checkResult: null },
  game3: { index: 0, score: 0, selectedOption: null },
  game4: { index: 0, score: 0, selectedOption: null },
  selfIntro: { name: 'Omar', avatar: '👧' },
  politeness: { answers: {} }
};

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
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const isPlainObject = (val) => Boolean(val && typeof val === 'object' && !Array.isArray(val));
    if (parsed && typeof parsed === 'object') {
      if (isPlainObject(parsed.quizAnswers)) state.quizAnswers = parsed.quizAnswers;
      if (isPlainObject(parsed.shuffledOptions)) state.shuffledOptions = parsed.shuffledOptions;
      if (parsed.activeModule !== undefined) state.activeModule = parsed.activeModule;
      if (parsed.activeVocabSubtab) state.activeVocabSubtab = parsed.activeVocabSubtab;
      if (parsed.activeGrammarSubtab) state.activeGrammarSubtab = parsed.activeGrammarSubtab;
      if (parsed.activeGameTab) state.activeGameTab = parsed.activeGameTab;
      if (typeof parsed.vocabIndex === 'number' && parsed.vocabIndex >= 0 && parsed.vocabIndex < 24) state.vocabIndex = parsed.vocabIndex;
      if (parsed.vocabViewMode === 'card' || parsed.vocabViewMode === 'grid') state.vocabViewMode = parsed.vocabViewMode;
      if (typeof parsed.testQuestionIndex === 'number' && parsed.testQuestionIndex >= 0 && parsed.testQuestionIndex < 10) state.testQuestionIndex = parsed.testQuestionIndex;
      if (typeof parsed.listeningSpeed === 'number') state.listeningSpeed = parsed.listeningSpeed;
      if (isPlainObject(parsed.ttsVoicePrefs)) state.ttsVoicePrefs = { ...state.ttsVoicePrefs, ...parsed.ttsVoicePrefs };
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
      activeVocabSubtab: state.activeVocabSubtab,
      activeGrammarSubtab: state.activeGrammarSubtab,
      activeGameTab: state.activeGameTab,
      vocabIndex: state.vocabIndex,
      vocabViewMode: state.vocabViewMode,
      testQuestionIndex: state.testQuestionIndex,
      listeningSpeed: state.listeningSpeed,
      ttsVoicePrefs: state.ttsVoicePrefs,
      game1: state.game1,
      game2: state.game2,
      game3: state.game3,
      game4: state.game4,
      selfIntro: state.selfIntro,
      politeness: state.politeness
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
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

// Discover platform voices instead of assuming that speakerGender metadata proves a matching voice exists.
let ttsVoiceDiscoveryStarted = false;

function normalizeTtsVoices(voices, nativePlatform) {
  return (Array.isArray(voices) ? voices : []).map((voice, index) => {
    const name = String(voice?.name || `Voice ${index + 1}`);
    const lang = String(voice?.lang || 'und');
    const voiceURI = String(voice?.voiceURI || '');
    const id = [voiceURI || name, lang].join('|');
    return {
      id,
      name,
      lang,
      voiceURI,
      gender: detectSpeakerGender(voice),
      nativeIndex: nativePlatform ? index : null,
      raw: nativePlatform ? null : voice
    };
  });
}

async function loadAvailableTtsVoices() {
  if (ttsVoiceDiscoveryStarted) return;
  ttsVoiceDiscoveryStarted = true;
  try {
    let voices = [];
    if (Capacitor.isNativePlatform()) {
      const result = await TextToSpeech.getSupportedVoices();
      voices = normalizeTtsVoices(result?.voices || [], true);
    } else if (typeof window !== 'undefined' && window.speechSynthesis) {
      voices = normalizeTtsVoices(window.speechSynthesis.getVoices(), false);
      if (!voices.length) {
        window.speechSynthesis.addEventListener('voiceschanged', () => {
          state.availableTtsVoices = normalizeTtsVoices(window.speechSynthesis.getVoices(), false);
          state.ttsVoiceStatus = state.availableTtsVoices.length ? 'ready' : 'unavailable';
          render();
        }, { once: true });
      }
    }
    state.availableTtsVoices = voices;
    state.ttsVoiceStatus = voices.length ? 'ready' : 'unavailable';
  } catch (error) {
    state.availableTtsVoices = [];
    state.ttsVoiceStatus = 'unavailable';
    console.warn('TTS voice discovery is unavailable on this platform:', error);
  }
  render();
}

function renderSpeakerVoiceSettings() {
  const voices = state.availableTtsVoices || [];
  if (!voices.length) {
    return '<div class="speaker-voice-settings"><p class="speaking-practice-note">Voice list unavailable. Playback uses the platform default English voice; male/female matching is not verified on this device.</p></div>';
  }
  const renderSelect = (gender, label) => {
    const selected = state.ttsVoicePrefs?.[gender] || '';
    const options = voices.map((voice) => {
      const detail = [voice.lang, voice.gender !== 'unknown' ? voice.gender : 'gender not identified'].filter(Boolean).join(' · ');
      return `<option value="${escapeHtml(voice.id)}" ${selected === voice.id ? 'selected' : ''}>${escapeHtml(voice.name)} — ${escapeHtml(detail)}</option>`;
    }).join('');
    const automaticLabel = voices.some((voice) => voice.gender === gender)
      ? 'Automatic · use a voice explicitly marked ' + gender
      : 'Automatic · no ' + gender + ' voice identified';
    return `<label class="speaker-voice-choice"><span>${label}</span><select data-tts-voice="${gender}"><option value="">${escapeHtml(automaticLabel)}</option>${options}</select></label>`;
  };
  return `<div class="speaker-voice-settings"><strong>Dialogue voice settings</strong><div class="speaker-voice-controls">${renderSelect('male', 'Male speaker voice')}${renderSelect('female', 'Female speaker voice')}</div><small>Choose a voice for each role. Automatic matching is used only when the platform voice name explicitly identifies its gender; otherwise the system default is used.</small></div>`;
}

function getSpeakerVoice(gender) {
  return chooseSpeakerVoice(state.availableTtsVoices || [], state.ttsVoicePrefs || {}, gender);
}

// Use the selected native/browser voice when one is available; otherwise disclose and use the system default.
async function speakText(text, rate = null, speakerGender = null) {
  const phrase = String(text || '').trim();
  if (!phrase) return;
  const speechRate = Number(rate || state.listeningSpeed || 0.85);
  const voice = ['male', 'female'].includes(speakerGender) ? getSpeakerVoice(speakerGender) : null;

  if (Capacitor.isNativePlatform()) {
    try {
      if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
      await TextToSpeech.stop().catch(() => {});
      const options = {
        text: phrase,
        lang: 'en-US',
        rate: speechRate,
        pitch: 1,
        volume: 1,
        queueStrategy: 0
      };
      if (Number.isInteger(voice?.nativeIndex)) options.voice = voice.nativeIndex;
      await TextToSpeech.speak(options);
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
      if (voice?.raw) utterance.voice = voice.raw;
      await new Promise((resolve) => {
        utterance.onend = resolve;
        utterance.onerror = (event) => {
          console.warn('Browser speech playback error:', event.error);
          resolve();
        };
        window.speechSynthesis.speak(utterance);
      });
    } catch (error) {
      console.warn('Audio playback error:', error);
    }
  } else {
    console.warn('No supported text-to-speech engine is available.');
  }
}

async function playDialogue(dialogue) {
  if (!Array.isArray(dialogue) || !dialogue.length) return;
  await stopAudio();
  for (const turn of dialogue) {
    if (turn?.text) await speakText(turn.text, null, turn.speakerGender || null);
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
  return sourceIndex.books.filter((book) => book.pathwayId === pathwayId && (
    state.stage === 'egyptian-baccalaureate' || book.grade === gradeName
  ));
}

function bookUrl(file, page) {
  const base = import.meta.env.VITE_BOOKS_BASE_URL || `${import.meta.env.BASE_URL}books/`;
  const path = `${base}${encodeURIComponent(file)}`;
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
      const hasApprovedDraft = unitDraftRegistry.has(`${book.id}-unit-${unit.number}`);
      return Number.isInteger(unit.startPdfPage) || hasApprovedDraft
        ? `<button class="unit-link" type="button" data-unit-book="${escapeHtml(book.id)}" data-unit-number="${unit.number}"><strong>${escapeHtml(title)}</strong><span>${pageLabel} · Open unit</span></button>`
        : `<div class="unit-link unavailable"><strong>${escapeHtml(title)}</strong><span>${pageLabel}</span></div>`;
    }).join('');
    const typeLabel = book.documentType === 'student_book' ? 'Student book'
      : book.documentType === 'assessment' ? 'Assessment book'
        : book.documentType === 'reader' ? 'Reader' : 'Supplementary reference';
    return `<article class="book-card"><div class="book-card-head"><div><span class="book-type">${typeLabel}</span><h3>${escapeHtml(book.grade)} · ${book.term ? `Term ${book.term}` : 'Course book'}</h3><p>${escapeHtml(book.sourceFile)}</p></div><button class="source-open" type="button" data-preview-file="${escapeHtml(book.sourceFile)}" data-preview-page="1">Preview full PDF ↗</button></div>${units ? `<div class="unit-list">${units}</div>` : '<p class="no-units">No unit list is indexed for this document yet. The original PDF is available in the preview above.</p>'}</article>`;
  }).join('');
}

function getSelectedPreparatoryUnit() {
  const course = getPreparatoryHtmlCourse(state.grade, state.path);
  return state.htmlUnitSelection ? course?.units?.find((unit) => unit.id === state.htmlUnitSelection.unitId) || null : null;
}

function getPreparatoryUnitWords(unit = getSelectedPreparatoryUnit()) {
  if (!unit) return [];
  const registry = preparatoryVocabulary.units || {};
  if (unit.id === 'all' && state.grade === 3 && state.path === 'general') {
    return [1, 2, 3, 4, 5, 6].flatMap((number) => registry[`3:general:${number}`]?.words || []);
  }
  return registry[`${state.grade}:${state.path}:${unit.number || unit.id}`]?.words || [];
}

function prepImageMarkup(item, className = 'prep-vocab-image') {
  if (item.image) {
    const imageSrc = `${import.meta.env.BASE_URL}${item.image.replace(/^\/+/, '')}`;
    return `<img class="${className}" src="${escapeHtml(imageSrc)}" alt="${escapeHtml(item.word)}" title="${escapeHtml([item.attribution, item.license].filter(Boolean).join(' · '))}" loading="lazy" />`;
  }
  if (item.svg) return `<img class="${className}" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(item.svg)}" alt="${escapeHtml(item.word)}" loading="lazy" />`;
  return `<div class="${className} prep-image-missing" role="img" aria-label="Picture not available for ${escapeHtml(item.word)}">Picture pending</div>`;
}

function renderPreparatoryVocabulary(words) {
  if (!words.length) return '<div class="prep-game-empty">Vocabulary content is not available in the source package for this unit yet.</div>';
  return `
    <section class="prep-vocabulary-section">
      <div class="prep-vocabulary-heading"><div><p class="eyebrow">UNIT WORD BANK</p><h3>Learn the words with pictures</h3><p>Look, read, listen and remember.</p></div><span>${words.length} words</span></div>
      <div class="prep-vocabulary-grid">
        ${words.map((item, index) => `
          <article class="prep-vocabulary-card">
            <div class="prep-vocabulary-image-wrap">${prepImageMarkup(item, 'prep-vocabulary-image')}</div>
            <div class="prep-vocabulary-number">WORD ${index + 1}</div>
            <h4 dir="ltr">${escapeHtml(item.word)}</h4>
            ${item.arabic ? `<strong class="prep-vocabulary-arabic" dir="rtl">${escapeHtml(item.arabic)}</strong>` : ''}
            ${item.definition ? `<p>${escapeHtml(item.definition)}</p>` : ''}
            ${item.example ? `<div class="prep-vocabulary-example" dir="ltr">${escapeHtml(item.example)}</div>` : ''}
            <button type="button" class="tts-play-btn small" data-tts-text="${escapeHtml(item.word)}">🔊 Listen</button>
            ${item.imageSource && item.sourceUrl ? `<a class="prep-vocabulary-credit" href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.imageSource)} · ${escapeHtml(item.license || '')}</a>${item.licenseUrl ? ` <a href="${escapeHtml(item.licenseUrl)}" target="_blank" rel="noopener noreferrer">License</a>` : ''}` : ''}
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderPreparatoryGame(words) {
  const games = [
    { id: 'picture-match', title: 'Picture Match', desc: 'Match each word to its picture', icon: '🧩' },
    { id: 'picture-quiz', title: 'Picture Quiz', desc: 'Choose the word that names the picture', icon: '🖼️' },
    { id: 'anagram', title: 'Word Jumble', desc: 'Rebuild the word from mixed letters', icon: '🔤' },
    { id: 'meaning-quest', title: 'Meaning Quest', desc: 'Find the word from its meaning', icon: '🔎' },
    { id: 'open-box', title: 'Open the Box', desc: 'Open a mystery box and solve its clue', icon: '🎁' },
    { id: 'flashcards', title: 'Flashcard Flip', desc: 'Reveal, learn and remember each word', icon: '🃏' }
  ];
  const game = state.htmlGame || {};
  const current = words[game.index % Math.max(words.length, 1)];
  const shuffled = (items) => [...items].sort((a, b) => a.word.localeCompare(b.word));
  const optionsFor = (target) => {
    const distractors = words.filter((item) => item.word !== target.word).sort((a, b) => a.word.localeCompare(b.word)).slice(0, 3);
    return [target, ...distractors].sort((a, b) => (a.word + state.grade).localeCompare(b.word + state.grade));
  };
  let body = '<div class="prep-game-empty">This unit has no verified vocabulary records yet. The original lesson is still available in its learning sections.</div>';
  if (words.length && current) {
    if (game.id === 'picture-match') {
      const round = shuffled(words).slice(0, Math.min(4, words.length));
      const matched = game.matched || [];
      body = `
        <div class="prep-game-instruction">Choose a word, then choose its matching picture.</div>
        <div class="prep-match-layout">
          <div class="prep-match-column"><h4>Words</h4>${round.map((item) => `<button class="prep-match-word ${matched.includes(item.word) ? 'is-matched' : ''} ${game.selectedWord === item.word ? 'is-selected' : ''}" data-prep-match-word="${escapeHtml(item.word)}" ${matched.includes(item.word) ? 'disabled' : ''}>${escapeHtml(item.word)}<small dir="rtl">${escapeHtml(item.arabic || '')}</small></button>`).join('')}</div>
          <div class="prep-match-column"><h4>Pictures</h4>${[...round].reverse().map((item) => `<button class="prep-match-picture ${matched.includes(item.word) ? 'is-matched' : ''} ${game.selectedImage === item.word ? 'is-selected' : ''}" data-prep-match-image="${escapeHtml(item.word)}" ${matched.includes(item.word) ? 'disabled' : ''}>${prepImageMarkup(item, 'prep-game-picture')}<span>${matched.includes(item.word) ? 'Matched ✓' : 'Choose picture'}</span></button>`).join('')}</div>
        </div>
        <div class="prep-game-progress">Matched ${matched.length} / ${round.length} · Score ${game.score || 0}</div>
        ${matched.length === round.length ? '<div class="prep-game-feedback success">Excellent! All pairs matched.</div>' : ''}
        <button class="prep-game-secondary" data-prep-game-reset>New round</button>
      `;
    } else if (game.id === 'picture-quiz') {
      const options = optionsFor(current);
      body = `
        <div class="prep-game-progress">Question ${game.index + 1} / ${words.length} · Score ${game.score || 0}</div>
        <div class="prep-picture-question">${prepImageMarkup(current, 'prep-question-picture')}<p>Which word matches this picture?</p></div>
        <div class="prep-game-options">${options.map((item) => `<button data-prep-game-option="${escapeHtml(item.word)}" class="${game.selectedOption ? (item.word === current.word ? 'is-correct' : item.word === game.selectedOption ? 'is-wrong' : '') : ''}" ${game.selectedOption ? 'disabled' : ''}>${escapeHtml(item.word)}</button>`).join('')}</div>
        ${game.feedback ? `<div class="prep-game-feedback ${game.feedback === 'correct' ? 'success' : 'error'}">${game.feedback === 'correct' ? 'Correct answer! Great job.' : 'Not quite. The correct word is ' + escapeHtml(current.word) + '.'}<button data-prep-game-next>Next</button></div>` : ''}
      `;
    } else if (game.id === 'anagram') {
      const letters = current.word.toLowerCase().replace(/[^a-z]/g, '').split('').sort((a, b) => b.localeCompare(a));
      body = `
        <div class="prep-game-progress">Word ${game.index + 1} / ${words.length} · Score ${game.score || 0}</div>
        <div class="prep-anagram-card">${prepImageMarkup(current, 'prep-question-picture')}<p dir="rtl">${escapeHtml(current.arabic || current.definition || 'Build the word')}</p><div class="prep-letter-slots">${letters.map((_, i) => `<span>${escapeHtml(Number.isInteger((game.placed || [])[i]) ? letters[(game.placed || [])[i]] : '＿')}</span>`).join('')}</div><div class="prep-letter-bank">${letters.map((letter, i) => `<button data-prep-letter="${i}" ${(game.placed || []).filter((x) => x.index === i).length ? 'disabled' : ''}>${letter}</button>`).join('')}</div><button class="prep-game-secondary" data-prep-word-clear>Clear</button><button class="prep-game-primary" data-prep-word-check>Check word</button></div>
        ${game.feedback ? `<div class="prep-game-feedback ${game.feedback === 'correct' ? 'success' : 'error'}">${game.feedback === 'correct' ? 'Correct spelling!' : 'Try again.'}<button data-prep-game-next>Next word</button></div>` : ''}
      `;
    } else if (game.id === 'meaning-quest') {
      const options = optionsFor(current);
      body = `
        <div class="prep-game-progress">Challenge ${game.index + 1} / ${words.length} · Score ${game.score || 0}</div>
        <div class="prep-meaning-card"><span>WORD DETECTIVE</span>${current.definition || current.arabic ? `<h3>Which word means…?</h3><p>${escapeHtml(current.definition || current.arabic)}</p>` : `<h3>Which word matches this picture?</h3>${prepImageMarkup(current, 'prep-game-picture')}`}</div>
        <div class="prep-game-options">${options.map((item) => `<button data-prep-game-option="${escapeHtml(item.word)}" class="${game.selectedOption ? (item.word === current.word ? 'is-correct' : item.word === game.selectedOption ? 'is-wrong' : '') : ''}" ${game.selectedOption ? 'disabled' : ''}>${escapeHtml(item.word)}</button>`).join('')}</div>
        ${game.feedback ? `<div class="prep-game-feedback ${game.feedback === 'correct' ? 'success' : 'error'}">${game.feedback === 'correct' ? 'That is right!' : 'Correct word: ' + escapeHtml(current.word)}<button data-prep-game-next>Continue</button></div>` : ''}
      `;
    } else if (game.id === 'open-box') {
      const boxes = shuffled(words).slice(0, Math.min(6, words.length));
      body = `
        <div class="prep-game-instruction">Choose a mystery box. Read its clue and identify the word.</div>
        <div class="prep-box-grid">${boxes.map((item, i) => `<button data-prep-open-box="${i}" class="${game.opened === i ? 'opened' : ''}">${game.opened === i ? '🔓' : '🎁'}<small>Box ${i + 1}</small></button>`).join('')}</div>
        ${Number.isInteger(game.opened) ? `<div class="prep-meaning-card"><span>MYSTERY CLUE</span>${boxes[game.opened]?.definition || boxes[game.opened]?.arabic ? `<p>${escapeHtml(boxes[game.opened]?.definition || boxes[game.opened]?.arabic)}</p>` : `<p>Find the word shown in this picture.</p>${prepImageMarkup(boxes[game.opened], 'prep-game-picture')}`}<div class="prep-game-options">${optionsFor(boxes[game.opened]).map((item) => `<button data-prep-game-option="${escapeHtml(item.word)}" class="${game.selectedOption ? (item.word === boxes[game.opened].word ? 'is-correct' : item.word === game.selectedOption ? 'is-wrong' : '') : ''}" ${game.selectedOption ? 'disabled' : ''}>${escapeHtml(item.word)}</button>`).join('')}</div>${game.feedback ? `<div class="prep-game-feedback ${game.feedback === 'correct' ? 'success' : 'error'}">${game.feedback === 'correct' ? 'You opened the right box!' : 'The answer is ' + escapeHtml(boxes[game.opened].word)}<button data-prep-game-next>Next box</button></div>` : ''}</div>` : ''}
      `;
    } else {
      body = `
        <div class="prep-game-progress">Card ${game.index + 1} / ${words.length}</div>
        <button class="prep-flashcard ${game.flipped ? 'flipped' : ''}" data-prep-flip>
          ${game.flipped ? `<span class="prep-flashcard-label">MEANING</span><strong dir="rtl">${escapeHtml(current.arabic || current.definition || 'Meaning not provided in the source')}</strong><small>${escapeHtml(current.definition || '')}</small>` : `<span class="prep-flashcard-label">VOCABULARY</span>${prepImageMarkup(current, 'prep-flashcard-picture')}<strong>${escapeHtml(current.word)}</strong><small>Tap to reveal meaning</small>`}
        </button>
        <button class="prep-game-primary" data-prep-game-next>Next card</button>
      `;
    }
  }
  return `
    <section class="prep-games">
      <div class="prep-games-heading"><div><p class="eyebrow">WORDWALL-INSPIRED GAME STUDIO</p><h3>Choose a learning game</h3><p>Original interactive activities built from this unit's vocabulary.</p></div><span class="prep-game-count">${words.length} words</span></div>
      <div class="prep-game-launch-grid">${games.map((item) => `<button data-prep-game="${item.id}" class="${game.id === item.id ? 'active' : ''}"><span>${item.icon}</span><strong>${item.title}</strong><small>${item.desc}</small></button>`).join('')}</div>
      <article class="prep-game-stage"><div class="prep-game-stage-title"><h3>${games.find((item) => item.id === game.id)?.title || 'Learning game'}</h3><span>Interactive practice</span></div>${body}</article>
      <div class="prep-image-credit">Images are embedded illustrations from the supplied lessons or openly licensed Openverse photographs. ${[...new Map(words.filter((item) => item.imageSource && item.sourceUrl).map((item) => [item.sourceUrl, item])).values()].map((item) => `<div><a href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.word)} · ${escapeHtml(item.imageSource)}</a> · ${escapeHtml(item.license || '')} · ${escapeHtml(item.attribution || 'Creator credit on source page')}${item.licenseUrl ? ` · <a href="${escapeHtml(item.licenseUrl)}" target="_blank" rel="noopener noreferrer">License terms</a>` : ''}</div>`).join('')}</div>
    </section>
  `;
}

function renderPreparatoryHtmlLibrary() {
  if (state.stage !== 'preparatory') return '';
  const course = getPreparatoryHtmlCourse(state.grade, state.path);
  if (!course?.units?.length) return '';
  const selectedUnit = getSelectedPreparatoryUnit();
  const module = state.htmlModuleSelection;
  const modules = [
    ['vocabulary', 'Vocabulary', 'Words, meanings, pictures and pronunciation', 'Aa'],
    ['vocabulary_questions', 'Vocabulary Questions', 'Practise the unit words', '✎'],
    ['grammar', 'Grammar', 'Rules and examples', '文'],
    ['grammar_questions', 'Grammar Questions', 'Grammar practice', '✓'],
    ['reading', 'Reading', 'Read and understand', '▤'],
    ['listening', 'Listening', 'Listen and answer', '♫'],
    ['games', 'Games', 'Play and learn with six game types', '★'],
    ['comprehensive_test', 'Comprehensive Test', 'Check your unit mastery', '🏆']
  ];
  const selectedWords = getPreparatoryUnitWords(selectedUnit);
  const availableModules = modules.filter((item) => !(state.grade === 2 && state.path === 'general' && item[0] === 'comprehensive_test'));
  const moduleLabel = modules.find((item) => item[0] === module)?.[1] || '';
  const formatLabel = course.format === 'static-html'
    ? 'Static source lesson · app sections and games are provided separately'
    : course.format === 'combined-html'
      ? 'Combined curriculum · Units 1–6'
      : 'Interactive HTML lessons';

  return `
    <section class="imported-curriculum panel">
      <div class="imported-curriculum-heading">
        <div><p class="eyebrow">IMPORTED CURRICULUM · 2026/2027</p><h2>${escapeHtml(course.series)} · Preparatory ${state.grade}</h2><p class="library-intro">${escapeHtml(formatLabel)}</p></div>
        <span class="book-count">${course.units.length} unit file${course.units.length === 1 ? '' : 's'}</span>
      </div>
      ${!selectedUnit ? `
        <div class="imported-unit-grid">${course.units.map((unit) => `
          <button type="button" class="imported-unit-card" data-html-unit="${escapeHtml(unit.id)}"><span class="imported-unit-icon">▤</span><strong>${escapeHtml(unit.title)}</strong><small>${escapeHtml(unit.fileName)}</small><span class="imported-unit-open">Open unit ↗</span></button>
        `).join('')}</div>
      ` : !module ? `
        <div class="prep-learning-toolbar"><button type="button" class="prep-back-link" data-html-back-units>← All units</button><div><span class="eyebrow">${escapeHtml(course.series)} · PREPARATORY ${state.grade}</span><h3>${escapeHtml(selectedUnit.title)}</h3></div><span class="prep-word-count">${selectedWords.length} vocabulary words</span></div>
        <div class="prep-module-grid">${availableModules.map((item) => `<button type="button" class="prep-module-card" data-html-module="${item[0]}"><span>${item[3]}</span><strong>${item[1]}</strong><small>${item[2]}</small><b>Open section ↗</b></button>`).join('')}</div>
      ` : `
        <div class="prep-learning-toolbar"><button type="button" class="prep-back-link" data-html-back-modules>← ${escapeHtml(selectedUnit.title)}</button><div><span class="eyebrow">${escapeHtml(course.series)} · UNIT ${escapeHtml(selectedUnit.number || '1–6')}</span><h3>${escapeHtml(moduleLabel)}</h3></div></div>
        ${module === 'games' ? renderPreparatoryGame(selectedWords) : module === 'vocabulary' ? renderPreparatoryVocabulary(selectedWords) : `
          <div class="imported-html-viewer">
            <div class="imported-html-viewer-head"><div><strong>${escapeHtml(moduleLabel)}</strong><span>${escapeHtml(course.series)} · Preparatory ${state.grade} · ${escapeHtml(selectedUnit.title)}</span></div></div>
            <iframe id="prep-html-frame" class="imported-html-frame" title="${escapeHtml(moduleLabel)} · ${escapeHtml(selectedUnit.title)}" src="${escapeHtml((selectedUnit.viewerUrl || selectedUnit.url) + "#" + module + ":" + (selectedUnit.number || 1))}" loading="lazy" referrerpolicy="no-referrer" sandbox="allow-scripts allow-forms"></iframe>
          </div>
        `}
      `}
    </section>
  `;
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
      games: [] // Content unavailable
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
  const pairs = [
    { word: 'pencil', pic: '✏️', label: 'Pencil (قلم رصاص)' },
    { word: 'bag', pic: '🎒', label: 'Bag (حقيبة)' },
    { word: 'chair', pic: '🪑', label: 'Chair (كرسي)' },
    { word: 'tiger', pic: '🐯', label: 'Tiger (نمر)' },
    { word: 'tree', pic: '🌳', label: 'Tree (شجرة)' },
    { word: 'tomato', pic: '🍅', label: 'Tomato (طماطم)' }
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
          <p>You matched all classroom objects and phonics words correctly!</p>
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
                <button type="button" class="card-audio-icon" data-tts-text="${p.word}" title="Listen to word">🔊</button>
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
  const wordsData = [
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
  const rounds = [
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

function renderGame4CommandsChallenge() {
  const commands = [
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

  const activeUnitDraft = unitDraftRegistry.get(`${book.id}-unit-${unit.number}`) || null;
  const isP1U1 = book.id === 'primary1-student-term1' && unit.number === 1 && Boolean(activeUnitDraft);
  const isP1U2U3 = book.id === 'primary1-student-term1' && (unit.number === 2 || unit.number === 3) && Boolean(activeUnitDraft);

  // Clear, named learning areas. Speaking is included because Unit 1 has a verified role-play.
  const unitSections = [
    { type: 'vocabulary', title: 'Vocabulary', subtitle: 'Words, meanings, pictures & pronunciation', icon: 'Aa', draftType: 'vocabulary' },
    { type: 'vocabulary_questions', title: 'Vocabulary Questions', subtitle: 'Practise the unit words', icon: '✎', draftType: 'vocabulary_questions' },
    { type: 'grammar', title: 'Grammar', subtitle: 'Rules and examples', icon: '文', draftType: 'grammar' },
    { type: 'grammar_questions', title: 'Grammar Questions', subtitle: 'Practise the unit grammar', icon: '✓', draftType: 'grammar_questions' },
    { type: 'reading', title: 'Reading', subtitle: 'Read source passages and answer questions', icon: '▤', draftType: 'reading' },
    { type: 'listening', title: 'Listening', subtitle: 'Listen, replay and answer', icon: '♫', draftType: 'listening' },
    { type: 'speaking', title: 'Speaking', subtitle: 'Practise the dialogue aloud', icon: '🎤', draftType: 'speaking' },
    { type: 'games', title: 'Games', subtitle: 'Unit skill practice and challenges', icon: '★', draftType: 'games' },
    { type: 'comprehensive_test', title: 'Tests', subtitle: '10-question unit assessment', icon: '✓', draftType: 'comprehensive_test' }
  ];

  // Helper to count answered questions without duplicates
  const countAnswered = (items) => {
    if (!Array.isArray(items)) return 0;
    return items.filter((q) => getQuestionState(q.itemId).isCorrect).length;
  };

  // SECTION SCREEN (When a student opens an independent section)
  if (state.activeModule) {
    const secDef = unitSections.find((s) => s.type === state.activeModule) || unitSections[0];
    let bodyHtml = '';

    if (!activeUnitDraft) {
      bodyHtml = `
        <div class="review-pending-banner">
          <strong>Interactive content is awaiting teacher approval.</strong>
          <span>Only content checked against the original PDF and manually approved is released to students.</span>
          ${Number.isInteger(unit.startPdfPage) ? `<button type="button" class="source-open" data-unit-preview="${escapeHtml(book.sourceFile)}" data-unit-page="${unit.startPdfPage}">Open original PDF · page ${unit.startPdfPage} ↗</button>` : ''}
        </div>
      `;
    } else if (isP1U2U3 && activeUnitDraft) {
      const getItems = (type) => activeUnitDraft.sections.find((section) => section.type === type)?.items || [];
      const vocabulary = getItems('vocabulary');
      const vocabularyQuestions = getItems('vocabulary_questions');
      const grammar = getItems('grammar');
      const grammarQuestions = getItems('grammar_questions');
      const reading = getItems('reading');
      const listening = getItems('listening');
      const speaking = getItems('speaking');
      const tests = getItems('comprehensive_test');
      const games = getItems('games');
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
        `;
      } else if (state.activeModule === 'vocabulary_questions') {
        bodyHtml = renderQuestionGroup(vocabularyQuestions, 'vocabulary_questions');
      } else if (state.activeModule === 'grammar_questions') {
        bodyHtml = renderQuestionGroup(grammarQuestions, 'grammar_questions');
      } else if (state.activeModule === 'grammar') {
        bodyHtml = `
          <div class="grammar-lessons-container">
            ${grammar.map((item) => {
              const data = item.content || {};
              return `<article class="grammar-concept-card"><div class="grammar-concept-head"><span class="grammar-concept-badge">LANGUAGE STRUCTURE</span><span class="grammar-page-tag">PDF Page ${data.sourcePdfPage || '—'}</span></div><h3 class="grammar-concept-title">${escapeHtml(data.rule || '')}</h3><p class="grammar-explanation-text">${escapeHtml(data.explanation || '')}</p>${data.example ? `<div class="grammar-example-callout"><span class="example-badge">Textbook model</span><p class="example-content" dir="ltr">${escapeHtml(data.example)}</p><button type="button" class="tts-play-btn small" data-tts-text="${escapeHtml(data.example)}">🔊 Listen</button></div>` : ''}</article>`;
            }).join('')}
          </div>
        `;
      } else if (state.activeModule === 'reading') {
        const passage = reading.find((item) => item.content?.passage)?.content || {};
        const questions = reading.filter((item) => item.content?.question);
        bodyHtml = `
          <article class="reading-passage-card">
            <div class="reading-card-head"><span class="reading-badge">${passage.origin === 'supplementary' ? 'SUPPLEMENTARY TEXT' : 'SOURCE TEXT'} · PDF PAGE ${passage.sourcePdfPage || '—'}</span><h4>${escapeHtml(activeUnitDraft.unitTitle)}</h4></div>
            <p class="reading-passage-text" dir="ltr">${escapeHtml(passage.passage || '')}</p>
            ${passage.passage ? `<button type="button" class="big-audio-btn secondary" data-tts-text="${escapeHtml(passage.passage)}">🔊 Listen to text</button>` : '<p class="empty-state">No reading passage has been extracted for this unit.</p>'}
          </article>
          <h3 class="module-subheading">Reading questions</h3>
          ${renderQuestionGroup(questions, 'reading')}
        `;
      } else if (state.activeModule === 'listening') {
        const scripts = listening.filter((item) => item.content?.script || item.content?.passage);
        const questions = listening.filter((item) => item.content?.question);
        bodyHtml = `
          <div class="listening-draft-list">
            ${scripts.map((item) => {
              const data = item.content || {};
              const script = data.script || data.passage || '';
              return `<article class="listening-console-card">
                <span class="listening-badge">${data.origin === 'supplementary' ? 'SUPPLEMENTARY TTS SCRIPT' : 'SOURCE SCRIPT'} · PDF PAGE ${data.sourcePdfPage || '—'}</span>
                <p dir="ltr">${escapeHtml(script)}</p>
                <button type="button" class="big-audio-btn secondary" data-tts-text="${escapeHtml(script)}">🔊 Play TTS preview</button>
                <small>TTS preview is not the original book audio recording.</small>
              </article>`;
            }).join('')}
            ${scripts.length ? '' : '<div class="empty-state">No verified listening transcript is available; no source script has been invented.</div>'}
          </div>
          <h3 class="module-subheading">Listening questions</h3>
          ${renderQuestionGroup(questions, 'listening')}
        `;
      } else if (state.activeModule === 'speaking') {
        const dialogues = speaking.filter((item) => Array.isArray(item.content?.dialogue));
        bodyHtml = `
          <div class="speaking-practice-card">
            ${dialogues.length ? renderSpeakerVoiceSettings() : ''}
            ${dialogues.map((item) => {
              const data = item.content || {};
              return `<article class="speaking-dialogue-block">
                <span class="speaking-line-speaker">${data.origin === 'supplementary' ? 'SUPPLEMENTARY ROLE-PLAY' : 'SOURCE DIALOGUE'} · PDF PAGE ${data.sourcePdfPage || '—'}</span>
                <div class="speaking-dialogue-list">
                  ${(data.dialogue || []).map((line, index) => {
                    const gender = ['male', 'female'].includes(line.speakerGender) ? line.speakerGender : 'unknown';
                    return `<article class="speaking-line-card">
                      <span class="speaking-line-speaker">${escapeHtml(line.speaker || 'Speaker ' + (index + 1))} · ${gender === 'unknown' ? 'Voice not verified' : gender + ' role'}</span>
                      <p dir="ltr">${escapeHtml(line.text || '')}</p>
                      <button type="button" class="speaking-line-audio" data-tts-text="${escapeHtml(line.text || '')}" data-tts-gender="${gender}">🔊 Listen</button>
                    </article>`;
                  }).join('')}
                </div>
                <button type="button" class="big-audio-btn secondary" data-play-dialogue="${escapeHtml(JSON.stringify(data.dialogue || []))}">🔊 Play full dialogue</button>
              </article>`;
            }).join('')}
            ${dialogues.length ? '<p class="speaking-practice-note">Each line uses the selected male/female voice when the platform exposes or the user assigns one. Unmatched roles fall back to the system default.</p>' : '<div class="empty-state">No source dialogue or supplementary role-play is available yet.</div>'}
          </div>
        `;
      } else if (state.activeModule === 'comprehensive_test') {
        bodyHtml = `<div class="quiz-summary-pill">Unit assessment · ${tests.length} questions</div>${renderQuestionGroup(tests, 'comprehensive_test')}`;
      } else if (state.activeModule === 'games') {
        bodyHtml = `
          <div class="games-grid">
            ${games.map((item, idx) => {
              const data = item.content || {};
              const playableQuestion = data.question && Array.isArray(data.options) && data.correctAnswer;
              return `<article class="game-preview-card">
                <span class="game-number">GAME ${idx + 1} · ${escapeHtml(data.skill || 'unit practice')} · ${escapeHtml(data.difficulty || 'level pending')}</span>
                <h4>${escapeHtml(data.gameName || 'Supplementary challenge')}</h4>
                <p>${escapeHtml(data.description || '')}</p>
                <small>${escapeHtml(data.gameMode || 'game mode pending')} · SUPPLEMENTARY</small>
                ${Array.isArray(data.targetWords) && data.targetWords.length ? `<p dir="ltr">${escapeHtml(data.targetWords.join(' · '))}</p>` : ''}
                ${playableQuestion ? renderStudentQuestionCard(item, idx, 'games', 'Challenge ' + (idx + 1)) : '<p class="speaking-practice-note">This game is a design card until its interaction mode is implemented.</p>'}
              </article>`;
            }).join('')}
            ${games.length ? '' : '<div class="empty-state">No reviewed games are available for this unit yet.</div>'}
          </div>
        `;
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
      } else if (state.activeModule === 'vocabulary_questions') {
        const questions = p1u1Draft.sections.find((section) => section.type === 'vocabulary_questions')?.items || [];
        bodyHtml = `<div class="quiz-summary-pill">Vocabulary practice · ${questions.length} questions</div><div class="questions-stack">${questions.map((q, idx) => renderStudentQuestionCard(q, idx, 'vocabulary_questions')).join('')}</div>`;
      } else if (state.activeModule === 'grammar_questions') {
        const questions = p1u1Draft.sections.find((section) => section.type === 'grammar_questions')?.items || [];
        bodyHtml = `<div class="quiz-summary-pill">Grammar practice · ${questions.length} questions</div><div class="questions-stack">${questions.map((q, idx) => renderStudentQuestionCard(q, idx, 'grammar_questions')).join('')}</div>`;
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
            ${renderSpeakerVoiceSettings()}
            <div class="speaking-dialogue-list">
              ${rolePlay.map((line, index) => {
                const gender = ['male', 'female'].includes(line.speakerGender) ? line.speakerGender : 'unknown';
                return `
                  <article class="speaking-line-card">
                    <span class="speaking-line-speaker">${escapeHtml(line.speaker || `Speaker ${index + 1}`)} · ${gender === 'unknown' ? 'Voice not verified' : gender + ' role'}</span>
                    <p>${escapeHtml(line.text || '')}</p>
                    <button type="button" class="speaking-line-audio" data-tts-text="${escapeHtml(line.text || '')}" data-tts-gender="${gender}">🔊 Listen</button>
                  </article>
                `;
              }).join('')}
            </div>
            <p class="speaking-practice-note">Now practise the full dialogue with a classmate.</p>
            <button type="button" class="big-audio-btn secondary" data-play-dialogue="${escapeHtml(JSON.stringify(rolePlay))}">🔊 Listen to Full Dialogue</button>
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
    } else if (activeUnitDraft) {
      const getItems = (type) => activeUnitDraft.sections.find((section) => section.type === type)?.items || [];
      const renderQuestionGroup = (items, type, label) => items.length
        ? `<div class="questions-stack">${items.map((item, idx) => renderStudentQuestionCard(item, idx, type, label ? label + ' ' + (idx + 1) : null)).join('')}</div>`
        : '<div class="empty-state">No questions have been added to this section yet.</div>';
      const sourceLabel = (item) => item?.content?.origin === 'source' ? 'SOURCE TEXT' : 'SUPPLEMENTARY MATERIAL';
      const pageLabel = (item) => Number.isInteger(item?.content?.sourcePdfPage) ? 'PDF page ' + item.content.sourcePdfPage : 'Page not verified';
      if (state.activeModule === 'vocabulary') {
        const words = getItems('vocabulary');
        bodyHtml = `
          <div class="vocab-grid-responsive">
            ${words.map((item, idx) => {
              const data = item.content || {};
              return `<article class="vocab-compact-card">
                <div class="vocab-compact-top"><span class="vocab-compact-icon">📘</span><span class="vocab-compact-num">#${idx + 1} · ${escapeHtml(pageLabel(item))}</span></div>
                <strong class="vocab-compact-word" dir="ltr">${escapeHtml(data.word || '')}</strong>
                <span class="vocab-compact-meaning" dir="rtl">${escapeHtml(data.arabicMeaning || '')}</span>
                ${data.example ? `<p dir="ltr">${escapeHtml(data.example)}</p>` : ''}
                <small>${escapeHtml(sourceLabel(item))}</small>
                <button type="button" class="tts-play-btn small" data-tts-text="${escapeHtml(data.word || '')}">🔊 Listen</button>
              </article>`;
            }).join('')}
          </div>
        `;
      } else if (state.activeModule === 'vocabulary_questions') {
        bodyHtml = renderQuestionGroup(getItems('vocabulary_questions'), 'vocabulary_questions', 'Vocabulary question');
      } else if (state.activeModule === 'grammar') {
        const rules = getItems('grammar');
        bodyHtml = `
          <div class="grammar-lessons-container">
            ${rules.map((item) => {
              const data = item.content || {};
              return `<article class="grammar-concept-card">
                <div class="grammar-concept-head"><span class="grammar-concept-badge">${escapeHtml(sourceLabel(item))}</span><span class="grammar-page-tag">${escapeHtml(pageLabel(item))}</span></div>
                <h3 class="grammar-concept-title">${escapeHtml(data.rule || '')}</h3>
                <p class="grammar-explanation-text">${escapeHtml(data.explanation || '')}</p>
                ${data.example ? `<div class="grammar-example-callout"><p class="example-content" dir="ltr">${escapeHtml(data.example)}</p><button type="button" class="tts-play-btn small" data-tts-text="${escapeHtml(data.example)}">🔊 Listen</button></div>` : ''}
              </article>`;
            }).join('')}
          </div>
        `;
      } else if (state.activeModule === 'grammar_questions') {
        bodyHtml = renderQuestionGroup(getItems('grammar_questions'), 'grammar_questions', 'Grammar question');
      } else if (state.activeModule === 'reading') {
        const passages = getItems('reading').filter((item) => item.content?.passage || item.content?.dialogue);
        const questions = getItems('reading').filter((item) => item.content?.question);
        bodyHtml = `
          <div class="reading-draft-list">
            ${passages.map((item) => {
              const data = item.content || {};
              const text = data.passage || (data.dialogue || []).map((line) => (line.speaker || 'Speaker') + ': ' + (line.text || '')).join('\n');
              return `<article class="reading-passage-card">
                <div class="reading-card-head"><span class="reading-badge">${escapeHtml(sourceLabel(item))} · ${escapeHtml(pageLabel(item))}</span><h4>${escapeHtml(activeUnitDraft.unitTitle || unit.title)}</h4></div>
                <p class="reading-passage-text" dir="ltr">${escapeHtml(text)}</p>
                <button type="button" class="big-audio-btn secondary" data-tts-text="${escapeHtml(text)}">🔊 Listen to text</button>
              </article>`;
            }).join('')}
          </div>
          <h3 class="module-subheading">Reading questions</h3>
          ${renderQuestionGroup(questions, 'reading', 'Reading question')}
        `;
      } else if (state.activeModule === 'listening') {
        const scripts = getItems('listening').filter((item) => item.content?.script || item.content?.passage);
        const questions = getItems('listening').filter((item) => item.content?.question);
        bodyHtml = `
          <div class="listening-draft-list">
            ${scripts.map((item) => {
              const data = item.content || {};
              const script = data.script || data.passage || '';
              return `<article class="listening-console-card">
                <span class="listening-badge">${escapeHtml(sourceLabel(item))} · ${escapeHtml(pageLabel(item))}</span>
                <p class="listening-prompt">${escapeHtml(data.instruction || 'Listen and answer the questions.')}</p>
                <p dir="ltr">${escapeHtml(script)}</p>
                <button type="button" class="big-audio-btn secondary" data-tts-text="${escapeHtml(script)}">🔊 Play TTS preview</button>
                ${data.origin === 'supplementary' ? '<small>This is generated supplementary text, not original book audio.</small>' : '<small>TTS reads the printed script; it is not the original recording.</small>'}
              </article>`;
            }).join('')}
          </div>
          ${scripts.length ? '' : '<div class="empty-state">No verified listening transcript is available. No source audio has been invented.</div>'}
          <h3 class="module-subheading">Listening questions</h3>
          ${renderQuestionGroup(questions, 'listening', 'Listening question')}
        `;
      } else if (state.activeModule === 'speaking') {
        const rolePlays = getItems('speaking').filter((item) => Array.isArray(item.content?.dialogue));
        bodyHtml = `
          <div class="speaking-practice-card">
            ${rolePlays.length ? renderSpeakerVoiceSettings() : ''}
            ${rolePlays.map((item) => {
              const data = item.content || {};
              return `<article class="speaking-dialogue-block">
                <p class="speaking-instruction">${escapeHtml(data.instruction || 'Practise the dialogue with a partner.')}</p>
                <span class="speaking-line-speaker">${escapeHtml(sourceLabel(item))} · ${escapeHtml(pageLabel(item))}</span>
                <div class="speaking-dialogue-list">
                  ${(data.dialogue || []).map((line, index) => {
                    const gender = ['male', 'female'].includes(line.speakerGender) ? line.speakerGender : 'unknown';
                    const roleLabel = gender === 'unknown' ? 'Voice not verified' : gender + ' role';
                    return `<article class="speaking-line-card">
                      <span class="speaking-line-speaker">${escapeHtml(line.speaker || 'Speaker ' + (index + 1))} · ${escapeHtml(roleLabel)}</span>
                      <p dir="ltr">${escapeHtml(line.text || '')}</p>
                      <button type="button" class="speaking-line-audio" data-tts-text="${escapeHtml(line.text || '')}" data-tts-gender="${gender}">🔊 Listen</button>
                    </article>`;
                  }).join('')}
                </div>
                <button type="button" class="big-audio-btn secondary" data-play-dialogue="${escapeHtml(JSON.stringify(data.dialogue || []))}">🔊 Play full dialogue</button>
              </article>`;
            }).join('')}
            ${rolePlays.length ? '<p class="speaking-practice-note">Each line uses the selected male/female voice when the platform exposes or the user assigns one. Unmatched roles fall back to the system default.</p>' : '<div class="empty-state">No source dialogue or reviewed supplementary role-play is available yet.</div>'}
          </div>
        `;
      } else if (state.activeModule === 'games') {
        const games = getItems('games');
        bodyHtml = `
          <div class="games-grid">
            ${games.map((item, idx) => {
              const data = item.content || {};
              const playableQuestion = data.question && Array.isArray(data.options) && data.correctAnswer;
              return `<article class="game-preview-card">
                <span class="game-number">GAME ${idx + 1} · ${escapeHtml(data.skill || 'unit practice')} · ${escapeHtml(data.difficulty || 'level pending')}</span>
                <h4>${escapeHtml(data.gameName || 'Supplementary challenge')}</h4>
                <p>${escapeHtml(data.description || '')}</p>
                <small>${escapeHtml(data.gameMode || 'game mode pending')} · SUPPLEMENTARY</small>
                ${Array.isArray(data.targetWords) && data.targetWords.length ? `<p dir="ltr">${escapeHtml(data.targetWords.join(' · '))}</p>` : ''}
                ${playableQuestion ? renderStudentQuestionCard(item, idx, 'games', 'Challenge ' + (idx + 1)) : '<p class="speaking-practice-note">This game is a design card until its interaction mode is implemented.</p>'}
              </article>`;
            }).join('')}
            ${games.length ? '' : '<div class="empty-state">No reviewed games are available for this unit yet.</div>'}
          </div>
        `;
      } else if (state.activeModule === 'comprehensive_test') {
        const tests = getItems('comprehensive_test');
        bodyHtml = `<div class="quiz-summary-pill">Unit assessment · ${tests.length} questions</div>${renderQuestionGroup(tests, 'comprehensive_test', 'Question')}`;
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

  // UNIT DASHBOARD (Nine independent learning sections)
  const calculateProgress = (secType) => {
    if (!activeUnitDraft) return 'Awaiting teacher approval';
    if (!isP1U1) {
      const section = activeUnitDraft.sections.find((item) => item.type === secType);
      const count = section?.items?.length || 0;
      return count ? count + ' items available' : 'Awaiting reviewed content';
    }
    if (!isP1U1 || !p1u1Draft) return 'Open section';
    if (secType === 'vocabulary') {
      const vocabQ = p1u1Draft.sections.find((s) => s.type === 'vocabulary_questions')?.items || [];
      const count = countAnswered(vocabQ);
      return `24 Words · ${count}/${vocabQ.length} Practice Qs`;
    }
    if (secType === 'vocabulary_questions') {
      const items = p1u1Draft.sections.find((section) => section.type === 'vocabulary_questions')?.items || [];
      return `${countAnswered(items)}/${items.length} answered`;
    }
    if (secType === 'grammar_questions') {
      const items = p1u1Draft.sections.find((section) => section.type === 'grammar_questions')?.items || [];
      return `${countAnswered(items)}/${items.length} answered`;
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
  ] : activeUnitDraft ? [
    activeUnitDraft.sections.find((s) => s.type === 'vocabulary_questions')?.items || [],
    activeUnitDraft.sections.find((s) => s.type === 'grammar_questions')?.items || [],
    activeUnitDraft.sections.find((s) => s.type === 'reading')?.items?.filter((item) => item.content?.question) || [],
    activeUnitDraft.sections.find((s) => s.type === 'listening')?.items?.filter((item) => item.content?.question) || [],
    activeUnitDraft.sections.find((s) => s.type === 'comprehensive_test')?.items || []
  ] : [];
  const totalQuestions = scoredQuestionGroups.reduce((total, items) => total + items.length, 0);
  const totalAnswered = scoredQuestionGroups.reduce((total, items) => total + countAnswered(items), 0);
  const progressPercent = totalQuestions > 0
    ? Math.min(100, Math.round((totalAnswered / totalQuestions) * 100))
    : 0;

  const sectionCards = unitSections.map((sec) => `
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

      ${!activeUnitDraft ? '<div class="review-pending-banner"><strong>No approved interactive content is available for this unit yet.</strong><span>The original PDF remains available for study while the lesson content is reviewed.</span></div>' : ''}

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

    </section>
  `;
}

function renderPreview() {
  if (!state.preview) return '';
  const { file, page } = state.preview;
  return `<section class="pdf-preview" aria-label="PDF preview"><div class="preview-heading"><div><p class="eyebrow">ORIGINAL SOURCE · READ ONLY</p><strong>${escapeHtml(file)}</strong><span>PDF page ${page}</span></div><button type="button" class="preview-close" data-close-preview>Close preview ✕</button></div><iframe title="Original source book preview" src="${bookUrl(file, page)}" loading="lazy"></iframe><p class="preview-note">The original PDF is displayed without modification.</p><a class="source-open preview-fallback" href="${bookUrl(file, page)}" target="_blank" rel="noopener">Open PDF in a new tab ↗</a></section>`;
}

function render() {
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
  const visiblePathways = state.stage === 'egyptian-baccalaureate'
    ? sourceIndex.pathways.filter((item) => item.id.startsWith('egypt-baccalaureate'))
    : paths;

  app.innerHTML = `
    <header class="topbar">
      <a class="brand" href="#" aria-label="EngliMensh home"><span class="brand-mark">E</span><span>EngliMensh</span></a>
      <span class="country-tag">EGYPTIAN CURRICULUM</span>
    </header>
    <main class="shell stage-${state.stage}">
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
        ${renderPreparatoryHtmlLibrary()}
        ${renderPreview()}
        <div class="book-library">${(state.stage === 'preparatory' && !books.length && getPreparatoryHtmlCourse(state.grade, state.path)?.units?.length) ? '' : (selectedPath.status === 'reserved_empty' ? '<div class="empty-state"><div class="book-icon">▤</div><strong>This pathway is reserved</strong><span>No source book is indexed for it yet</span></div>' : renderBookLibrary(books))}</div>
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

  app.querySelectorAll('[data-html-unit]').forEach((button) => button.addEventListener('click', (e) => {
    e.stopPropagation();
    state.htmlUnitSelection = { grade: state.grade, path: state.path, unitId: button.dataset.htmlUnit };
    state.htmlModuleSelection = null;
    state.htmlGame = { id: 'picture-match', index: 0, score: 0, selectedWord: null, selectedImage: null, matched: [], selectedOption: null, placed: [], flipped: false, opened: null, feedback: '' };
    state.unitSelection = null;
    state.activeModule = null;
    state.preview = null;
    render();
    app.querySelector('.imported-curriculum')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));

  app.querySelector('[data-close-html-unit]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    state.htmlUnitSelection = null;
    state.htmlModuleSelection = null;
    render();
  });

  app.querySelector('[data-html-back-units]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    state.htmlUnitSelection = null;
    state.htmlModuleSelection = null;
    render();
  });

  app.querySelector('[data-html-back-modules]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    state.htmlModuleSelection = null;
    render();
  });

  app.querySelectorAll('[data-html-module]').forEach((button) => button.addEventListener('click', (e) => {
    e.stopPropagation();
    state.htmlModuleSelection = button.dataset.htmlModule;
    state.htmlGame = { id: 'picture-match', index: 0, score: 0, selectedWord: null, selectedImage: null, matched: [], selectedOption: null, placed: [], flipped: false, opened: null, feedback: '' };
    render();
    app.querySelector('.prep-learning-toolbar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));

  const prepWords = getPreparatoryUnitWords();
  app.querySelectorAll('[data-prep-game]').forEach((button) => button.addEventListener('click', () => {
    state.htmlGame = { id: button.dataset.prepGame, index: 0, score: 0, selectedWord: null, selectedImage: null, matched: [], selectedOption: null, placed: [], flipped: false, opened: null, feedback: '' };
    render();
  }));
  app.querySelectorAll('[data-prep-match-word]').forEach((button) => button.addEventListener('click', () => {
    state.htmlGame.selectedWord = button.dataset.prepMatchWord;
    if (state.htmlGame.selectedImage) {
      if (state.htmlGame.selectedImage === state.htmlGame.selectedWord) {
        state.htmlGame.matched = [...state.htmlGame.matched, state.htmlGame.selectedWord];
        state.htmlGame.score += 1;
      }
      state.htmlGame.selectedImage = null;
      state.htmlGame.selectedWord = null;
    }
    render();
  }));
  app.querySelectorAll('[data-prep-match-image]').forEach((button) => button.addEventListener('click', () => {
    state.htmlGame.selectedImage = button.dataset.prepMatchImage;
    if (state.htmlGame.selectedWord) {
      if (state.htmlGame.selectedImage === state.htmlGame.selectedWord) {
        state.htmlGame.matched = [...state.htmlGame.matched, state.htmlGame.selectedWord];
        state.htmlGame.score += 1;
      }
      state.htmlGame.selectedImage = null;
      state.htmlGame.selectedWord = null;
    }
    render();
  }));
  app.querySelectorAll('[data-prep-game-option]').forEach((button) => button.addEventListener('click', () => {
    const current = state.htmlGame.openTarget || prepWords[state.htmlGame.index % Math.max(prepWords.length, 1)]?.word;
    state.htmlGame.selectedOption = button.dataset.prepGameOption;
    state.htmlGame.feedback = state.htmlGame.selectedOption === current ? 'correct' : 'wrong';
    if (state.htmlGame.feedback === 'correct') state.htmlGame.score += 1;
    render();
  }));
  app.querySelectorAll('[data-prep-letter]').forEach((button) => button.addEventListener('click', () => {
    state.htmlGame.placed = [...(state.htmlGame.placed || []), Number(button.dataset.prepLetter)];
    render();
  }));
  app.querySelector('[data-prep-word-clear]')?.addEventListener('click', () => {
    state.htmlGame.placed = [];
    state.htmlGame.feedback = '';
    render();
  });
  app.querySelector('[data-prep-word-check]')?.addEventListener('click', () => {
    const current = prepWords[state.htmlGame.index % Math.max(prepWords.length, 1)];
    const letters = (current?.word.toLowerCase().replace(/[^a-z]/g, '').split('') || []).sort((a, b) => b.localeCompare(a));
    const answer = (state.htmlGame.placed || []).map((index) => letters[index]).join('');
    const target = current?.word.toLowerCase().replace(/[^a-z]/g, '');
    state.htmlGame.feedback = answer === target ? 'correct' : 'wrong';
    if (state.htmlGame.feedback === 'correct') state.htmlGame.score += 1;
    render();
  });
  app.querySelectorAll('[data-prep-game-next]').forEach((button) => button.addEventListener('click', () => {
    state.htmlGame.index = (state.htmlGame.index + 1) % Math.max(prepWords.length, 1);
    state.htmlGame.selectedOption = null;
    state.htmlGame.placed = [];
    state.htmlGame.flipped = false;
    state.htmlGame.opened = null;
    state.htmlGame.openTarget = null;
    state.htmlGame.feedback = '';
    render();
  }));
  app.querySelector('[data-prep-flip]')?.addEventListener('click', () => {
    state.htmlGame.flipped = !state.htmlGame.flipped;
    render();
  });
  app.querySelectorAll('[data-prep-open-box]').forEach((button) => button.addEventListener('click', () => {
    state.htmlGame.opened = Number(button.dataset.prepOpenBox);
    const openWords = [...prepWords].sort((a, b) => a.word.localeCompare(b.word)).slice(0, Math.min(6, prepWords.length));
    state.htmlGame.openTarget = openWords[state.htmlGame.opened]?.word || null;
    state.htmlGame.selectedOption = null;
    state.htmlGame.feedback = '';
    render();
  }));
  app.querySelector('[data-prep-game-reset]')?.addEventListener('click', () => {
    state.htmlGame = { ...state.htmlGame, index: 0, score: 0, selectedWord: null, selectedImage: null, matched: [], selectedOption: null, placed: [], flipped: false, opened: null, feedback: '' };
    render();
  });

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

  // Quiz Option Retry Listener (Allows retrying wrong options until correct answer is chosen)
  app.querySelectorAll('[data-quiz-question]').forEach((button) => button.addEventListener('click', () => {
    const qId = button.dataset.quizQuestion;
    const choice = button.dataset.quizChoice;
    const qState = getQuestionState(qId);
    if (qState.isCorrect) return; // Locked once answered correctly

    // Lookup question correct answer from draft
    let correctAnswer = null;
    for (const draft of unitDraftRegistry.values()) {
      for (const sec of draft.sections || []) {
        const found = sec.items?.find((it) => (it.itemId || '') === qId);
        if (found && found.content && typeof found.content.correctAnswer === 'string') {
          correctAnswer = found.content.correctAnswer;
          break;
        }
      }
      if (correctAnswer) break;
    }
    if (!correctAnswer && p1u1Draft?.sections) {
      for (const sec of p1u1Draft.sections) {
        const found = sec.items?.find((it) => (it.itemId || '') === qId);
        if (found && typeof found.content?.correctAnswer === 'string') {
          correctAnswer = found.content.correctAnswer;
          break;
        }
      }
    }

    if (correctAnswer) {
      if (choice === correctAnswer) {
        state.quizAnswers[qId] = {
          choice,
          isCorrect: true,
          wrongChoices: qState.wrongChoices
        };
      } else {
        const updatedWrong = qState.wrongChoices.includes(choice) ? qState.wrongChoices : [...qState.wrongChoices, choice];
        state.quizAnswers[qId] = {
          choice,
          isCorrect: false,
          wrongChoices: updatedWrong
        };
      }
    } else {
      state.quizAnswers[qId] = { choice, isCorrect: true, wrongChoices: [] };
    }
    saveProgressToStorage();
    render();
  }));

  // Preview Listeners
  app.querySelectorAll('[data-unit-preview]').forEach((button) => button.addEventListener('click', (e) => { e.stopPropagation(); state.preview = { file: button.dataset.unitPreview, page: Number(button.dataset.unitPage) || 1 }; render(); app.querySelector('.pdf-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
  app.querySelectorAll('[data-preview-file]').forEach((button) => button.addEventListener('click', (e) => { e.stopPropagation(); state.preview = { file: button.dataset.previewFile, page: Number(button.dataset.previewPage) || 1 }; render(); app.querySelector('.pdf-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
  app.querySelector('[data-close-preview]')?.addEventListener('click', (e) => { e.stopPropagation(); state.preview = null; render(); });
  app.querySelectorAll('.stage-card[data-stage]').forEach((button) => button.addEventListener('click', (e) => { e.stopPropagation(); state.stage = button.dataset.stage; const next = currentStage(); state.grade = next?.grades?.[0] ?? null; state.path = next?.paths?.[0]?.id ?? ''; state.search = ''; state.preview = null; state.unitSelection = null; state.htmlUnitSelection = null; state.htmlModuleSelection = null; state.htmlGame = { id: 'picture-match', index: 0, score: 0, selectedWord: null, selectedImage: null, matched: [], selectedOption: null, placed: [], flipped: false, opened: null, feedback: '' }; state.activeModule = null; render(); }));
  app.querySelectorAll('.grade-button[data-grade]').forEach((button) => button.addEventListener('click', (e) => { e.stopPropagation(); state.grade = Number(button.dataset.grade); state.search = ''; state.preview = null; state.unitSelection = null; state.htmlUnitSelection = null; state.htmlModuleSelection = null; state.htmlGame = { id: 'picture-match', index: 0, score: 0, selectedWord: null, selectedImage: null, matched: [], selectedOption: null, placed: [], flipped: false, opened: null, feedback: '' }; state.activeModule = null; render(); }));
  app.querySelectorAll('.path-button[data-path]').forEach((button) => button.addEventListener('click', (e) => { e.stopPropagation(); state.path = button.dataset.path; state.search = ''; state.preview = null; state.unitSelection = null; state.htmlUnitSelection = null; state.htmlModuleSelection = null; state.htmlGame = { id: 'picture-match', index: 0, score: 0, selectedWord: null, selectedImage: null, matched: [], selectedOption: null, placed: [], flipped: false, opened: null, feedback: '' }; state.activeModule = null; render(); }));

  // TTS and speaker-role voice listeners
  app.querySelectorAll('[data-tts-text]').forEach((button) => button.addEventListener('click', (e) => {
    e.stopPropagation();
    speakText(button.dataset.ttsText, null, button.dataset.ttsGender || null);
  }));
  app.querySelectorAll('[data-tts-voice]').forEach((select) => select.addEventListener('change', () => {
    const gender = select.dataset.ttsVoice;
    if (!['male', 'female'].includes(gender)) return;
    state.ttsVoicePrefs[gender] = select.value;
    saveProgressToStorage();
    render();
  }));
  app.querySelectorAll('[data-play-dialogue]').forEach((button) => button.addEventListener('click', (e) => {
    e.stopPropagation();
    try {
      playDialogue(JSON.parse(button.dataset.playDialogue || '[]'));
    } catch (error) {
      console.warn('Could not replay dialogue:', error);
    }
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
      if (state.game1.selectedPic === word) state.game1.matches.push(word);
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
      if (state.game1.selectedWord === word) state.game1.matches.push(word);
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
    const wordsData = ['tiger', 'tomato', 'table', 'tree', 'ink', 'insect'];
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
      const targets = ['hello', 'goodbye', 'teacher', 'board', 'desk', 'insect'];
      if (chosen === targets[state.game3.index]) state.game3.score += 1;
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

  // Game 4 Classroom Commands Listeners
  app.querySelectorAll('[data-command-choose]').forEach((btn) => btn.addEventListener('click', () => {
    if (!state.game4.selectedOption) {
      const chosen = btn.dataset.commandChoose;
      state.game4.selectedOption = chosen;
      const targets = ['stand up', 'sit down', 'open your bag', 'close your book'];
      if (chosen === targets[state.game4.index]) state.game4.score += 1;
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
}

// Initial storage load and render
loadProgressFromStorage();
render();
void loadAvailableTtsVoices();
