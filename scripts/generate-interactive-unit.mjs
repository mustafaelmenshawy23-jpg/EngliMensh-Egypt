import fs from 'node:fs/promises';
import { validateUnitSourceCoverage } from './lib/source-quality-gate.mjs';
import { validateUnitDraftQuality } from './lib/content-quality-validator.mjs';

const required = ['vocabulary','vocabulary_questions','grammar','grammar_questions','reading','listening','speaking','games','comprehensive_test'];
const bookId = process.env.BOOK_ID;
const unitNumber = Number(process.env.UNIT_NUMBER);
const apiKeys = [
  ['GEMINI_API_KEY', process.env.GEMINI_API_KEY],
  ['GEMINI_API_KEY_BACKUP', process.env.GEMINI_API_KEY_BACKUP],
  ['GEMINI_API_KEY_BACKUP_2', process.env.GEMINI_API_KEY_BACKUP_2],
  ['GEMINI_API_KEY_BACKUP_3', process.env.GEMINI_API_KEY_BACKUP_3]
].filter(([, value]) => Boolean(value));
let model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
// Use one explicitly selected standard Flash model. Do not switch models to work around quota limits.
const fallbackModels = [model];
const index = JSON.parse(await fs.readFile('data/curriculum/source-book-index.draft.json','utf8'));
const lessons = JSON.parse(await fs.readFile('src/data/lessons/lessons.draft.json','utf8'));
const manifest = JSON.parse(await fs.readFile('src/data/extracted/manifest.json','utf8'));
const pagesText = await fs.readFile('src/data/extracted/pages.jsonl','utf8');
if (!bookId || !Number.isInteger(unitNumber) || unitNumber < 1) throw new Error('Set BOOK_ID and UNIT_NUMBER.');
if (!apiKeys.length) throw new Error('No Gemini API key secrets are configured; no content was generated.');
const book = index.books.find(b=>b.id===bookId);
if (!book) throw new Error('BOOK_ID does not exist in source index.');
const unit = (book.units||[]).find(u=>u.number===unitNumber);
if (!unit || !Number.isInteger(unit.startPdfPage)) throw new Error('Unit start page is not verified in source index.');
const orderedUnits = [...(book.units||[])].sort((a,b)=>a.number-b.number);
const position = orderedUnits.findIndex(u=>u.number===unitNumber);
const next = orderedUnits[position+1];
if (next && (!Number.isInteger(next.startPdfPage) || next.number !== unitNumber+1)) {
  throw new Error(`Unit boundary is ambiguous: Unit ${unitNumber+1} does not have a verified start page. Refusing to include pages from a later unit.`);
}
const manifestBook = manifest.books.find(b=>b.source?.endsWith('/'+book.sourceFile) || b.source===`public/books/${book.sourceFile}`);
const start = unit.startPdfPage;
const end = next ? next.startPdfPage-1 : manifestBook?.pages;
if (!Number.isInteger(end) || end < start) throw new Error('Could not verify the end of this unit from the next unit start or PDF page count.');
const rows = pagesText.split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line)).filter(p=>p.sourceFilename===book.sourceFile && p.pdfPage>=start && (end===null || p.pdfPage<=end));
const sourceAudit = validateUnitSourceCoverage(rows, start, end);
if (!sourceAudit.ok) {
  throw new Error('Unit source quality gate blocked generation: ' + JSON.stringify({
    missingPages: sourceAudit.missingPages,
    duplicatePages: sourceAudit.duplicatePages,
    outOfRangePages: sourceAudit.outOfRangePages,
    outOfOrderPages: sourceAudit.outOfOrderPages,
    pageIssues: sourceAudit.pageIssues.map((item) => ({ pdfPage: item.pdfPage, reasons: item.reasons }))
  }));
}
const existing = lessons.records.filter(l=>l.bookId===bookId && l.unitNumber===unitNumber);
const sourcePages = rows.map(p=>({pdfPage:p.pdfPage,text:p.text}));
const dialogueTurnSchema = {
  type: 'OBJECT',
  properties: { speaker: { type: 'STRING' }, speakerGender: { type: 'STRING', enum: ['male', 'female', 'unknown'] }, text: { type: 'STRING' } },
  required: ['speaker', 'speakerGender', 'text']
};
const contentSchema = {
  type: 'OBJECT',
  properties: {
    word: { type: 'STRING' }, arabicMeaning: { type: 'STRING' }, example: { type: 'STRING' },
    meaningOrigin: { type: 'STRING', enum: ['source', 'supplementary'] }, exampleOrigin: { type: 'STRING', enum: ['source', 'supplementary'] },
    rule: { type: 'STRING' }, explanation: { type: 'STRING' }, ruleOrigin: { type: 'STRING', enum: ['source', 'supplementary'] }, explanationOrigin: { type: 'STRING', enum: ['source', 'supplementary'] },
    passage: { type: 'STRING' }, script: { type: 'STRING' }, dialogue: { type: 'ARRAY', items: dialogueTurnSchema },
    gameType: { type: 'STRING' }, targetSkill: { type: 'STRING' }, difficulty: { type: 'STRING' },
    question: { type: 'STRING' }, instruction: { type: 'STRING' },
    options: { type: 'ARRAY', items: { type: 'STRING' } },
    correctAnswer: { type: 'STRING' }, answer: { type: 'STRING' }, reason: { type: 'STRING' },
    sourcePdfPage: { type: 'INTEGER' }, contextPdfPage: { type: 'INTEGER' }, origin: { type: 'STRING', enum: ['source', 'supplementary'] }
  },
  required: ['origin']
};
const itemSchema = {
  type: 'OBJECT',
  properties: { itemId: { type: 'STRING' }, content: contentSchema },
  required: ['itemId', 'content']
};
const sectionSchema = {
  type: 'OBJECT',
  properties: {
    type: { type: 'STRING', enum: required },
    title: { type: 'STRING' },
    items: { type: 'ARRAY', items: itemSchema }
  },
  required: ['type', 'title', 'items']
};
const schema = {
  type: 'OBJECT',
  properties: {
    unitTitle: { type: 'STRING' },
    sourceCoverage: { type: 'ARRAY', items: { type: 'INTEGER' } },
    sections: { type: 'ARRAY', items: sectionSchema }
  },
  required: ['unitTitle', 'sourceCoverage', 'sections']
};
const prompt = 'You are an Egyptian English-curriculum editor. Build a complete interactive draft for ' + book.grade + ', Unit ' + unitNumber + ': ' + unit.title + '. Source PDF: ' + book.sourceFile + '. Use only supplied page text for claims marked origin=source. Never invent or misattribute printed passages, audio, rules, questions, dialogues, answers, or page references. sourceCoverage MUST list every supplied PDF page exactly once, in ascending order. For every item use origin=source only when the item itself is visibly present in the book and cite sourcePdfPage. For AI-created practice use origin=supplementary and contextPdfPage; never put sourcePdfPage on supplementary content. Vocabulary: extract all identifiable words and expressions, give a real Arabic meaning and an age-appropriate English example; set meaningOrigin and exampleOrigin separately. Grammar: extract actual book rules/examples, and clearly label any added explanation using ruleOrigin/explanationOrigin. Create at least three varied practice questions for vocabulary and grammar where applicable, each with 3–4 unique options, a correctAnswer that exactly matches one option, and a short reason. Reading: reproduce a complete source passage only if present; otherwise write a clearly supplementary passage, not a claimed quotation. Listening: transcribe only a script actually present in the source; otherwise create a clearly supplementary short script and questions. Speaking: use a source dialogue only if present; otherwise create a supplementary role-play with speaker names and male/female speakerGender for each invented role; use unknown only when source gender is genuinely unclear. Games: create at least two supplementary age-appropriate playable games with gameType, targetSkill, difficulty, instruction, question, options, correctAnswer, and reason. Comprehensive test: create at least five balanced supplementary questions. Keep all nine sections exactly once: ' + required.join(', ') + '. Every section must contain its required content; use supplementary labels when the book does not contain that skill. Match the language and difficulty to ' + book.grade + '. Do not use culturally unsuitable examples. Source text follows as JSON: ' + JSON.stringify(sourcePages);
const requestBody=JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json',responseSchema:schema,temperature:0.2}});
let payload;
let lastFailure;
let selectedKeyName;
let selectedModel;
let authenticated = false;
for (const candidateModel of fallbackModels) {
  model = candidateModel;
  console.log(`Attempting Gemini model: ${model}`);
  let modelUnavailable = false;
  for (const [keyName, apiKey] of apiKeys) {
    let invalidCredential = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: requestBody,
          signal: AbortSignal.timeout(120000)
        });
        if (!response.ok) {
          const detail = (await response.text()).slice(0, 1000);
          const error = new Error(`Gemini API ${response.status}: ${detail}`);
          const invalidKey = response.status === 401 ||
            (response.status === 400 && /API_KEY_INVALID|invalid api key|key not valid/i.test(detail));
          if (invalidKey) {
            lastFailure = error;
            invalidCredential = true;
            console.warn(`Credential ${keyName} was rejected; trying the next configured credential.`);
            break;
          }
          if (response.status === 429 || /RESOURCE_EXHAUSTED|quota/i.test(detail)) {
            throw new Error(`Gemini quota/rate limit reached using ${keyName}. Stopping without rotating credentials or models. ${error.message}`);
          }
          if (![408, 500, 502, 503, 504].includes(response.status)) throw error;
          lastFailure = error;
          if (response.status === 503) modelUnavailable = true;
        } else {
          payload = await response.json();
          selectedKeyName = keyName;
          selectedModel = model;
          authenticated = true;
          break;
        }
      } catch (error) {
        lastFailure = error;
        if (/quota\/rate limit reached/.test(error.message)) throw error;
        const retryable = error.name === 'TimeoutError' || error.name === 'AbortError' ||
          error.cause?.code === 'UND_ERR_HEADERS_TIMEOUT' || /fetch failed/i.test(error.message) ||
          /Gemini API (408|500|502|503|504)/.test(error.message);
        if (!retryable) throw error;
        if (error.name === 'TimeoutError' || error.name === 'AbortError' ||
            error.cause?.code === 'UND_ERR_HEADERS_TIMEOUT' || /fetch failed/i.test(error.message) ||
            /Gemini API (408|500|502|503|504)/.test(error.message)) modelUnavailable = true;
      }
      if (payload) break;
      if (attempt < 3) {
        const delay = Math.min(20000, 5000 * 2 ** (attempt - 1));
        console.warn(`Gemini ${model} attempt ${attempt}/3 failed with ${keyName}: ${lastFailure?.message}. Retrying in ${delay / 1000}s.`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    if (payload) break;
    if (!invalidCredential) break;
  }
  if (payload) break;
  if (modelUnavailable) {
    console.warn(`Gemini model ${model} is unavailable or timing out; switching to the next configured model. API keys will not be rotated to bypass quota limits.`);
    continue;
  }
  break;
}
if (!payload) throw new Error(`Gemini request failed. Last issue: ${lastFailure?.message || 'unknown error'}`);
console.log(`Gemini request succeeded with model ${selectedModel} and configured credential slot: ${selectedKeyName}.`);
const raw=payload.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('');
if(!raw) throw new Error('Gemini returned no structured content.');
const generated=JSON.parse(raw);
const output = {
  schemaVersion: 1,
  datasetStatus: 'draft',
  generatedAt: new Date().toISOString(),
  generator: { provider: 'Google Gemini API', model: selectedModel, reviewStatus: 'needs_review' },
  bookId,
  sourceFilename: book.sourceFile,
  grade: book.grade,
  unitNumber,
  unitTitle: generated.unitTitle,
  sourcePdfRange: { start, end },
  sourceCoverage: generated.sourceCoverage,
  reviewStatus: 'needs_review',
  reviewedBy: null,
  reviewedAt: null,
  sections: (generated.sections || []).map((section) => ({
    ...section,
    items: (section.items || []).map((item) => ({
      ...item,
      reviewStatus: 'needs_review',
      notes: item.content?.origin === 'supplementary'
        ? 'AI-generated supplementary practice; not printed in the source book. Teacher review required.'
        : 'Transcribed from the source book; teacher verification required.'
    }))
  }))
};
const qualityAudit = validateUnitDraftQuality(output, { rows, start, end, grade: book.grade });
output.qualityAudit = qualityAudit;
output.qualitySummary = qualityAudit.metrics;
output.generationStatus = qualityAudit.ok ? 'ready_for_teacher_review' : 'failed_validation';
await fs.mkdir('artifacts/unit-drafts',{recursive:true});
const file='artifacts/unit-drafts/'+bookId+'-unit-'+unitNumber+'.json';
await fs.writeFile(file,JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({
  output: file,
  bookId,
  unitNumber,
  pages: rows.length,
  sections: output.sections.map((section) => ({ type: section.type, items: section.items.length })),
  qualityScore: qualityAudit.score,
  qualityStatus: qualityAudit.status,
  validationErrors: qualityAudit.errors,
  reviewStatus: 'needs_review'
}, null, 2));
if (!qualityAudit.ok) {
  throw new Error('Generated draft failed quality validation: ' + qualityAudit.errors.join(' | '));
}
