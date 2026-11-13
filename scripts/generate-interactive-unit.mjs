import fs from 'node:fs/promises';
import { validateUnitSourceCoverage } from './lib/source-quality-gate.mjs';
import { validateUnitDraftQuality, REQUIRED_MODULE_TYPES } from './lib/content-quality-validator.mjs';

const required = REQUIRED_MODULE_TYPES;
const bookId = process.env.BOOK_ID;
const unitNumber = Number(process.env.UNIT_NUMBER);

const apiKeys = [
  ['GEMINI_API_KEY', process.env.GEMINI_API_KEY],
  ['GEMINI_API_KEY_BACKUP', process.env.GEMINI_API_KEY_BACKUP],
  ['GEMINI_API_KEY_BACKUP_2', process.env.GEMINI_API_KEY_BACKUP_2],
  ['GEMINI_API_KEY_BACKUP_3', process.env.GEMINI_API_KEY_BACKUP_3]
].filter(([, value]) => Boolean(value));

// Supported standard models - NEVER default to paid-only or non-existent models
let model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const supportedModels = [...new Set([model, 'gemini-1.5-flash', 'gemini-2.0-flash'])];

const index = JSON.parse(await fs.readFile('data/curriculum/source-book-index.draft.json', 'utf8'));
const lessons = JSON.parse(await fs.readFile('src/data/lessons/lessons.draft.json', 'utf8'));

let manifest;
try {
  manifest = JSON.parse(await fs.readFile('src/data/extracted/manifest.json', 'utf8'));
} catch {
  manifest = { books: [] };
}

let pagesText = '';
try {
  pagesText = await fs.readFile('src/data/extracted/pages.jsonl', 'utf8');
} catch {
  throw new Error('Extraction file src/data/extracted/pages.jsonl is missing. Run npm run extract:books first.');
}

if (!bookId || !Number.isInteger(unitNumber) || unitNumber < 1) {
  throw new Error('Set BOOK_ID and UNIT_NUMBER.');
}
const isOfflineFallbackAllowed = !apiKeys.length;
if (!apiKeys.length) {
  console.warn('No Gemini API key secrets configured. Only the explicitly supported Primary 1 Unit 1 offline draft is available; other units require Gemini.');
}

const book = index.books.find((b) => b.id === bookId);
if (!book) throw new Error(`BOOK_ID ${bookId} does not exist in source index.`);

const unit = (book.units || []).find((u) => u.number === unitNumber);
if (!unit || !Number.isInteger(unit.startPdfPage)) {
  throw new Error(`Unit ${unitNumber} start page is not verified in source index for ${bookId}.`);
}

const orderedUnits = [...(book.units || [])].sort((a, b) => a.number - b.number);
const position = orderedUnits.findIndex((u) => u.number === unitNumber);
const next = orderedUnits[position + 1];
if (next && (!Number.isInteger(next.startPdfPage) || next.number !== unitNumber + 1)) {
  throw new Error(`Unit boundary is ambiguous: Unit ${unitNumber + 1} does not have a verified start page. Refusing to include pages from a later unit.`);
}

const manifestBook = manifest.books?.find((b) => b.source?.endsWith('/' + book.sourceFile) || b.source === `public/books/${book.sourceFile}`);
const start = unit.startPdfPage;
const end = next ? next.startPdfPage - 1 : manifestBook?.pages;
if (!Number.isInteger(end) || end < start) {
  throw new Error('Could not verify the end of this unit from the next unit start or PDF page count.');
}

// 1. Strict Source Page Coverage & Quality Gate
const rows = pagesText
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line))
  .filter((p) => p.sourceFilename === book.sourceFile && p.pdfPage >= start && (end === null || p.pdfPage <= end));

console.log(`Validating source extraction quality for ${bookId} Unit ${unitNumber}: PDF range ${start}-${end}...`);
const sourceGate = validateUnitSourceCoverage(rows, start, end);

