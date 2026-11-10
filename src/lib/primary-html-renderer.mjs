export const PRIMARY_HTML_SECTIONS = [
  ["vocabulary", "Vocabulary", "Words, Arabic meanings, examples and phonics", "Aa"],
  ["vocabulary_questions", "Vocabulary Questions", "Practice the imported word bank", "✎"],
  ["grammar", "Grammar", "The imported rule and examples", "文"],
  ["grammar_questions", "Grammar Questions", "Check the grammar pattern", "✓"],
  ["reading", "Reading", "Read and listen to the passage", "▤"],
  ["listening", "Listening", "Dialogue playback using device TTS", "♫"],
  ["speaking", "Speaking", "Role-play and oral practice", "🗣️"],
  ["games", "Games", "Six supplementary vocabulary games", "★"],
  ["comprehensive_test", "Comprehensive Test", "Mixed review from the supplied question groups", "🏆"]
];

export function stableOptionOrder(questionId, optionCount) {
  const order = Array.from({ length: Math.max(0, optionCount) }, (_, index) => index);
  let seed = 0;
  for (const char of String(questionId)) {
    seed = (seed * 31 + char.charCodeAt(0)) % 2147483647;
  }
  for (let index = order.length - 1; index > 0; index -= 1) {
    seed = (seed * 16807) % 2147483647;
    const swapIndex = Math.floor((seed / 2147483647) * (index + 1));
    [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
  }
  return order;
}

function renderPrimaryQuestions(items, groupKey, selected, track, grade, state, escapeHtml) {
  if (!items.length) return '<p class="primary-empty">No questions were supplied for this section in the imported HTML bundle.</p>';
  return `<div class="primary-question-list">${items.map((question, index) => {
    const questionId = `primary-html-${track.id}-g${grade.grade}-u${selected.number}-${groupKey}-${index}`;
    const options = Array.isArray(question.opts) ? question.opts : [];
    const correctIndex = Number(question.ans);
    const saved = state.quizAnswers?.[questionId];
    const answered = Number.isInteger(saved?.selectedIndex);
    const orderedOptions = stableOptionOrder(questionId, options.length);
    const optionsHtml = orderedOptions.map((originalIndex) => {
      const isCorrect = originalIndex === correctIndex;
      const isSelected = answered && saved.selectedIndex === originalIndex;
      const optionClass = answered ? (isCorrect ? 'is-correct' : isSelected ? 'is-wrong' : '') : '';
      return `<button type="button" class="primary-answer-option ${optionClass}" data-primary-answer="true" data-primary-question="${questionId}" data-option-index="${originalIndex}" data-correct-index="${correctIndex}" ${answered ? 'disabled' : ''}>${escapeHtml(options[originalIndex])}</button>`;
    }).join('');
    const feedback = answered
      ? `<p class="primary-answer-feedback ${saved.isCorrect ? 'correct' : 'incorrect'}">${saved.isCorrect ? 'Correct answer.' : 'Not quite. Correct answer: ' + escapeHtml(options[correctIndex] ?? '')}</p>`
      : '';
    return `<article class="primary-question-card">
      <div class="primary-question-meta">${escapeHtml(question.category || groupKey.replace(/_/g, ' '))} · Question ${index + 1}</div>
      <strong>${escapeHtml(question.q || '')}</strong>
      ${question.audio ? `<button type="button" class="tts-play-btn small" data-tts-text="${escapeHtml(question.audio)}">🔊 Listen to prompt</button>` : ''}
      <div class="primary-answer-options">${optionsHtml}</div>
      ${feedback}
    </article>`;
  }).join('')}</div>`;
}

function primaryGameWords(vocabulary, escapeHtml) {
  return vocabulary.map((word) => {
    const icon = String(word.e || "📘").replace(/[<>&"]/g, "");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="18" fill="#fff7ed"/><text x="48" y="64" font-size="46" text-anchor="middle">${icon}</text></svg>`;
    return {
      word: String(word.en || ""),
      arabic: String(word.ar || ""),
      example: String(word.ex || ""),
      imageType: "svg-illustration",
      svg
    };
  }).filter((word) => word.word);
}

export function renderPrimaryHtmlWorkspace({
  state,
  primaryHtmlCurriculum,
  escapeHtml,
  renderPreparatoryGame = () => '<p class="primary-empty">Games are not available.</p>',
  renderSpeakerVoiceSettings = () => ""
}) {
  if (state.stage !== "primary") return "";
  const track = (primaryHtmlCurriculum.tracks || []).find((item) => item.id === state.path);
  const grade = track?.grades?.find((item) => Number(item.grade) === Number(state.grade));
  const units = grade?.units || [];
  if (!units.length) return "";

  const selected = units.find((unit) => Number(unit.number) === Number(state.primaryUnitNumber));
  const note = '<p class="primary-source-note">Imported HTML bundle · 2026/2027 · not yet verified against the original official PDF. PDF page references were not supplied, so this content remains unapproved.</p>';

  if (!selected) {
    return `<section class="primary-imported panel" dir="ltr">
      <div class="imported-curriculum-heading"><div><p class="eyebrow">PRIMARY CURRICULUM · 2026/2027</p><h2>${escapeHtml(track.name)} · Primary ${state.grade}</h2><p class="library-intro">Choose a unit, then open each learning section on its own screen.</p></div><span class="book-count">${units.length} units</span></div>
      ${note}
      <div class="primary-unit-grid">${units.map((unit) => `<button type="button" class="primary-unit-card" data-primary-unit="${Number(unit.number)}"><span>UNIT ${Number(unit.number)}</span><strong>${escapeHtml(unit.title)}</strong><small>Open learning sections ↗</small></button>`).join('')}</div>
    </section>`;
  }

  const vocabulary = Array.isArray(selected.vocabulary) ? selected.vocabulary : [];
  const vocabularyQuestions = Array.isArray(selected.vocabularyQuestions) ? selected.vocabularyQuestions : [];
  const grammar = selected.grammar || {};
  const grammarQuestions = Array.isArray(grammar.quiz) ? grammar.quiz : [];
  const speakingQuestions = Array.isArray(selected.speakingQuestions) ? selected.speakingQuestions : [];
  const examQuestions = Array.isArray(selected.examQuestions) ? selected.examQuestions : [];
  const dialogue = Array.isArray(selected.dialogue) ? selected.dialogue : [];
  const phonics = selected.phonics || {};
  const scrambleWords = Array.isArray(selected.scrambleWords) ? selected.scrambleWords : [];
  const mixedQuestions = [
    ...vocabularyQuestions.map((question) => ({ ...question, category: "Vocabulary" })),
    ...grammarQuestions.map((question) => ({ ...question, category: "Grammar" })),
    ...speakingQuestions.map((question) => ({ ...question, category: "Speaking" })),
    ...examQuestions.map((question) => ({ ...question, category: "Imported unit check" }))
  ].slice(0, 24);

  const modules = PRIMARY_HTML_SECTIONS.map(([id, title, description, icon]) => {
    const count = {
      vocabulary: vocabulary.length + (phonics.words?.length || 0),
      vocabulary_questions: vocabularyQuestions.length,
      grammar: grammar.rule ? 1 : 0,
      grammar_questions: grammarQuestions.length,
      reading: selected.readingText ? 1 : 0,
      listening: dialogue.length,
      speaking: dialogue.length + speakingQuestions.length,
      games: scrambleWords.length,
      comprehensive_test: mixedQuestions.length
    }[id] || 0;
    const detail = id === "listening"
      ? (count ? count + " dialogue lines · device TTS, not recorded audio" : "No listening script supplied")
      : id === "games"
        ? count + " imported scramble prompts · six app-generated game modes"
        : id === "comprehensive_test"
          ? count + " mixed imported questions · not a Ministry exam"
          : count + (id === "vocabulary" ? " words / phonics items" : " items");
    return { id, title, description, icon, detail };
  });

  if (!state.primarySection) {
    return `<section class="primary-imported panel" dir="ltr">
      <div class="prep-learning-toolbar"><button type="button" class="prep-back-link" data-primary-back>← All primary units</button><div><span class="eyebrow">${escapeHtml(track.name)} · PRIMARY ${state.grade} · UNIT ${Number(selected.number)}</span><h2>${escapeHtml(selected.title)}</h2></div></div>
      ${note}
      <div class="prep-module-grid primary-module-grid">${modules.map((module) => `<button type="button" class="prep-module-card" data-primary-section="${module.id}"><span>${module.icon}</span><strong>${module.title}</strong><small>${module.description}</small><b>${escapeHtml(module.detail)} · Open section ↗</b></button>`).join('')}</div>
    </section>`;
  }

  const section = state.primarySection;
  const module = modules.find((item) => item.id === section);
  if (!module) return "";
  const toolbar = `<div class="prep-learning-toolbar"><button type="button" class="prep-back-link" data-primary-section-back>← ${escapeHtml(selected.title)}</button><div><span class="eyebrow">${escapeHtml(track.name)} · PRIMARY ${state.grade} · UNIT ${Number(selected.number)}</span><h2>${module.title}</h2></div></div>`;
  let body = "";

  if (section === "vocabulary") {
    body = `<section class="primary-content-section"><h3>Vocabulary · ${vocabulary.length} words</h3><div class="primary-vocab-grid">${vocabulary.map((word) => `<article class="primary-vocab-card"><span>${escapeHtml(word.e || "📘")}</span><strong>${escapeHtml(word.en || "")}</strong><b dir="rtl">${escapeHtml(word.ar || "")}</b><small>${escapeHtml(word.ex || "")}</small><button type="button" class="tts-play-btn small" data-tts-text="${escapeHtml(word.en || "")}">🔊 Listen to pronunciation</button></article>`).join('')}</div>
      ${phonics.title ? `<div class="primary-phonics-card"><h3>${escapeHtml(phonics.title)}</h3><p>${escapeHtml(phonics.desc || "")}</p><div class="primary-phonics-words">${(phonics.words || []).map((word) => `<button type="button" class="primary-answer-option" data-tts-text="${escapeHtml(word)}">${escapeHtml(word)} · 🔊</button>`).join('')}</div></div>` : ''}</section>
      <p class="primary-source-note">Vocabulary and phonics are imported HTML content, not yet checked against PDF page numbers.</p>`;
  } else if (section === "vocabulary_questions") {
    body = renderPrimaryQuestions(vocabularyQuestions, "vocabulary", selected, track, grade, state, escapeHtml);
  } else if (section === "grammar") {
    body = `<section class="primary-content-section"><h3>Imported grammar rule</h3><p>${escapeHtml(grammar.rule || "No grammar rule supplied in the imported HTML.")}</p><div class="primary-example-list">${(grammar.examples || []).map((example) => `<p class="primary-example">${escapeHtml(example)}</p>`).join('')}</div></section>
      <p class="primary-source-note">Any additional explanation shown here is limited to the imported HTML text; no AI-generated rule is attributed to the book.</p>`;
  } else if (section === "grammar_questions") {
    body = renderPrimaryQuestions(grammarQuestions, "grammar", selected, track, grade, state, escapeHtml);
  } else if (section === "reading") {
    body = `<section class="primary-content-section"><h3>Reading passage · imported HTML</h3><p class="primary-reading">${escapeHtml(selected.readingText || "No reading passage supplied in the imported HTML.")}</p>${selected.readingText ? `<button type="button" class="big-audio-btn secondary" data-tts-text="${escapeHtml(selected.readingText)}">🔊 Listen to the passage using device TTS</button>` : ''}</section>
      <p class="primary-source-note">No separate reading-comprehension questions were supplied for this unit. No questions have been invented or attributed to the source.</p>`;
  } else if (section === "listening" || section === "speaking") {
    const roleLines = dialogue.map((line, index) => {
      const gender = ["male", "female"].includes(line.gender) ? line.gender : "unknown";
      return { speaker: line.speaker || "Speaker " + (index + 1), text: line.text || "", speakerGender: gender === "unknown" ? null : gender, gender };
    });
    const payload = escapeHtml(JSON.stringify(roleLines.map(({ speaker, text, speakerGender }) => ({ speaker, text, speakerGender }))));
    body = `<section class="primary-content-section"><h3>${section === "listening" ? "Dialogue listening" : "Speaking role-play"}</h3>
      <p class="primary-source-note">The imported HTML supplies dialogue text, not a recorded listening file. Playback below uses device text-to-speech.</p>
      <div class="speaking-dialogue-list">${roleLines.map((line, index) => `<article class="speaking-line-card"><span class="speaking-line-speaker">${escapeHtml(line.speaker)} · ${line.gender === "unknown" ? "Voice not verified" : line.gender + " role tag from imported HTML"}</span><p dir="ltr">${escapeHtml(line.text)}</p><button type="button" class="speaking-line-audio" data-tts-text="${escapeHtml(line.text)}" data-tts-gender="${line.speakerGender || ""}">🔊 Listen to line</button></article>`).join('')}</div>
      <button type="button" class="big-audio-btn secondary" data-play-dialogue="${payload}">🔊 Play full dialogue</button>
      ${renderSpeakerVoiceSettings()}
      ${section === "speaking" ? renderPrimaryQuestions(speakingQuestions, "speaking", selected, track, grade, state, escapeHtml) + '<p class="speaking-practice-note">Practise the roles aloud. The app does not record microphone audio or score pronunciation.</p>' : '<p class="speaking-practice-note">Listen and follow each speaker. No original recorded audio was supplied.</p>'}
    </section>`;
  } else if (section === "games") {
    const words = primaryGameWords(vocabulary, escapeHtml);
    body = `<section class="primary-content-section"><h3>Supplementary learning games</h3><p class="primary-source-note">These game mechanics are generated by the app from the imported unit vocabulary. Emoji icons are used instead of unverified photographs.</p>${renderPreparatoryGame(words)}</section>
      <section class="primary-content-section"><h3>Imported word-scramble prompts</h3>${scrambleWords.length ? `<div class="primary-question-list">${scrambleWords.map((item) => `<article class="primary-question-card"><strong>${escapeHtml(item.word || "")}</strong><p>${escapeHtml(item.hint || "")}</p></article>`).join('')}</div>` : '<p class="primary-empty">No word-scramble prompts were supplied.</p>'}</section>`;
  } else if (section === "comprehensive_test") {
    body = `<section class="primary-content-section"><h3>Mixed unit review · ${mixedQuestions.length} questions</h3><p class="primary-source-note">This review combines every question group supplied in the HTML bundle. The bundle contains only ${examQuestions.length} standalone exam questions and no separate reading/listening comprehension questions; this is not an official Ministry final exam.</p>${renderPrimaryQuestions(mixedQuestions, "mixed_review", selected, track, grade, state, escapeHtml)}</section>`;
  }

  return `<section class="primary-imported panel" dir="ltr">${toolbar}${note}${body}</section>`;
}
