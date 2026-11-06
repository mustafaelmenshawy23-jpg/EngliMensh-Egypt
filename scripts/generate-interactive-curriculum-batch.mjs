import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const index = JSON.parse(await fs.readFile('data/curriculum/source-book-index.draft.json','utf8'));
const manifest = JSON.parse(await fs.readFile('src/data/extracted/manifest.json','utf8'));
const startIndex = Number(process.env.START_INDEX || 0);
const batchSize = Number(process.env.BATCH_SIZE || 5);
const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY secret is required.');
if (!Number.isInteger(startIndex) || startIndex < 0 || !Number.isInteger(batchSize) || batchSize < 1 || batchSize > 10) {
  throw new Error('START_INDEX must be >= 0 and BATCH_SIZE must be 1..10.');
}
const candidates = [];
for (const book of index.books || []) {
  if (!['student_book','workbook','commercial_supplement'].includes(book.documentType)) continue;
  const units = [...(book.units || [])].sort((a,b)=>a.number-b.number);
  for (let i=0;i<units.length;i++) {
    const unit=units[i], next=units[i+1];
    if (!Number.isInteger(unit.startPdfPage)) continue;
    if (next && (!Number.isInteger(next.startPdfPage) || next.number !== unit.number+1)) continue;
    const manifestBook=manifest.books.find(b=>b.source?.endsWith('/'+book.sourceFile) || b.source===`public/books/${book.sourceFile}`);
    const end=next ? next.startPdfPage-1 : manifestBook?.pages;
    if (!Number.isInteger(end) || end<unit.startPdfPage) continue;
    candidates.push({bookId:book.id,unitNumber:unit.number,title:unit.title,start:unit.startPdfPage,end});
  }
}
candidates.sort((a,b)=>a.bookId.localeCompare(b.bookId)||a.unitNumber-b.unitNumber);
const selected=candidates.slice(startIndex,startIndex+batchSize);
const summary={generatedAt:new Date().toISOString(),startIndex,batchSize,eligibleTotal:candidates.length,selected:selected.length,results:[]};
await fs.mkdir('artifacts/unit-drafts',{recursive:true});
for (const unit of selected) {
  const file=path.join('artifacts/unit-drafts',`${unit.bookId}-unit-${unit.unitNumber}.json`);
  try {
    let skip=false;
    try {
      const prior=JSON.parse(await fs.readFile(file,'utf8'));
      skip=prior.bookId===unit.bookId && prior.unitNumber===unit.unitNumber && prior.reviewStatus==='needs_review' && Array.isArray(prior.sections);
    } catch {}
    if (skip) {
      summary.results.push({...unit,status:'already_generated'});
      continue;
    }
    const sourceBook=index.books.find(b=>b.id===unit.bookId);
    const extractedPages=(await fs.readFile('src/data/extracted/pages.jsonl','utf8')).split(/\\r?\\n/).filter(Boolean).map(line=>JSON.parse(line));
    const unitRows=extractedPages.filter(p=>p.sourceFilename===sourceBook?.sourceFile && p.pdfPage>=unit.start && p.pdfPage<=unit.end);
    const unusablePages=unitRows.filter(p=>!p.text||p.text.length<20).map(p=>p.pdfPage);
    if(unusablePages.length){
      summary.results.push({...unit,status:'blocked_review',error:`Source pages require OCR/visual review: ${unusablePages.join(', ')}`});
      console.warn(`BLOCKED FOR SOURCE REVIEW ${unit.bookId} unit ${unit.unitNumber}: pages ${unusablePages.join(', ')}`);
      await fs.writeFile('artifacts/unit-drafts/progress.json',JSON.stringify(summary,null,2)+'\\n');
      continue;
    }
    console.log(`Generating ${unit.bookId} unit ${unit.unitNumber}: ${unit.title} (PDF ${unit.start}-${unit.end})`);
    await new Promise((resolve,reject)=>{
      const child=spawn(process.execPath,['scripts/generate-interactive-unit.mjs'],{
        stdio:'inherit',
        env:{...process.env,BOOK_ID:unit.bookId,UNIT_NUMBER:String(unit.unitNumber),GEMINI_MODEL:model}
      });
      child.on('error',reject);
      child.on('exit',code=>code===0?resolve():reject(new Error(`Generator exited with code ${code}`)));
    });
    summary.results.push({...unit,status:'generated'});
  } catch(error) {
    const blockedByReview = error.message.includes('pages requiring OCR/visual review');
    summary.results.push({...unit,status:blockedByReview?'blocked_review':'failed',error:error.message});
    console.error(`${blockedByReview?'BLOCKED FOR SOURCE REVIEW':'FAILED'} ${unit.bookId} unit ${unit.unitNumber}: ${error.message}`);
  }
  await fs.writeFile('artifacts/unit-drafts/progress.json',JSON.stringify(summary,null,2)+'\n');
}
await fs.writeFile('artifacts/unit-drafts/progress.json',JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({eligibleTotal:summary.eligibleTotal,selected:summary.selected,generated:summary.results.filter(x=>x.status==='generated').length,skipped:summary.results.filter(x=>x.status==='already_generated').length,blockedForReview:summary.results.filter(x=>x.status==='blocked_review').length,failed:summary.results.filter(x=>x.status==='failed').length,progress:'artifacts/unit-drafts/progress.json'},null,2));
if (summary.results.some(x=>x.status==='failed')) process.exitCode=1;