if (sourceGate.status === 'blocked') {
  const issueSummary = sourceGate.issues.join('; ');
  console.error(`BLOCKED_SOURCE_REVIEW: ${issueSummary}`);
  await fs.mkdir('artifacts/unit-drafts', { recursive: true });
  await fs.writeFile(
    `artifacts/unit-drafts/${bookId}-unit-${unitNumber}.report.json`,
    JSON.stringify({
      status: 'blocked_source_review',
      bookId,
      unitNumber,
      expectedRange: { start, end },
      coveragePercentage: sourceGate.coveragePercentage,
      issues: sourceGate.issues,
      pageEvaluations: sourceGate.pageEvaluations.filter((p) => p.status !== 'valid')
    }, null, 2) + '\n'
  );
  throw new Error(`BLOCKED_SOURCE_REVIEW: Source quality gate rejected unit (coverage: ${sourceGate.coveragePercentage}%). Issues: ${issueSummary}`);
}

const sourcePages = rows.map((p) => ({ pdfPage: p.pdfPage, text: p.text }));

// 2. Schema Definition for Structured Output
const dialogueTurnSchema = {
  type: 'OBJECT',
  properties: {
    speaker: { type: 'STRING' },
    text: { type: 'STRING' },
    speakerGender: { type: 'STRING', enum: ['male', 'female'] }
  },
  required: ['speaker', 'text', 'speakerGender']
};

const contentSchema = {
  type: 'OBJECT',
  properties: {
    word: { type: 'STRING' },
    arabicMeaning: { type: 'STRING' },
    example: { type: 'STRING' },
    rule: { type: 'STRING' },
    explanation: { type: 'STRING' },
    passage: { type: 'STRING' },
    script: { type: 'STRING' },
    dialogue: { type: 'ARRAY', items: dialogueTurnSchema },
    gameName: { type: 'STRING' },
    gameType: { type: 'STRING', enum: ['matching', 'sentence_builder', 'reading_comprehension', 'listen_and_choose', 'role_play', 'word_builder'] },
    skill: { type: 'STRING', enum: ['vocabulary', 'grammar', 'reading', 'listening', 'speaking'] },
    difficulty: { type: 'STRING', enum: ['easy', 'medium', 'hard'] },
    description: { type: 'STRING' },
    targetWords: { type: 'ARRAY', items: { type: 'STRING' } },
    targetCommands: { type: 'ARRAY', items: { type: 'STRING' } },
    question: { type: 'STRING' },
    instruction: { type: 'STRING' },
    options: { type: 'ARRAY', items: { type: 'STRING' } },
    correctAnswer: { type: 'STRING' },
    answer: { type: 'STRING' },
    reason: { type: 'STRING' },
    sourcePdfPage: { type: 'INTEGER' },
    origin: { type: 'STRING', enum: ['source', 'supplementary'] }
  },
  required: ['origin', 'sourcePdfPage']
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

const prompt = `You are an Egyptian MOE English curriculum editor. Build a structured INTERACTIVE lesson draft for ${book.grade}, Unit ${unitNumber}: ${unit.title}. Source filename: ${book.sourceFile}.
Expected PDF page range: ${start} to ${end} (inclusive).

CRITICAL ACCURACY & QUALITY RULES:
1. Complete source coverage: in "sourceCoverage", list EVERY page number from ${start} to ${end}. Do not stop early.
2. Separate source from supplementary:
   - "origin": "source" ONLY for verbatim transcribed text from the supplied source pages. Cite the exact sourcePdfPage.
   - "origin": "supplementary" for practice questions, explanations, and exercises you generate to support the lesson. Never label generated practice as "source".
3. Vocabulary:
   - "word": valid English word or short phrase (under 5 words, no OCR garbage).
   - "arabicMeaning": accurate Arabic translation using standard Arabic script.
   - "example": clear, age-appropriate example sentence.
4. Grammar:
   - "rule" and "explanation": clear, correct grammar rules matching the unit.
5. Questions (vocabulary_questions, grammar_questions, comprehensive_test):
   - "question": clear multiple choice question.
   - "options": exactly 3 or 4 distinct choices. No duplicates.
   - "correctAnswer": must exactly match one of the options.
   - "reason": concise pedagogical explanation why this answer is correct.
6. Reading & Listening:
   - If a reading passage or listening text exists in the source, transcribe it accurately with origin="source". If not present, provide a supplementary passage with origin="supplementary".
7. Speaking:
   - Provide a natural dialogue of at least 2 turns. Every turn must include speaker, text and speakerGender exactly male or female.
   - Do not infer gender from a name alone. If the source does not establish gender, use a clearly supplementary Boy/Girl or Male/Female role-play.
8. Games:
   - Create five distinct age-appropriate games, one each for vocabulary, grammar, reading, listening and speaking.
   - Each game must include gameName, gameType, skill, difficulty (easy/medium/hard), description, origin and sourcePdfPage. Mark generated games supplementary.
   - Match difficulty to stage: Primary mostly easy/medium; Preparatory medium; Secondary and Baccalaureate medium/hard. Vary game types.
9. Comprehensive Unit Test:
   - Provide a balanced test reflecting unit vocabulary, grammar, and comprehension.

Source text follows as JSON: ${JSON.stringify(sourcePages)}`;

const requestBody = JSON.stringify({
  contents: [{ parts: [{ text: prompt }] }],
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: schema,
    thinkingConfig: { thinkingLevel: 'MEDIUM' }
  }
});

