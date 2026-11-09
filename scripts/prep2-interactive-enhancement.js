(() => {
  'use strict';
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
  const target = sectionHeadings.find((section) => {
    const heading = section.matches('h2') ? section : section.querySelector('h2');
    const text = (heading?.textContent || '').toLowerCase();
    return sectionType === 'vocabulary' ? /vocabulary quiz/.test(text) :
      sectionType === 'grammar' ? /grammar quiz/.test(text) :
      sectionType === 'reading' ? /reading/.test(text) : /listening/.test(text);
  });
  if (!target) return;
  const overrides = unit.answerKeyOverrides?.[sectionType] || {};
  const optionFixes = unit.optionTextFixes?.[sectionType] || {};
  const questionFixes = unit.questionTextFixes?.[sectionType] || {};
  const excluded = unit.excludedItems?.[sectionType] || {};
  const questions = [...target.querySelectorAll('.question')];
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
    const rawOptions = [...optionsBox.children].filter((node) => node.textContent.trim());
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
    const buttons = rawOptions.map((node, optionIndex) => {
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
      return button;
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
