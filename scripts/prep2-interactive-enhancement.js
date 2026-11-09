(() => {
  'use strict';
  if (!/Prep_2_New_Hello_Unit_\\d+_Complete\\.html$/i.test(location.pathname)) return;
  const layer = window.__PREP2_REVIEW_LAYER__ || {};
  const params = decodeURIComponent(location.hash.slice(1)).split(':');
  const moduleName = params[0] || 'vocabulary';
  const unitNumber = String(Number(params[1] || 0));
  const unit = layer.units?.[unitNumber] || {};
  const sectionType = moduleName === 'vocabulary_questions' ? 'vocabulary' :
    moduleName === 'grammar_questions' ? 'grammar' :
    moduleName === 'reading' ? 'reading' : moduleName === 'listening' ? 'listening' : null;
  if (!sectionType) return;
  const sectionHeadings = [...document.querySelectorAll('.section, body > h2, .container > h2')];
  let target = sectionHeadings.find((section) => {
    const heading = section.matches('h2') ? section : section.querySelector('h2');
    const text = (heading?.textContent || '').toLowerCase();
    return sectionType === 'vocabulary' ? /vocabulary quiz/.test(text) :
      sectionType === 'grammar' ? /grammar quiz/.test(text) :
      sectionType === 'reading' ? /reading/.test(text) : /listening/.test(text);
  });
  if (!target) return;
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
  target.querySelectorAll('.question .question').forEach((nested) => {
    nested.parentNode.insertBefore(nested, nested.parentNode.nextSibling);
  });
  const overrides = unit.answerKeyOverrides?.[sectionType] || {};
  const optionFixes = unit.optionTextFixes?.[sectionType] || {};
  const questionFixes = unit.questionTextFixes?.[sectionType] || {};
  const excluded = unit.excludedItems?.[sectionType] || {};
  const questions = [...target.querySelectorAll('.question')];
  const style = document.createElement('style');
  style.textContent = `
    .prep-interactive-question { padding:16px; margin:14px 0; border:1px solid #d8e2ec; border-radius:12px; background:#fff; }
    .prep-quiz-prompt { font-weight:700; margin-bottom:12px; line-height:1.6; }
    .prep-quiz-choices { display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:9px; }
    .prep-quiz-option { text-align:left; padding:11px 13px; border:1px solid #cbd5e1; border-radius:9px; background:#f8fafc; color:#172033; cursor:pointer; }
    .prep-quiz-option.selected { border:2px solid #2563eb; background:#eff6ff; }
    .prep-quiz-option.correct { border:2px solid #15803d; background:#f0fdf4; }
    .prep-quiz-option.incorrect { border:2px solid #b91c1c; background:#fef2f2; }
    .prep-quiz-option:disabled { cursor:default; opacity:1; }
    .prep-quiz-status { margin:16px 0; padding:12px; border-radius:9px; background:#f1f5f9; font-weight:600; }
    .prep-quiz-check,.prep-quiz-retry { margin:6px 8px 12px 0; padding:11px 18px; border:0; border-radius:9px; background:#1d4ed8; color:white; font-weight:700; cursor:pointer; }
  `;
  document.head.append(style);
  const normalize = (value) => String(value || '').replace(/^[a-d][)\\.]\\s*/i, '').replace(/\\s+/g, ' ').trim();
  const optionLetter = (node, index) => {
    const text = normalize(node.textContent);
    const match = node.textContent.match(/^\\s*([a-d])[)\\.]/i);
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
    const number = Number((question.textContent.match(/^\\s*(\\d+)\\s*[.、)]/) || [])[1] || index + 1);
    const id = String(number);
    if (excluded[id]) {
      question.hidden = true;
      return;
    }
    const optionsBox = question.querySelector('.options');
    if (!optionsBox) return;
    const rawOptions = optionsBox.querySelectorAll('.option-item').length
      ? [...optionsBox.querySelectorAll('.option-item')]
      : optionsBox.innerHTML.split(/<br\\s*\\/?\\s*>/i).map((html) => {
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
    let promptText = original.textContent.replace(/^\\s*\\d+\\s*[.、)]\\s*/, '').trim();
    if (questionFixes[id]) promptText = questionFixes[id];
    prompt.textContent = number + '. ' + promptText;
    const choices = document.createElement('div');
    choices.className = 'prep-quiz-choices';
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
      button.addEventListener('click', () => {
        if (question.dataset.checked === 'true') return;
        choices.querySelectorAll('button').forEach((item) => item.classList.remove('selected'));
        button.classList.add('selected');
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
    status.textContent = unanswered ? 'You answered ' + answered + ' of ' + activeQuestions.length + '. Complete the remaining questions, then check again.' :
      'Your result: ' + correct + ' / ' + activeQuestions.length + ' (' + Math.round(correct / activeQuestions.length * 100) + '%).';
    if (unanswered) {
      activeQuestions.filter((question) => !question.dataset.selected).forEach((question) => { question.dataset.checked = 'false'; });
      activeQuestions.forEach((question) => question.querySelectorAll('button').forEach((button) => { button.disabled = false; }));
    } else { check.hidden = true; retry.hidden = false; }
  });
  retry.addEventListener('click', () => {
    activeQuestions.forEach((question) => {
      delete question.dataset.selected; question.dataset.checked = 'false';
      question.querySelectorAll('button').forEach((button) => { button.disabled = false; button.classList.remove('selected','correct','incorrect'); });
    });
    status.textContent = 'Choose an answer for each question. Your score appears after checking.';
    retry.hidden = true; check.hidden = false;
  });
})();