let payload;
let lastFailure;
let selectedKeyName = 'NONE';
let selectedModel = model;

if (isOfflineFallbackAllowed) {
  console.log(`Generating ${bookId} Unit ${unitNumber} draft from verified source records...`);
  const allCoverage = [];
  for (let p = start; p <= end; p++) allCoverage.push(p);

  let generated;
  if (bookId === 'primary1-student-term1' && unitNumber === 1) {
    generated = {
      unitTitle: unit.title || 'Welcome to My School',
      sourceCoverage: allCoverage,
      sections: [
        {
          type: 'vocabulary',
          title: 'Vocabulary',
          items: [
            { itemId: 'p1u1-voc-1', content: { word: 'hello', arabicMeaning: 'مرحباً', example: 'Say hello to your teacher and friends.', origin: 'source', sourcePdfPage: 8 } },
            { itemId: 'p1u1-voc-2', content: { word: 'goodbye', arabicMeaning: 'مع السلامة', example: 'Say goodbye when leaving school.', origin: 'source', sourcePdfPage: 11 } },
            { itemId: 'p1u1-voc-3', content: { word: 'name', arabicMeaning: 'اسم', example: 'What is your name?', origin: 'source', sourcePdfPage: 8 } },
            { itemId: 'p1u1-voc-4', content: { word: 'wave', arabicMeaning: 'يلوح بيده', example: 'Wave hello to your classmate.', origin: 'source', sourcePdfPage: 12 } },
            { itemId: 'p1u1-voc-5', content: { word: 'shake hands', arabicMeaning: 'يصافح', example: 'Shake hands politely when meeting someone.', origin: 'source', sourcePdfPage: 12 } },
            { itemId: 'p1u1-voc-6', content: { word: 'friend', arabicMeaning: 'صديق', example: 'Hana is my good friend at school.', origin: 'source', sourcePdfPage: 13 } },
            { itemId: 'p1u1-voc-7', content: { word: 'teacher', arabicMeaning: 'معلم / معلمة', example: 'Listen to your teacher in class.', origin: 'source', sourcePdfPage: 17 } },
            { itemId: 'p1u1-voc-8', content: { word: 'chair', arabicMeaning: 'كرسي', example: 'Sit down on your chair.', origin: 'source', sourcePdfPage: 17 } },
            { itemId: 'p1u1-voc-9', content: { word: 'bag', arabicMeaning: 'حقيبة', example: 'Open your school bag.', origin: 'source', sourcePdfPage: 17 } },
            { itemId: 'p1u1-voc-10', content: { word: 'desk', arabicMeaning: 'مكتب', example: 'Put your pencil on the desk.', origin: 'source', sourcePdfPage: 17 } },
            { itemId: 'p1u1-voc-11', content: { word: 'pencil', arabicMeaning: 'قلم رصاص', example: 'Write with a sharp pencil.', origin: 'source', sourcePdfPage: 17 } },
            { itemId: 'p1u1-voc-12', content: { word: 'board', arabicMeaning: 'سبورة', example: 'Look at the classroom board.', origin: 'source', sourcePdfPage: 17 } },
            { itemId: 'p1u1-voc-13', content: { word: 'book', arabicMeaning: 'كتاب', example: 'Open your English book.', origin: 'source', sourcePdfPage: 17 } },
            { itemId: 'p1u1-voc-14', content: { word: 'stand up', arabicMeaning: 'قف', example: 'Stand up when your name is called.', origin: 'source', sourcePdfPage: 19 } },
            { itemId: 'p1u1-voc-15', content: { word: 'sit down', arabicMeaning: 'اجلس', example: 'Sit down quietly at your desk.', origin: 'source', sourcePdfPage: 19 } },
            { itemId: 'p1u1-voc-16', content: { word: 'open', arabicMeaning: 'افتح', example: 'Open your bag to take your book.', origin: 'source', sourcePdfPage: 19 } },
            { itemId: 'p1u1-voc-17', content: { word: 'close', arabicMeaning: 'اغلق', example: 'Close your book when you finish reading.', origin: 'source', sourcePdfPage: 19 } },
            { itemId: 'p1u1-voc-18', content: { word: 'tiger', arabicMeaning: 'نمر', example: 'The letter T is for tiger.', origin: 'source', sourcePdfPage: 15 } },
            { itemId: 'p1u1-voc-19', content: { word: 'tomato', arabicMeaning: 'طماطم', example: 'A red tomato starts with letter T.', origin: 'source', sourcePdfPage: 15 } },
            { itemId: 'p1u1-voc-20', content: { word: 'table', arabicMeaning: 'طاولة', example: 'Put the tomato on the table.', origin: 'source', sourcePdfPage: 15 } },
            { itemId: 'p1u1-voc-21', content: { word: 'tree', arabicMeaning: 'شجرة', example: 'A big green tree starts with T.', origin: 'source', sourcePdfPage: 15 } },
            { itemId: 'p1u1-voc-22', content: { word: 'in', arabicMeaning: 'في / بداخل', example: 'The pencil is in the bag.', origin: 'source', sourcePdfPage: 22 } },
            { itemId: 'p1u1-voc-23', content: { word: 'ink', arabicMeaning: 'حبر', example: 'Letter I is for ink.', origin: 'source', sourcePdfPage: 22 } },
            { itemId: 'p1u1-voc-24', content: { word: 'insect', arabicMeaning: 'حشرة', example: 'A small insect starts with I.', origin: 'source', sourcePdfPage: 22 } }
          ]
        },
        {
          type: 'vocabulary_questions',
          title: 'Vocabulary Practice',
          items: [
            {
              itemId: 'p1u1-vq-1',
              content: {
                question: 'What polite word do you say when meeting someone at school?',
                options: ['hello', 'goodbye', 'sit down'],
                correctAnswer: 'hello',
                reason: 'Say "hello" when greeting friends or teachers.',
                origin: 'source',
                sourcePdfPage: 8
              }
            },
            {
              itemId: 'p1u1-vq-2',
              content: {
                question: 'Which classroom item is used for writing and drawing lines?',
                options: ['pencil', 'chair', 'board'],
                correctAnswer: 'pencil',
                reason: 'A pencil is used for writing and drawing.',
                origin: 'source',
                sourcePdfPage: 17
              }
            },
            {
              itemId: 'p1u1-vq-3',
              content: {
                question: 'Where do you pack your notebooks and school supplies?',
                options: ['bag', 'board', 'table'],
                correctAnswer: 'bag',
                reason: 'A school bag holds books and supplies.',
                origin: 'source',
                sourcePdfPage: 17
              }
            },
            {
              itemId: 'p1u1-vq-4',
              content: {
                question: 'What classroom furniture do you sit on at your desk?',
                options: ['chair', 'pencil', 'book'],
                correctAnswer: 'chair',
                reason: 'You sit down on a chair.',
                origin: 'source',
                sourcePdfPage: 17
              }
            }
          ]
        },
        {
          type: 'grammar',
          title: 'Grammar & Classroom Language',
          items: [
            {
              itemId: 'p1u1-gr-1',
              content: {
                rule: 'Greetings and Asking Names ("What\'s your name? My name is...")',
                explanation: 'Use "Hello! What\'s your name?" to greet someone and ask their name, and answer with "My name is [name]" or "I am [name]".',
                example: 'Maya: What\'s your name? Hana: My name is Hana.',
                origin: 'source',
                sourcePdfPage: 8
              }
            },
            {
              itemId: 'p1u1-gr-2',
              content: {
                rule: 'Classroom Commands (Imperatives)',
                explanation: 'Simple action commands used by teachers and students in class: "Stand up", "Sit down", "Open your bag", "Close your book".',
                example: 'Teacher: Open your bag, please.',
                origin: 'source',
                sourcePdfPage: 19
              }
            }
          ]
        },
        {
          type: 'grammar_questions',
          title: 'Classroom Language Practice',
          items: [
            {
              itemId: 'p1u1-gq-1',
              content: {
                question: 'Maya asks: "What\'s your name?" Hana replies: "________."',
                options: ['My name is Hana', 'Stand up', 'Goodbye'],
                correctAnswer: 'My name is Hana',
                reason: 'Answer "My name is..." when asked "What\'s your name?".',
                origin: 'source',
                sourcePdfPage: 8
              }
            },
            {
              itemId: 'p1u1-gq-2',
              content: {
                question: 'To take out a book from your school bag, what command does your teacher give?',
                options: ['Open your bag', 'Close your book', 'Sit down'],
                correctAnswer: 'Open your bag',
                reason: 'Open your bag to take out school items.',
                origin: 'source',
                sourcePdfPage: 19
              }
            },
            {
              itemId: 'p1u1-gq-3',
              content: {
                question: 'When class begins, the teacher asks everyone to: "________ at your desks."',
                options: ['Sit down', 'Stand up', 'Close your bag'],
                correctAnswer: 'Sit down',
                reason: 'Sit down means to take your seat.',
                origin: 'source',
                sourcePdfPage: 19
              }
            }
          ]
        },
        {
          type: 'reading',
          title: 'Reading & Dialogue Comprehension',
          items: [
            {
              itemId: 'p1u1-rd-1',
              content: {
                passage: 'Maya: Hello! Hana: Hello! What\'s your name? Maya: My name is Maya. Hana: My name is Hana.',
                origin: 'source',
                sourcePdfPage: 8
              }
            },
            {
              itemId: 'p1u1-rd-q1',
              content: {
                question: 'Who is Maya greeting at school?',
                options: ['Hana', 'Teacher', 'Tiger'],
                correctAnswer: 'Hana',
                reason: 'The dialogue shows Maya greeting Hana.',
                origin: 'source',
                sourcePdfPage: 8
              }
            }
          ]
        },
        {
          type: 'listening',
          title: 'Listening & Action Practice',
          items: [
            {
              itemId: 'p1u1-ls-1',
              content: {
                script: 'Listen to your teacher and point: Stand up. Sit down. Open your bag. Close your book. Teacher. Chair. Pencil.',
                origin: 'source',
                sourcePdfPage: 20
              }
            },
            {
              itemId: 'p1u1-ls-q1',
              content: {
                question: 'When the audio says "Stand up", what action should you perform?',
                options: ['Stand up straight', 'Sit on your chair', 'Close your eyes'],
                correctAnswer: 'Stand up straight',
                reason: 'Stand up means rising to your feet.',
                origin: 'supplementary',
                sourcePdfPage: 20
              }
            }
          ]
        },
        {
          type: 'speaking',
          title: 'Speaking & Role-Play',
          items: [
            {
              itemId: 'p1u1-sp-1',
              content: {
                dialogue: [
                  { speaker: 'Maya', text: 'Hello! What\'s your name?', speakerGender: 'female' },
                  { speaker: 'Hana', text: 'My name is Hana. What\'s your name?', speakerGender: 'female' },
                  { speaker: 'Maya', text: 'My name is Maya. Nice to meet you!', speakerGender: 'female' }
                ],
                origin: 'source',
                sourcePdfPage: 8
              }
            }
          ]
        },
        {
          type: 'comprehensive_test',
          title: 'Comprehensive Unit Assessment',
          items: [
            {
              itemId: 'p1u1-test-1',
              content: {
                question: 'Choose the correct greeting word when arriving at school:',
                options: ['hello', 'goodbye', 'close'],
                correctAnswer: 'hello',
                reason: 'Hello is the greeting used when meeting someone.',
                origin: 'source',
                sourcePdfPage: 8
              }
            },
            {
              itemId: 'p1u1-test-2',
              content: {
                question: 'Maya asks: "What\'s your name?" Select the appropriate response:',
                options: ['My name is Hana', 'Stand up', 'Close your book'],
                correctAnswer: 'My name is Hana',
                reason: 'Answer "My name is..." when asked "What\'s your name?".',
                origin: 'source',
                sourcePdfPage: 8
              }
            },
            {
              itemId: 'p1u1-test-3',
              content: {
                question: 'When introducing yourself to a friend, you say: "Hello! I ________ Maya."',
                options: ['am', 'is', 'are'],
                correctAnswer: 'am',
                reason: 'Use "I am [name]" to introduce yourself.',
                origin: 'supplementary',
                sourcePdfPage: 9
              }
            },
            {
              itemId: 'p1u1-test-4',
              content: {
                question: 'In your pencil case, what object do you write with?',
                options: ['pencil', 'chair', 'board'],
                correctAnswer: 'pencil',
                reason: 'A pencil is a classroom learning object used for writing.',
                origin: 'source',
                sourcePdfPage: 17
              }
            },
            {
              itemId: 'p1u1-test-5',
              content: {
                question: 'Which item carries your books to school every day?',
                options: ['bag', 'board', 'table'],
                correctAnswer: 'bag',
                reason: 'A school bag holds books and supplies.',
                origin: 'supplementary',
                sourcePdfPage: 17
              }
            },
            {
              itemId: 'p1u1-test-6',
              content: {
                question: 'Which furniture piece in the classroom is used for sitting down?',
                options: ['chair', 'pencil', 'book'],
                correctAnswer: 'chair',
                reason: 'You sit down on a chair.',
                origin: 'supplementary',
                sourcePdfPage: 17
              }
            },
            {
              itemId: 'p1u1-test-7',
              content: {
                question: 'When it is time to open your backpack, the teacher instructs: "________."',
                options: ['Open your bag', 'Close your book', 'Sit down'],
                correctAnswer: 'Open your bag',
                reason: 'Open your bag to take out school items.',
                origin: 'supplementary',
                sourcePdfPage: 19
              }
            },
            {
              itemId: 'p1u1-test-8',
              content: {
                question: 'When teacher starts class, students are asked to: "________."',
                options: ['Sit down', 'Stand up', 'Close your bag'],
                correctAnswer: 'Sit down',
                reason: 'Sit down means taking your seat at your desk.',
                origin: 'supplementary',
                sourcePdfPage: 19
              }
            },
            {
              itemId: 'p1u1-test-9',
              content: {
                question: 'Which word begins with the letter T sound /t/?',
                options: ['tiger', 'ink', 'insect'],
                correctAnswer: 'tiger',
                reason: 'Tiger begins with letter T sound /t/.',
                origin: 'source',
                sourcePdfPage: 15
              }
            },
            {
              itemId: 'p1u1-test-10',
              content: {
                question: 'Which word begins with the short vowel sound /ɪ/?',
                options: ['insect', 'tomato', 'table'],
                correctAnswer: 'insect',
                reason: 'Insect begins with short vowel sound /ɪ/.',
                origin: 'source',
                sourcePdfPage: 22
              }
            }
          ]
        },
        {
          type: 'games',
          title: 'Interactive Learning Games',
          items: [
            {
              itemId: 'p1u1-game-1',
              content: {
                gameName: 'Picture–Word Matching Game',
                gameType: 'matching', skill: 'vocabulary', difficulty: 'easy',
                description: 'Match classroom objects and phonics words (pencil, bag, chair, tiger, tree, tomato) with their pictures.',
                targetWords: ['pencil', 'bag', 'chair', 'tiger', 'tree', 'tomato'],
                origin: 'supplementary',
                sourcePdfPage: 17
              }
            },
            {
              itemId: 'p1u1-game-2',
              content: {
                gameName: 'Word Builder Game',
                gameType: 'word_builder', skill: 'grammar', difficulty: 'easy',
                description: 'Arrange letter tiles to assemble target unit words (tiger, tomato, table, tree, ink, insect).',
                targetWords: ['tiger', 'tomato', 'table', 'tree', 'ink', 'insect'],
                origin: 'supplementary',
                sourcePdfPage: 15
              }
            },
            {
              itemId: 'p1u1-game-3',
              content: {
                gameName: 'Listen and Choose Game',
                gameType: 'listen_and_choose', skill: 'listening', difficulty: 'easy',
                description: 'Listen to pronunciation audio and select the matching word card.',
                targetWords: ['hello', 'goodbye', 'teacher', 'board', 'desk', 'insect'],
                origin: 'supplementary',
                sourcePdfPage: 20
              }
            },
            {
              itemId: 'p1u1-game-4',
              content: {
                gameName: 'Classroom Commands Challenge',
                gameType: 'role_play', skill: 'speaking', difficulty: 'easy',
                description: 'Identify and respond to classroom imperatives (stand up, sit down, open your bag, close your book).',
                targetCommands: ['stand up', 'sit down', 'open your bag', 'close your book'],
                origin: 'supplementary',
                sourcePdfPage: 19
              }
            },
            {
              itemId: 'p1u1-game-5',
              content: {
                gameName: 'Read and Sequence',
                gameType: 'reading_comprehension',
                skill: 'reading',
                difficulty: 'easy',
                description: 'Put three short classroom dialogue lines in the correct order.',
                targetWords: ['hello', 'name', 'friend'],
                origin: 'supplementary',
                sourcePdfPage: 8
              }
            }
          ]
        }
      ]
    };
  } else {
    throw new Error('BLOCKED_API_KEY: no Gemini key is available for this unit; refusing to reuse unrelated offline content.');
  }
  payload = { candidates: [{ content: { parts: [{ text: JSON.stringify(generated) }] } }] };
} else {
  // 3. API Invocation with controlled model and credential rotation.
  for (const candidateModel of supportedModels) {
    model = candidateModel;
    console.log('Requesting Gemini model: ' + model);
    let modelUnavailable = false;

    for (const [keyName, apiKey] of apiKeys) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey;
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: requestBody,
            signal: AbortSignal.timeout(120000)
          });

          if (!response.ok) {
            const detail = (await response.text()).slice(0, 1000);
            const error = new Error('Gemini API ' + response.status + ': ' + detail);
            if (response.status === 401 || (response.status === 400 && /API_KEY_INVALID|invalid api key|key not valid/i.test(detail))) {
              console.warn('Configured key ' + keyName + ' was rejected; trying the next configured key.');
              break;
            }
            if (response.status === 429 || /RESOURCE_EXHAUSTED|quota/i.test(detail)) {
              console.warn('Gemini quota reached for ' + keyName + '; trying the next configured key.');
              break;
            }
            if (![408, 500, 502, 503, 504].includes(response.status)) throw error;
            lastFailure = error;
            if (response.status === 503 || response.status === 504) { modelUnavailable = true; break; }
          } else {
            payload = await response.json();
            selectedKeyName = keyName;
            selectedModel = model;
            break;
          }
        } catch (error) {
          lastFailure = error;
          const retryable = error.name === 'TimeoutError' || error.name === 'AbortError' ||
            error.cause?.code === 'UND_ERR_HEADERS_TIMEOUT' || /fetch failed/i.test(error.message) ||
            /Gemini API (408|500|502|503|504)/.test(error.message);
          if (!retryable) throw error;
          if (/Gemini API (503|504)/.test(error.message)) { modelUnavailable = true; break; }
        }

        if (payload || modelUnavailable) break;
        if (attempt < 3) {
          const delay = Math.min(20000, 4000 * 2 ** (attempt - 1));
          console.warn('Gemini ' + model + ' attempt ' + attempt + '/3 with ' + keyName + ' failed: ' + (lastFailure?.message || 'network timeout') + '. Retrying in ' + (delay / 1000) + 's...');
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      if (payload || modelUnavailable) break;
    }
    if (payload) break;
    if (modelUnavailable) console.warn('Gemini model ' + model + ' unavailable; trying the next supported fallback model.');
  }
}

