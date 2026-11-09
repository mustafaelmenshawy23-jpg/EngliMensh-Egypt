(() => {
  'use strict';
  if (!/Prep_2_New_Hello_Unit_\d+_Complete\.html$/i.test(location.pathname)) return;
  const layer = window.__PREP2_REVIEW_LAYER__ || {};
  const params = decodeURIComponent(location.hash.slice(1)).split(':');
  const moduleName = params[0] || 'vocabulary';
  const unitNumber = String(Number(params[1] || 0));
  const unit = layer.units?.[unitNumber] || {};
  const sectionType = moduleName === 'vocabulary_questions' ? 'vocabulary' :
    moduleName === 'grammar_questions' ? 'grammar' :
    moduleName === 'grammar' ? 'grammar_guide' :
    moduleName === 'reading' ? 'reading' : moduleName === 'listening' ? 'listening' : null;
  if (!sectionType) return;
  const sectionHeadings = [...document.querySelectorAll('.section, body > h2, .container > h2')];
  let target = sectionHeadings.find((section) => {
    const heading = section.matches('h2') ? section : section.querySelector('h2');
    const text = (heading?.textContent || '').toLowerCase();
    return sectionType === 'vocabulary' ? /vocabulary quiz/.test(text) :
      sectionType === 'grammar' ? /grammar quiz/.test(text) :
      sectionType === 'grammar_guide' ? /grammar/.test(text) && !/grammar quiz/.test(text) :
      sectionType === 'reading' ? /reading/.test(text) : /listening/.test(text);
  });
  if (!target) return;
  // The source document contains every lesson section. Show only the section
  // requested by the app module so learners do not see the whole unit at once.
  document.querySelectorAll('.section').forEach((section) => {
    section.hidden = section !== target;
  });
  if (target.matches('h2')) {
    const wrapper = document.createElement('section');
    wrapper.className = 'prep-generated-quiz-section';
    let sibling = target.nextElementSibling;
    while (sibling && !sibling.matches('h2')) {
      const next = sibling.nextElementSibling;
      wrapper.append(sibling);
      sibling = next;
    }
    target.after(wrapper);
    target = wrapper;
  }
  // Repair the malformed Unit 6 Q6 wrapper before finding nested questions.
  if (sectionType === 'grammar' && unit.markupRepairs?.grammar?.['6']) {
    const malformedQ6 = [...target.querySelectorAll('.question-item')].find((item) => /^\\s*6\\s*[.、)]/.test(item.textContent));
    if (malformedQ6) malformedQ6.classList.replace('question-item', 'question');
  }
  target.querySelectorAll('.question .question').forEach((nested) => {
    nested.parentNode.insertBefore(nested, nested.parentNode.nextSibling);
  });
  if (sectionType === 'grammar_guide') {
    const guide = window.__PREP2_GRAMMAR_GUIDES__?.units?.[unitNumber];
    if (!guide || target.querySelector('.prep-grammar-expanded')) return;
    const panel = document.createElement('section');
    panel.className = 'prep-grammar-expanded';
    panel.dir = 'rtl';
    panel.lang = 'ar';
    const heading = document.createElement('h3');
    heading.textContent = guide.title;
    panel.append(heading);
    const intro = document.createElement('p');
    intro.textContent = guide.purpose;
    panel.append(intro);
    const labels = {
      affirmative: 'الإثبات',
      negative: 'النفي',
      questions: 'السؤال والإجابات القصيرة',
      spelling: 'قواعد تكوين الكلمات',
      signals: 'الكلمات الدالة',
      examples: 'أمثلة',
      warning: 'تنبيه مهم'
    };
    for (const key of ['affirmative','negative','questions','spelling','signals','examples','warning']) {
      const values = Array.isArray(guide[key]) ? guide[key] : guide[key] ? [guide[key]] : [];
      if (!values.length) continue;
      const section = document.createElement('div');
      section.className = 'prep-grammar-topic';
      const subheading = document.createElement('h4');
      subheading.textContent = labels[key];
      section.append(subheading);
      if (key === 'warning') {
        const p = document.createElement('p'); p.textContent = values[0]; section.append(p);
      } else {
        const list = document.createElement('ul');
        values.forEach((value) => { const item = document.createElement('li'); item.textContent = value; list.append(item); });
        section.append(list);
      }
      panel.append(section);
    }
    const style = document.createElement('style');
    style.textContent = '.prep-grammar-expanded{direction:rtl;text-align:right;margin:18px 0;padding:18px;border:1px solid #d8c8a8;border-radius:14px;background:#fffaf0;color:#332b20;line-height:1.8}.prep-grammar-expanded h3{margin-top:0}.prep-grammar-topic{margin:14px 0}.prep-grammar-topic h4{margin-bottom:5px;color:#76552b}.prep-grammar-topic ul{padding-inline-start:24px}.prep-grammar-topic li{margin:6px 0}';
    document.head.append(style);
    const title = target.querySelector('h2');
    (title || target).after(panel);
    return;
  }
  const overrides = unit.answerKeyOverrides?.[sectionType] || {};
  const optionFixes = unit.optionTextFixes?.[sectionType] || {};
  const questionFixes = unit.questionTextFixes?.[sectionType] || {};
  const excluded = unit.excludedItems?.[sectionType] || {};
  const questions = [...target.querySelectorAll('.question')];
  // Short-answer distractors come only from other answers in this same passage/script.
  const shortAnswerBank = questions.map((question, index) => {
    const number = Number((question.textContent.match(/^\\s*(\\d+)\\s*[.、)]/) || [])[1] || index + 1);
    const answerNode = [...question.querySelectorAll('strong, b')].find((node) => /^\\s*Answer:/i.test(node.textContent));
    return answerNode ? {
      id: String(number),
      answer: unit.answerTextFixes?.[sectionType]?.[String(number)] || answerNode.textContent.replace(/^\\s*Answer:\\s*/i, '').trim()
    } : null;
  }).filter(Boolean);
  if (sectionType === 'listening') {
    const scriptNode = [...target.querySelectorAll('p')].find((node) => /listening script/i.test(node.textContent));
    if (scriptNode && !scriptNode.querySelector('[data-listening-play]')) {
      const scriptText = scriptNode.textContent.replace(/^\s*Listening Script:\s*/i, '').replace(/^["“]|["”]$/g, '').trim();
      scriptNode.hidden = true;
      const play = document.createElement('button');
      play.type = 'button'; play.dataset.listeningPlay = 'true'; play.className = 'prep-quiz-check';
      play.textContent = '▶ Play listening text';
      play.addEventListener('click', () => {
        if (!('speechSynthesis' in window)) { status.textContent = 'Audio playback is not supported on this device.'; return; }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(scriptText);
        utterance.lang = 'en-GB'; utterance.rate = 0.88;
        window.speechSynthesis.speak(utterance);
      });
      const stop = document.createElement('button');
      stop.type = 'button'; stop.className = 'prep-quiz-retry'; stop.textContent = '■ Stop audio';
      stop.addEventListener('click', () => window.speechSynthesis?.cancel());
      const transcript = document.createElement('button');
      transcript.type = 'button'; transcript.className = 'prep-quiz-retry'; transcript.textContent = 'Show transcript';
      transcript.setAttribute('aria-expanded', 'false');
      transcript.addEventListener('click', () => {
        scriptNode.hidden = !scriptNode.hidden;
        transcript.textContent = scriptNode.hidden ? 'Show transcript' : 'Hide transcript';
        transcript.setAttribute('aria-expanded', String(!scriptNode.hidden));
      });
      scriptNode.after(play, stop, transcript);
    }
  }
  const style = document.createElement('style');
  style.textContent = `
    .prep-interactive-question { padding:16px; margin:14px 0; border:1px solid #d8e2ec; border-radius:12px; background:#fff; }
    .prep-quiz-prompt { font-weight:700; margin-bottom:12px; line-height:1.6; }
    .prep-quiz-choices { display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:9px; }
    .prep-quiz-option { text-align:left; padding:11px 13px; border:1px solid #cbd5e1; border-radius:9px; background:#f8fafc; color:#172033; cursor:pointer; }
    .prep-quiz-option.selected { border:2px solid #2563eb; background:#eff6ff; }
    .prep-quiz-option.correct { border:2px solid #15803d; background:#f0fdf4; }
    .prep-quiz-option.incorrect { border:2px solid #b91c1c; background:#fef2f2; }
    .prep-quiz-option:disabled { cursor:default; opacity:1; }\n    .prep-answer-input { width:100%; max-width:520px; padding:12px; border:1px solid #94a3b8; border-radius:9px; font:inherit; }\n    .prep-answer-input:disabled { background:#f1f5f9; color:#172033; }\n    .answer-correct { border-color:#15803d !important; background:#f0fdf4 !important; }\n    .answer-incorrect { border-color:#b91c1c !important; background:#fef2f2 !important; }
    .prep-quiz-status { margin:16px 0; padding:12px; border-radius:9px; background:#f1f5f9; font-weight:600; }
    .prep-quiz-check,.prep-quiz-retry { margin:6px 8px 12px 0; padding:11px 18px; border:0; border-radius:9px; background:#1d4ed8; color:white; font-weight:700; cursor:pointer; }
  `;
  document.head.append(style);
  const normalize = (value) => String(value || '').replace(/^[a-d][)\.]\s*/i, '').replace(/\s+/g, ' ').trim();
  const optionLetter = (node, index) => {
    const text = normalize(node.textContent);
    const match = node.textContent.match(/^\s*([a-d])[)\.]/i);
    return (match?.[1] || 'abcd'[index] || '').toLowerCase();
  };
  const status = document.createElement('div');
  status.className = 'prep-quiz-status';
  status.setAttribute('aria-live', 'polite');
  status.textContent = 'Choose an answer for each question. Your score appears after checking.';
  const check = document.createElement('button');
  check.type = 'button'; check.className = 'prep-quiz-check'; check.textContent = 'Check answers';
  const retry = document.createElement('button');
  retry.type = 'button'; retry.className = 'prep-quiz-retry'; retry.textContent = 'Try again'; retry.hidden = true;
  let answered = 0, correct = 0;
  questions.forEach((question, index) => {
    const number = Number((question.textContent.match(/^\s*(\d+)\s*[.、)]/) || [])[1] || index + 1);
    const id = String(number);
    if (excluded[id]) {
      question.hidden = true;
      return;
    }
    if (sectionType === 'reading' || sectionType === 'listening') {
      const answerNode = [...question.querySelectorAll('strong, b')].find((node) => /^\\s*Answer:/i.test(node.textContent));
      if (answerNode) {
        const answer = unit.answerTextFixes?.[sectionType]?.[id] || answerNode.textContent.replace(/^\\s*Answer:\\s*/i, '').trim();
        const original = question.cloneNode(true);
        original.querySelectorAll('strong,b').forEach((node) => node.remove());
        const prompt = document.createElement('div');
        prompt.className = 'prep-quiz-prompt';
        prompt.textContent = number + '. ' + original.textContent.replace(/^\\s*\\d+\\s*[.、)]\\s*/, '').trim();
        const normalized = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\\s+/g, ' ').trim();
        const distractors = shortAnswerBank
          .filter((item) => item.id !== id && normalized(item.answer) !== normalized(answer))
          .map((item) => item.answer)
          .filter((value, index, all) => normalized(value) && all.findIndex((other) => normalized(other) === normalized(value)) === index)
          .slice(0, 3);
        const choicesData = [answer, ...distractors];
        for (let i = choicesData.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [choicesData[i], choicesData[j]] = [choicesData[j], choicesData[i]];
        }
        const choices = document.createElement('div');
        choices.className = 'prep-quiz-choices';
        choices.setAttribute('role', 'group');
        choices.setAttribute('aria-label', 'Question ' + number + ' answer choices');
        const correctIndex = choicesData.findIndex((value) => normalized(value) === normalized(answer));
        choicesData.forEach((label, choiceIndex) => {
          const letter = 'abcd'[choiceIndex];
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'prep-quiz-option';
          button.textContent = letter.toUpperCase() + ') ' + label;
          button.dataset.letter = letter;
          button.setAttribute('aria-pressed', 'false');
          button.addEventListener('click', () => {
            if (question.dataset.checked === 'true') return;
            choices.querySelectorAll('button').forEach((item) => {
              item.classList.remove('selected');
              item.setAttribute('aria-pressed', 'false');
            });
            button.classList.add('selected');
            button.setAttribute('aria-pressed', 'true');
            question.dataset.selected = letter;
          });
          choices.append(button);
        });
        question.replaceChildren(prompt, choices);
        question.dataset.correct = 'abcd'[correctIndex] || '';
        question.dataset.checked = 'false';
        question.classList.add('prep-interactive-question');
        return;
      }
    }
    const optionsBox = question.querySelector('.options');
    if (!optionsBox) return;
    const rawOptions = optionsBox.querySelectorAll('.option-item').length
      ? [...optionsBox.querySelectorAll('.option-item')]
      : optionsBox.innerHTML.split(/<br\s*\/?\s*>/i).map((html) => {
          const wrapper = document.createElement('span');
          wrapper.innerHTML = html;
          return wrapper;
        }).filter((node) => node.textContent.trim());
    if (!rawOptions.length) return;
    let correctLetter = overrides[id]?.correctOption || '';
    if (!correctLetter) {
      const marked = rawOptions.findIndex((node) => node.querySelector('strong') || node.matches('strong'));
      if (marked >= 0) correctLetter = optionLetter(rawOptions[marked], marked);
    }
    const fix = optionFixes[id] || {};
    const prompt = document.createElement('div');
    prompt.className = 'prep-quiz-prompt';
    const original = question.cloneNode(true);
    original.querySelector('.options')?.remove();
    let promptText = original.textContent.replace(/^\s*\d+\s*[.、)]\s*/, '').trim();
    if (questionFixes[id]) promptText = questionFixes[id];
    prompt.textContent = number + '. ' + promptText;
    const choices = document.createElement('div');
    choices.className = 'prep-quiz-choices';
    choices.setAttribute('role', 'group');
    choices.setAttribute('aria-label', 'Question ' + number + ' answer choices');
    const groupName = 'prep-' + sectionType + '-' + unitNumber + '-' + id;
    rawOptions.forEach((node, optionIndex) => {
      const letter = optionLetter(node, optionIndex);
      let label = normalize(node.textContent.replace(/<[^>]*>/g, ' '));
      const plain = node.cloneNode(true);
      plain.querySelectorAll('strong').forEach((strong) => strong.replaceWith(document.createTextNode(strong.textContent)));
      label = normalize(plain.textContent);
      if (fix[letter]) label = fix[letter];
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'prep-quiz-option'; button.textContent = letter.toUpperCase() + ') ' + label;
      button.dataset.letter = letter;
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        if (question.dataset.checked === 'true') return;
        choices.querySelectorAll('button').forEach((item) => { item.classList.remove('selected'); item.setAttribute('aria-pressed', 'false'); });
        button.classList.add('selected');
        button.setAttribute('aria-pressed', 'true');
        question.dataset.selected = letter;
      });
      choices.append(button);
    });
    question.replaceChildren(prompt, choices);
    question.dataset.correct = correctLetter;
    question.dataset.checked = 'false';
    question.classList.add('prep-interactive-question');
  });
  const activeQuestions = questions.filter((question) => !question.hidden && question.classList.contains('prep-interactive-question'));
  if (!activeQuestions.length) return;
  target.append(status, check, retry);
  check.addEventListener('click', () => {
    answered = 0; correct = 0;
    activeQuestions.forEach((question) => {
      const selected = question.dataset.selected;
      const key = question.dataset.correct;
      if (!selected) return;
      answered++;
      const selectedButton = question.querySelector('[data-letter="' + selected + '"]');
      if (selected === key) {
        correct++; selectedButton?.classList.add('correct');
      } else selectedButton?.classList.add('incorrect');
      question.dataset.checked = 'true';
      question.querySelectorAll('button').forEach((button) => { button.disabled = true; });
    });
    const unanswered = activeQuestions.length - answered;
    status.textContent = unanswered
      ? 'You answered ' + answered + ' of ' + activeQuestions.length + '. Complete the remaining questions, then check again.'
      : 'Your result: ' + correct + ' / ' + activeQuestions.length + ' (' + Math.round(correct / activeQuestions.length * 100) + '%).';
    if (unanswered) {
      activeQuestions.filter((question) => !question.dataset.selected).forEach((question) => { question.dataset.checked = 'false'; });
    } else { check.hidden = true; retry.hidden = false; }
  });
 {
  'use strict';
  if (!/Prep_2_New_Hello_Unit_\d+_Complete\.html$/i.test(location.pathname)) return;
  const layer = window.__PREP2_REVIEW_LAYER__ || {};
  const params = decodeURIComponent(location.hash.slice(1)).split(':');
  const moduleName = params[0] || 'vocabulary';
  const unitNumber = String(Number(params[1] || 0));
  const unit = layer.units?.[unitNumber] || {};
  const sectionType = moduleName === 'vocabulary_questions' ? 'vocabulary' :
    moduleName === 'grammar_questions' ? 'grammar' :
    moduleName === 'grammar' ? 'grammar_guide' :
    moduleName === 'reading' ? 'reading' : moduleName === 'listening' ? 'listening' : null;
  if (!sectionType) return;
  const sectionHeadings = [...document.querySelectorAll('.section, body > h2, .container > h2')];
  let target = sectionHeadings.find((section) => {
    const heading = section.matches('h2') ? section : section.querySelector('h2');
    const text = (heading?.textContent || '').toLowerCase();
    return sectionType === 'vocabulary' ? /vocabulary quiz/.test(text) :
      sectionType === 'grammar' ? /grammar quiz/.test(text) :
      sectionType === 'grammar_guide' ? /grammar/.test(text) && !/grammar quiz/.test(text) :
      sectionType === 'reading' ? /reading/.test(text) : /listening/.test(text);
  });
  if (!target) return;
  // The source document contains every lesson section. Show only the section
  // requested by the app module so learners do not see the whole unit at once.
  document.querySelectorAll('.section').forEach((section) => {
    section.hidden = section !== target;
  });
  if (target.matches('h2')) {
    const wrapper = document.createElement('section');
    wrapper.className = 'prep-generated-quiz-section';
    let sibling = target.nextElementSibling;
    while (sibling && !sibling.matches('h2')) {
      const next = sibling.nextElementSibling;
      wrapper.append(sibling);
      sibling = next;
    }
    target.after(wrapper);
    target = wrapper;
  }
  // Repair the malformed Unit 6 Q6 wrapper before finding nested questions.
  if (sectionType === 'grammar' && unit.markupRepairs?.grammar?.['6']) {
    const malformedQ6 = [...target.querySelectorAll('.question-item')].find((item) => /^\\s*6\\s*[.、)]/.test(item.textContent));
    if (malformedQ6) malformedQ6.classList.replace('question-item', 'question');
  }
  target.querySelectorAll('.question .question').forEach((nested) => {
    nested.parentNode.insertBefore(nested, nested.parentNode.nextSibling);
  });
  if (sectionType === 'grammar_guide') {
    const guide = window.__PREP2_GRAMMAR_GUIDES__?.units?.[unitNumber];
    if (!guide || target.querySelector('.prep-grammar-expanded')) return;
    const panel = document.createElement('section');
    panel.className = 'prep-grammar-expanded';
    panel.dir = 'rtl';
    panel.lang = 'ar';
    const heading = document.createElement('h3');
    heading.textContent = guide.title;
    panel.append(heading);
    const intro = document.createElement('p');
    intro.textContent = guide.purpose;
    panel.append(intro);
    const labels = {
      affirmative: 'الإثبات',
      negative: 'النفي',
      questions: 'السؤال والإجابات القصيرة',
      spelling: 'قواعد تكوين الكلمات',
      signals: 'الكلمات الدالة',
      examples: 'أمثلة',
      warning: 'تنبيه مهم'
    };
    for (const key of ['affirmative','negative','questions','spelling','signals','examples','warning']) {
      const values = Array.isArray(guide[key]) ? guide[key] : guide[key] ? [guide[key]] : [];
      if (!values.length) continue;
      const section = document.createElement('div');
      section.className = 'prep-grammar-topic';
      const subheading = document.createElement('h4');
      subheading.textContent = labels[key];
      section.append(subheading);
      if (key === 'warning') {
        const p = document.createElement('p'); p.textContent = values[0]; section.append(p);
      } else {
        const list = document.createElement('ul');
        values.forEach((value) => { const item = document.createElement('li'); item.textContent = value; list.append(item); });
        section.append(list);
      }
      panel.append(section);
    }
    const style = document.createElement('style');
    style.textContent = '.prep-grammar-expanded{direction:rtl;text-align:right;margin:18px 0;padding:18px;border:1px solid #d8c8a8;border-radius:14px;background:#fffaf0;color:#332b20;line-height:1.8}.prep-grammar-expanded h3{margin-top:0}.prep-grammar-topic{margin:14px 0}.prep-grammar-topic h4{margin-bottom:5px;color:#76552b}.prep-grammar-topic ul{padding-inline-start:24px}.prep-grammar-topic li{margin:6px 0}';
    document.head.append(style);
    const title = target.querySelector('h2');
    (title || target).after(panel);
    return;
  }
  const overrides = unit.answerKeyOverrides?.[sectionType] || {};
  const optionFixes = unit.optionTextFixes?.[sectionType] || {};
  const questionFixes = unit.questionTextFixes?.[sectionType] || {};
  const excluded = unit.excludedItems?.[sectionType] || {};
  const questions = [...target.querySelectorAll('.question')];
  // Short-answer distractors come only from other answers in this same passage/script.
  const shortAnswerBank = questions.map((question, index) => {
    const number = Number((question.textContent.match(/^\\s*(\\d+)\\s*[.、)]/) || [])[1] || index + 1);
    const answerNode = [...question.querySelectorAll('strong, b')].find((node) => /^\\s*Answer:/i.test(node.textContent));
    return answerNode ? {
      id: String(number),
      answer: unit.answerTextFixes?.[sectionType]?.[String(number)] || answerNode.textContent.replace(/^\\s*Answer:\\s*/i, '').trim()
    } : null;
  }).filter(Boolean);
  if (sectionType === 'listening') {
    const scriptNode = [...target.querySelectorAll('p')].find((node) => /listening script/i.test(node.textContent));
    if (scriptNode && !scriptNode.querySelector('[data-listening-play]')) {
      const scriptText = scriptNode.textContent.replace(/^\s*Listening Script:\s*/i, '').replace(/^["“]|["”]$/g, '').trim();
      scriptNode.hidden = true;
      const play = document.createElement('button');
      play.type = 'button'; play.dataset.listeningPlay = 'true'; play.className = 'prep-quiz-check';
      play.textContent = '▶ Play listening text';
      play.addEventListener('click', () => {
        if (!('speechSynthesis' in window)) { status.textContent = 'Audio playback is not supported on this device.'; return; }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(scriptText);
        utterance.lang = 'en-GB'; utterance.rate = 0.88;
        window.speechSynthesis.speak(utterance);
      });
      const stop = document.createElement('button');
      stop.type = 'button'; stop.className = 'prep-quiz-retry'; stop.textContent = '■ Stop audio';
      stop.addEventListener('click', () => window.speechSynthesis?.cancel());
      const transcript = document.createElement('button');
      transcript.type = 'button'; transcript.className = 'prep-quiz-retry'; transcript.textContent = 'Show transcript';
      transcript.setAttribute('aria-expanded', 'false');
      transcript.addEventListener('click', () => {
        scriptNode.hidden = !scriptNode.hidden;
        transcript.textContent = scriptNode.hidden ? 'Show transcript' : 'Hide transcript';
        transcript.setAttribute('aria-expanded', String(!scriptNode.hidden));
      });
      scriptNode.after(play, stop, transcript);
    }
  }
  const style = document.createElement('style');
  style.textContent = `
    .prep-interactive-question { padding:16px; margin:14px 0; border:1px solid #d8e2ec; border-radius:12px; background:#fff; }
    .prep-quiz-prompt { font-weight:700; margin-bottom:12px; line-height:1.6; }
    .prep-quiz-choices { display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:9px; }
    .prep-quiz-option { text-align:left; padding:11px 13px; border:1px solid #cbd5e1; border-radius:9px; background:#f8fafc; color:#172033; cursor:pointer; }
    .prep-quiz-option.selected { border:2px solid #2563eb; background:#eff6ff; }
    .prep-quiz-option.correct { border:2px solid #15803d; background:#f0fdf4; }
    .prep-quiz-option.incorrect { border:2px solid #b91c1c; background:#fef2f2; }
    .prep-quiz-option:disabled { cursor:default; opacity:1; }\n    .prep-answer-input { width:100%; max-width:520px; padding:12px; border:1px solid #94a3b8; border-radius:9px; font:inherit; }\n    .prep-answer-input:disabled { background:#f1f5f9; color:#172033; }\n    .answer-correct { border-color:#15803d !important; background:#f0fdf4 !important; }\n    .answer-incorrect { border-color:#b91c1c !important; background:#fef2f2 !important; }
    .prep-quiz-status { margin:16px 0; padding:12px; border-radius:9px; background:#f1f5f9; font-weight:600; }
    .prep-quiz-check,.prep-quiz-retry { margin:6px 8px 12px 0; padding:11px 18px; border:0; border-radius:9px; background:#1d4ed8; color:white; font-weight:700; cursor:pointer; }
  `;
  document.head.append(style);
  const normalize = (value) => String(value || '').replace(/^[a-d][)\.]\s*/i, '').replace(/\s+/g, ' ').trim();
  const optionLetter = (node, index) => {
    const text = normalize(node.textContent);
    const match = node.textContent.match(/^\s*([a-d])[)\.]/i);
    return (match?.[1] || 'abcd'[index] || '').toLowerCase();
  };
  const status = document.createElement('div');
  status.className = 'prep-quiz-status';
  status.setAttribute('aria-live', 'polite');
  status.textContent = 'Choose an answer for each question. Your score appears after checking.';
  const check = document.createElement('button');
  check.type = 'button'; check.className = 'prep-quiz-check'; check.textContent = 'Check answers';
  const retry = document.createElement('button');
  retry.type = 'button'; retry.className = 'prep-quiz-retry'; retry.textContent = 'Try again'; retry.hidden = true;
  let answered = 0, correct = 0;
  questions.forEach((question, index) => {
    const number = Number((question.textContent.match(/^\s*(\d+)\s*[.、)]/) || [])[1] || index + 1);
    const id = String(number);
    if (excluded[id]) {
      question.hidden = true;
      return;
    }
    if (sectionType === 'reading' || sectionType === 'listening') {
      const answerNode = [...question.querySelectorAll('strong, b')].find((node) => /^\\s*Answer:/i.test(node.textContent));
      if (answerNode) {
        const answer = unit.answerTextFixes?.[sectionType]?.[id] || answerNode.textContent.replace(/^\\s*Answer:\\s*/i, '').trim();
        const original = question.cloneNode(true);
        original.querySelectorAll('strong,b').forEach((node) => node.remove());
        const prompt = document.createElement('div');
        prompt.className = 'prep-quiz-prompt';
        prompt.textContent = number + '. ' + original.textContent.replace(/^\\s*\\d+\\s*[.、)]\\s*/, '').trim();
        const normalized = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\\s+/g, ' ').trim();
        const distractors = shortAnswerBank
          .filter((item) => item.id !== id && normalized(item.answer) !== normalized(answer))
          .map((item) => item.answer)
          .filter((value, index, all) => normalized(value) && all.findIndex((other) => normalized(other) === normalized(value)) === index)
          .slice(0, 3);
        const choicesData = [answer, ...distractors];
        for (let i = choicesData.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [choicesData[i], choicesData[j]] = [choicesData[j], choicesData[i]];
        }
        const choices = document.createElement('div');
        choices.className = 'prep-quiz-choices';
        choices.setAttribute('role', 'group');
        choices.setAttribute('aria-label', 'Question ' + number + ' answer choices');
        const correctIndex = choicesData.findIndex((value) => normalized(value) === normalized(answer));
        choicesData.forEach((label, choiceIndex) => {
          const letter = 'abcd'[choiceIndex];
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'prep-quiz-option';
          button.textContent = letter.toUpperCase() + ') ' + label;
          button.dataset.letter = letter;
          button.setAttribute('aria-pressed', 'false');
          button.addEventListener('click', () => {
            if (question.dataset.checked === 'true') return;
            choices.querySelectorAll('button').forEach((item) => {
              item.classList.remove('selected');
              item.setAttribute('aria-pressed', 'false');
            });
            button.classList.add('selected');
            button.setAttribute('aria-pressed', 'true');
            question.dataset.selected = letter;
          });
          choices.append(button);
        });
        question.replaceChildren(prompt, choices);
        question.dataset.correct = 'abcd'[correctIndex] || '';
        question.dataset.checked = 'false';
        question.classList.add('prep-interactive-question');
        return;
      }
    }
    const optionsBox = question.querySelector('.options');
    if (!optionsBox) return;
    const rawOptions = optionsBox.querySelectorAll('.option-item').length
      ? [...optionsBox.querySelectorAll('.option-item')]
      : optionsBox.innerHTML.split(/<br\s*\/?\s*>/i).map((html) => {
          const wrapper = document.createElement('span');
          wrapper.innerHTML = html;
          return wrapper;
        }).filter((node) => node.textContent.trim());
    if (!rawOptions.length) return;
    let correctLetter = overrides[id]?.correctOption || '';
    if (!correctLetter) {
      const marked = rawOptions.findIndex((node) => node.querySelector('strong') || node.matches('strong'));
      if (marked >= 0) correctLetter = optionLetter(rawOptions[marked], marked);
    }
    const fix = optionFixes[id] || {};
    const prompt = document.createElement('div');
    prompt.className = 'prep-quiz-prompt';
    const original = question.cloneNode(true);
    original.querySelector('.options')?.remove();
    let promptText = original.textContent.replace(/^\s*\d+\s*[.、)]\s*/, '').trim();
    if (questionFixes[id]) promptText = questionFixes[id];
    prompt.textContent = number + '. ' + promptText;
    const choices = document.createElement('div');
    choices.className = 'prep-quiz-choices';
    choices.setAttribute('role', 'group');
    choices.setAttribute('aria-label', 'Question ' + number + ' answer choices');
    const groupName = 'prep-' + sectionType + '-' + unitNumber + '-' + id;
    rawOptions.forEach((node, optionIndex) => {
      const letter = optionLetter(node, optionIndex);
      let label = normalize(node.textContent.replace(/<[^>]*>/g, ' '));
      const plain = node.cloneNode(true);
      plain.querySelectorAll('strong').forEach((strong) => strong.replaceWith(document.createTextNode(strong.textContent)));
      label = normalize(plain.textContent);
      if (fix[letter]) label = fix[letter];
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'prep-quiz-option'; button.textContent = letter.toUpperCase() + ') ' + label;
      button.dataset.letter = letter;
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        if (question.dataset.checked === 'true') return;
        choices.querySelectorAll('button').forEach((item) => { item.classList.remove('selected'); item.setAttribute('aria-pressed', 'false'); });
        button.classList.add('selected');
        button.setAttribute('aria-pressed', 'true');
        question.dataset.selected = letter;
      });
      choices.append(button);
    });
    question.replaceChildren(prompt, choices);
    question.dataset.correct = correctLetter;
    question.dataset.checked = 'false';
    question.classList.add('prep-interactive-question');
  });
  const activeQuestions = questions.filter((question) => !question.hidden && question.classList.contains('prep-interactive-question'));
  if (!activeQuestions.length) return;
  target.append(status, check, retry);
  check.addEventListener('click', () => {
    answered = 0; correct = 0;
    activeQuestions.forEach((question) => {
      const selected = question.dataset.selected;
      const key = question.dataset.correct;
      if (!selected) return;
      answered++;
      const selectedButton = question.querySelector('[data-letter="' + selected + '"]');
      if (selected === key) {
        correct++; selectedButton?.classList.add('correct');
      } else selectedButton?.classList.add('incorrect');
      question.dataset.checked = 'true';
      question.querySelectorAll('button').forEach((button) => { button.disabled = true; });
    });
    const unanswered = activeQuestions.length - answered;
    status.textContent = unanswered
      ? 'You answered ' + answered + ' of ' + activeQuestions.length + '. Complete the remaining questions, then check again.'
      : 'Your result: ' + correct + ' / ' + activeQuestions.length + ' (' + Math.round(correct / activeQuestions.length * 100) + '%).';
    if (unanswered) {
      activeQuestions.filter((question) => !question.dataset.selected).forEach((question) => { question.dataset.checked = 'false'; });
    } else { check.hidden = true; retry.hidden = false; }
  });
  retry.addEventListener('click', () => {
    activeQuestions.forEach((question) => {
      delete question.dataset.selected; question.dataset.checked = 'false';
      question.classList.remove('answer-correct','answer-incorrect');
      const input = question.querySelector('.prep-answer-input');
      if (input) { input.disabled = false; input.value = ''; }
      question.querySelectorAll('button').forEach((button) => { button.disabled = false; button.classList.remove('selected','correct','incorrect'); button.setAttribute('aria-pressed', 'false'); });
    });
    status.textContent = 'Choose an answer for each question. Your score appears after checking.';
    retry.hidden = true; check.hidden = false;
  });
})();
