import fs from 'node:fs/promises';

const required = ['vocabulary','vocabulary_questions','grammar','grammar_questions','reading','listening','speaking','comprehensive_test'];
const bookId = process.env.BOOK_ID;
const unitNumber = Number(process.env.UNIT_NUMBER);
const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const index = JSON.parse(await fs.readFile('data/curriculum/source-book-index.draft.json','utf8'));
const lessons = JSON.parse(await fs.readFile('src/data/lessons/lessons.draft.json','utf8'));
const manifest = JSON.parse(await fs.readFile('src/data/extracted/manifest.json','utf8'));
const pagesText = await fs.readFile('src/data/extracted/pages.jsonl','utf8');
if (!bookId || !Number.isInteger(unitNumber) || unitNumber < 1) throw new Error('Set BOOK_ID and UNIT_NUMBER.');
if (!apiKey) throw new Error('GEMINI_API_KEY secret is required; no content was generated.');
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
if (!rows.length) throw new Error('No extracted pages found for this unit. Run the book extraction workflow first.');
if (rows[0].pdfPage !== start || rows[rows.length-1].pdfPage !== end) throw new Error(`Extracted page range is incomplete: expected ${start}-${end}, found ${rows[0].pdfPage}-${rows[rows.length-1].pdfPage}.`);
const unusable = rows.filter(p=>!p.text || p.text.length<20);
if (unusable.length) throw new Error('Unit has pages requiring OCR/visual review: '+unusable.map(p=>p.pdfPage).join(', ')+'. Refusing to generate from incomplete source text.');
const existing = lessons.records.filter(l=>l.bookId===bookId && l.unitNumber===unitNumber);
const sourcePages = rows.map(p=>({pdfPage:p.pdfPage,text:p.text}));
const dialogueTurnSchema = {
  type: 'OBJECT',
  properties: { speaker: { type: 'STRING' }, text: { type: 'STRING' } },
  required: ['speaker', 'text']
};
const contentSchema = {
  type: 'OBJECT',
  properties: {
    word: { type: 'STRING' }, arabicMeaning: { type: 'STRING' }, example: { type: 'STRING' },
    rule: { type: 'STRING' }, explanation: { type: 'STRING' }, passage: { type: 'STRING' },
    script: { type: 'STRING' }, dialogue: { type: 'ARRAY', items: dialogueTurnSchema },
    question: { type: 'STRING' }, instruction: { type: 'STRING' },
    options: { type: 'ARRAY', items: { type: 'STRING' } },
    correctAnswer: { type: 'STRING' }, answer: { type: 'STRING' }, reason: { type: 'STRING' },
    sourcePdfPage: { type: 'INTEGER' }, origin: { type: 'STRING', enum: ['source', 'supplementary'] }
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
const prompt = `You are an Egyptian MOE English curriculum editor. Build a structured INTERACTIVE lesson draft for ${book.grade}, Unit ${unitNumber}: ${unit.title}. Source filename: ${book.sourceFile}. Use ONLY the source page text supplied. Do not invent or attribute text to the printed book. Separate exact source-derived material (origin="source") from new supplementary practice (origin="supplementary"). For each item, cite sourcePdfPage as one of the supplied PDF page numbers. If a category is absent from the pages, return an empty items array for it; do not fabricate a reading/listening/dialogue/grammar. Vocabulary entries need word, arabicMeaning, example. Grammar entries need rule and explanation. Questions need question, options (3-4), correctAnswer, reason. Reading/listening need passage/script and nested questions represented as separate question items in the same section. Speaking needs dialogue array with different speaker labels and short turns. Build a complete coverage draft across these eight section types: ${required.join(', ')}. Use simple age-appropriate English. Every generated practice item must be clearly supplementary. Source text follows as JSON: ${JSON.stringify(sourcePages)}`;
const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,{
 method:'POST',headers:{'content-type':'application/json'},
 body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json',responseSchema:schema,temperature:0.2}})
});
if(!response.ok) throw new Error(`Gemini API ${response.status}: ${(await response.text()).slice(0,1000)}`);
const payload=await response.json();
const raw=payload.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('');
if(!raw) throw new Error('Gemini returned no structured content.');
const generated=JSON.parse(raw);
const byType=new Map(generated.sections.map(s=>[s.type,s]));
for(const type of required) if(!byType.has(type)) throw new Error('Missing required section: '+type);
if(generated.sourceCoverage.some(p=>!rows.some(r=>r.pdfPage===p))) throw new Error('Model cited a page outside the extracted unit range.');
const errors=[];
for(const section of generated.sections) for(const item of section.items){
 const c=item.content||{};
 if(!item.itemId || !c.origin || !['source','supplementary'].includes(c.origin)) errors.push('Missing item identity/origin');
 if(!Number.isInteger(c.sourcePdfPage) || !rows.some(r=>r.pdfPage===c.sourcePdfPage)) errors.push('Invalid source page: '+item.itemId);
 if(section.type.endsWith('_questions') || section.type==='comprehensive_test'){
  if(!c.question || !Array.isArray(c.options) || c.options.length<2 || !c.correctAnswer || !c.reason) errors.push('Incomplete question/key/reason: '+item.itemId);
  else if(!c.options.includes(c.correctAnswer)) errors.push('Answer key not among options: '+item.itemId);
 }
}
if(errors.length) throw new Error('Generated draft failed validation:\\n'+errors.join('\\n'));
const output={schemaVersion:1,datasetStatus:'draft',generatedAt:new Date().toISOString(),generator:{provider:'Google Gemini API',model,reviewStatus:'needs_review'},bookId,sourceFilename:book.sourceFile,grade:book.grade,unitNumber,unitTitle:generated.unitTitle,sourcePdfRange:{start,end},sourceCoverage:generated.sourceCoverage,reviewStatus:'needs_review',reviewedBy:null,reviewedAt:null,sections:generated.sections.map(s=>({...s,items:s.items.map(i=>({...i,reviewStatus:'needs_review',notes:i.content.origin==='supplementary'?'AI-generated supplementary practice; not printed in source book. Teacher review required.':'Transcribed from the source book; teacher verification required.'}))}))};
await fs.mkdir('artifacts/unit-drafts',{recursive:true});
const file='artifacts/unit-drafts/'+bookId+'-unit-'+unitNumber+'.json';
await fs.writeFile(file,JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({output:file,bookId,unitNumber,pages:rows.length,sections:output.sections.map(s=>({type:s.type,items:s.items.length})),status:'needs_review'},null,2));