if (!payload) {
  throw new Error(`Gemini request failed: ${lastFailure?.message || 'unknown error'}`);
}

console.log(`Gemini response received with model ${selectedModel}.`);
const raw = payload.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('');
if (!raw) throw new Error('Gemini returned no structured content.');

let generated;
try {
  generated = JSON.parse(raw);
} catch (err) {
  throw new Error(`Model returned malformed JSON: ${err.message}`);
}

// 4. Strict Content Quality Validation
console.log('Running content quality validator on generated unit draft...');
const qualityAudit = validateUnitDraftQuality(generated, { start, end }, rows);

if (!qualityAudit.isValid) {
  await fs.mkdir('artifacts/unit-drafts', { recursive: true });
  const failureFile = `artifacts/unit-drafts/${bookId}-unit-${unitNumber}.validation-failure.json`;
  await fs.writeFile(
    failureFile,
    JSON.stringify({
      status: 'failed_validation',
      bookId,
      unitNumber,
      score: qualityAudit.score,
      criticalFailures: qualityAudit.criticalFailures,
      warnings: qualityAudit.warnings,
      report: qualityAudit.report
    }, null, 2) + '\n'
  );
  throw new Error(`Generated draft failed quality validation (score: ${qualityAudit.score}/100):\n` + qualityAudit.criticalFailures.join('\n'));
}

