const STRING = (description) => ({ type: 'STRING', description });
const INTEGER = (description) => ({ type: 'INTEGER', description });
const ORIGIN = { type: 'STRING', enum: ['source', 'supplementary'] };

function objectSchema(properties, required) {
  return { type: 'OBJECT', properties, required };
}

const questionContent = objectSchema({
  question: STRING('One clear, age-appropriate multiple-choice question.'),
  options: {
    type: 'ARRAY',
    description: 'Exactly 3 or 4 distinct answer options.',
    items: STRING('One answer option.')
  },
  correctAnswer: STRING('Must exactly match one of the options.'),
  reason: STRING('Brief explanation supporting the correct answer.'),
  origin: ORIGIN,
  sourcePdfPage: INTEGER('Exact PDF page supporting the question context; must be within the unit range.')
}, ['question', 'options', 'correctAnswer', 'reason', 'origin', 'sourcePdfPage']);

const readingPassageContent = objectSchema({
  passage: STRING('The complete reading passage. Transcribe as source only when visible in the supplied PDF; otherwise write a clearly supplementary passage.'),
  origin: ORIGIN,
  sourcePdfPage: INTEGER('Exact PDF page containing the passage, or a supporting unit page for supplementary material.')
}, ['passage', 'origin', 'sourcePdfPage']);

const listeningScriptContent = objectSchema({
  script: STRING('A complete listening script. Use source only when the transcript is printed in the supplied PDF; otherwise create a clearly supplementary script.'),
  origin: ORIGIN,
  sourcePdfPage: INTEGER('Exact PDF page containing the transcript or audio activity, or a supporting unit page for supplementary material.')
}, ['script', 'origin', 'sourcePdfPage']);

const dialogueTurnSchema = objectSchema({
  speaker: STRING('Speaker role or name as printed in the source, or a clear role for supplementary dialogue.'),
  text: STRING('The exact spoken line.'),
  speakerGender: { type: 'STRING', enum: ['male', 'female', 'unknown'] }
}, ['speaker', 'text', 'speakerGender']);

const speakingContent = objectSchema({
  dialogue: {
    type: 'ARRAY',
    description: 'At least two ordered dialogue turns. Use unknown when gender is not explicit; do not infer gender from a name alone.',
    items: dialogueTurnSchema
  },
  origin: ORIGIN,
  sourcePdfPage: INTEGER('Exact PDF page containing the dialogue or speaking activity.')
}, ['dialogue', 'origin', 'sourcePdfPage']);

const sectionDefinitions = [
  {
    type: 'vocabulary',
    title: 'Vocabulary',
    content: objectSchema({
      word: STRING('Exactly one English word or short phrase of no more than four words; never combine a word list or include its translation here.'),
      arabicMeaning: STRING('Accurate Arabic meaning in Arabic script.'),
      example: STRING('One correct, age-appropriate English example sentence.'),
      origin: ORIGIN,
      sourcePdfPage: INTEGER('Exact PDF page where the word or phrase appears.')
    }, ['word', 'arabicMeaning', 'example', 'origin', 'sourcePdfPage'])
  },
  { type: 'vocabulary_questions', title: 'Vocabulary Questions', content: questionContent },
  {
    type: 'grammar',
    title: 'Grammar',
    content: objectSchema({
      rule: STRING('One grammar rule or functional-language point relevant to this unit.'),
      explanation: STRING('A clear explanation. If the book does not teach the rule explicitly, mark the item supplementary.'),
      example: STRING('A correct example sentence demonstrating the rule.'),
      origin: ORIGIN,
      sourcePdfPage: INTEGER('Exact PDF page where the source rule appears, or a supporting unit page for supplementary explanation.')
    }, ['rule', 'explanation', 'example', 'origin', 'sourcePdfPage'])
  },
  { type: 'grammar_questions', title: 'Grammar Questions', content: questionContent },
  {
    type: 'reading',
    title: 'Reading',
    content: { anyOf: [readingPassageContent, questionContent] }
  },
  {
    type: 'listening',
    title: 'Listening',
    content: { anyOf: [listeningScriptContent, questionContent] }
  },
  { type: 'speaking', title: 'Speaking', content: speakingContent },
  {
    type: 'games',
    title: 'Games',
    content: objectSchema({
      gameName: STRING('Short, age-appropriate game name.'),
      description: STRING('How the learner plays this multiple-choice challenge.'),
      skill: { type: 'STRING', enum: ['vocabulary', 'grammar', 'reading', 'listening', 'speaking'] },
      difficulty: { type: 'STRING', enum: ['easy', 'medium', 'challenging'] },
      gameMode: { type: 'STRING', enum: ['multiple_choice'] },
      question: STRING('The actual playable question prompt.'),
      options: {
        type: 'ARRAY',
        description: 'Exactly 3 or 4 distinct answer options.',
        items: STRING('One answer option.')
      },
      correctAnswer: STRING('Must exactly match one of the options.'),
      reason: STRING('Brief explanation supporting the correct answer.'),
      origin: { type: 'STRING', enum: ['supplementary'] },
      sourcePdfPage: INTEGER('A supporting PDF page within this unit range.')
    }, ['gameName', 'description', 'skill', 'difficulty', 'gameMode', 'question', 'options', 'correctAnswer', 'reason', 'origin', 'sourcePdfPage'])
  },
  { type: 'comprehensive_test', title: 'Comprehensive Unit Test', content: questionContent }
];

function makeSectionSchema(definition) {
  return {
    type: 'OBJECT',
    properties: {
      type: { type: 'STRING', enum: [definition.type] },
      title: { type: 'STRING', description: 'Section heading.' },
      items: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            itemId: STRING('Unique stable ID within this unit draft.'),
            content: definition.content
          },
          required: ['itemId', 'content']
        }
      }
    },
    required: ['type', 'title', 'items']
  };
}

export function buildInteractiveUnitSchema() {
  return {
    type: 'OBJECT',
    properties: {
      unitTitle: STRING('The exact unit title from the curriculum source index.'),
      sections: {
        type: 'ARRAY',
        description: 'Exactly nine sections in this order: vocabulary, vocabulary_questions, grammar, grammar_questions, reading, listening, speaking, games, comprehensive_test.',
        items: { anyOf: sectionDefinitions.map(makeSectionSchema) }
      }
    },
    required: ['unitTitle', 'sections']
  };
}