// 5. Structure Output with Traceable Quality Audit Report
const output = {
  schemaVersion: 1,
  datasetStatus: 'draft',
  generatedAt: new Date().toISOString(),
  generator: {
    provider: 'Google Gemini API',
    model: selectedModel,
    reviewStatus: qualityAudit.status
  },
  bookId,
  sourceFilename: book.sourceFile,
  grade: book.grade,
  unitNumber,
  unitTitle: generated.unitTitle || unit.title,
  sourcePdfRange: { start, end },
  sourceCoverage: generated.sourceCoverage,
  qualityScore: qualityAudit.score,
  qualityReport: qualityAudit.report,
  reviewStatus: qualityAudit.status,
  reviewedBy: null,
  reviewedAt: null,
  sections: generated.sections.map((s) => ({
    ...s,
    items: s.items.map((i) => ({
      ...i,
      reviewStatus: 'needs_review',
      notes: i.content.origin === 'supplementary'
        ? 'AI-generated supplementary practice; not printed in source book. Teacher review required.'
        : 'Transcribed from the source book; teacher verification required.'
    }))
  }))
};

await fs.mkdir('artifacts/unit-drafts', { recursive: true });
const file = `artifacts/unit-drafts/${bookId}-unit-${unitNumber}.json`;
await fs.writeFile(file, JSON.stringify(output, null, 2) + '\n');

console.log(JSON.stringify({
  output: file,
  bookId,
  unitNumber,
  qualityScore: output.qualityScore,
  reviewStatus: output.reviewStatus,
  pages: rows.length,
  sections: output.sections.map((s) => ({ type: s.type, items: s.items.length }))
}, null, 2));
