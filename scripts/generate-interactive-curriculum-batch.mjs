import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
const index=JSON.parse(await fs.readFile('data/curriculum/source-book-index.draft.json','utf8'));
const manifest=JSON.parse(await fs.readFile('src/data/extracted/manifest.json','utf8'));
const startIndex=Number(process.env.START_INDEX||0),batchSize=Number(process.env.BATCH_SIZE||5),model=process.env.GEMINI_MODEL||'gemini-3.8-flash';
const keyNames=['GEMINI_API_KEY','GEMINI_API_KEY_BACKUP','GEMINI_API_KEY_BACKUP_2','GEMINI_API_KEY_BACKUP_3'];
if(!keyNames.some(name=>Boolean(process.env[name])))throw new Error('At least one Gemini API key secret must be configured.');
if(!Number.isInteger(startIndex)||startIndex<0||!Number.isInteger(batchSize)||batchSize<1||batchSize>10)throw new Error('START_INDEX must be >= 0 and BATCH_SIZE must be 1..10.');
const required=['vocabulary','vocabulary_questions','grammar','grammar_questions','reading','listening','speaking','games','comprehensive_test'];
const supported=new Set(['student_book','workbook','commercial_supplement']);
const manifestFor=book=>manifest.books.find(entry=>entry.source?.endsWith('/'+book.sourceFile)||entry.source===`public/books/${book.sourceFile}`);
const candidates=[],units=[];
const books=(index.books||[]).map(book=>({bookId:book.id,sourceFile:book.sourceFile,grade:book.grade||null,documentType:book.documentType,unitCount:(book.units||[]).length,status:!(book.units||[]).length?'no_unit_index':supported.has(book.documentType)?'tracked_for_unit_generation':'not_a_unit_generation_document'}));
for(const book of index.books||[]){
 const list=[...(book.units||[])].sort((a,b)=>a.number-b.number);
 for(let i=0;i<list.length;i++){
  const unit=list[i],next=list[i+1],entry={bookId:book.id,sourceFile:book.sourceFile,unitNumber:unit.number,title:unit.title||`Unit ${unit.number}`,start:unit.startPdfPage??null,end:null,status:'not_eligible',reason:null};
  if(!supported.has(book.documentType)){entry.status='not_a_unit_generation_document';entry.reason='Document type is not a student book, workbook, or commercial supplement.';}
  else if(!Number.isInteger(unit.startPdfPage)){entry.status='blocked_missing_start_page';entry.reason='No verified 1-based PDF start page is recorded in the source index.';}
  else if(next&&(!Number.isInteger(next.startPdfPage)||next.number!==unit.number+1)){entry.status='blocked_ambiguous_boundary';entry.reason='The next unit has no verified consecutive start page; this unit end cannot be delimited safely.';}
  else{
   const pdf=manifestFor(book),end=next?next.startPdfPage-1:pdf?.pages;
   if(!Number.isInteger(end)||end<unit.startPdfPage){entry.status='blocked_missing_pdf_manifest';entry.reason='The PDF page count or unit end boundary could not be verified.';}
   else{entry.end=end;entry.status='queued';candidates.push({bookId:book.id,unitNumber:unit.number,title:unit.title,start:unit.startPdfPage,end});}
  }
  units.push(entry);
 }
}
candidates.sort((a,b)=>a.bookId.localeCompare(b.bookId)||a.unitNumber-b.unitNumber);
const selected=candidates.slice(startIndex,startIndex+batchSize);
const pages=(await fs.readFile('src/data/extracted/pages.jsonl','utf8')).split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line));
function complete(draft,unit){
 if(!draft||draft.bookId!==unit.bookId||draft.unitNumber!==unit.unitNumber||draft.reviewStatus!=='needs_review'||!Array.isArray(draft.sections))return false;
 const map=new Map(draft.sections.map(section=>[section.type,section]));
 if(!required.every(type=>map.has(type)))return false;
 const items=draft.sections.flatMap(section=>Array.isArray(section.items)?section.items:[]);
 return items.length>=15&&items.filter(item=>item.content?.origin==='source').length>=3&&(map.get('games')?.items?.length||0)>=2&&(map.get('comprehensive_test')?.items?.length||0)>=5&&(map.get('speaking')?.items?.length||0)>=1;
}
const summary={generatedAt:new Date().toISOString(),startIndex,batchSize,model,inventory:{bookCount:books.length,unitCount:units.length,indexedPdfCount:new Set(books.map(b=>b.sourceFile)).size,manifestPdfCount:manifest.books.length,books,units},eligibleTotal:candidates.length,selected:selected.length,results:[]};
const findUnit=unit=>units.find(entry=>entry.bookId===unit.bookId&&entry.unitNumber===unit.unitNumber);
const save=()=>fs.writeFile('artifacts/unit-drafts/progress.json',JSON.stringify(summary,null,2)+'\n');
await fs.mkdir('artifacts/unit-drafts',{recursive:true});
for(const unit of selected){
 const entry=findUnit(unit),file=path.join('artifacts/unit-drafts',`${unit.bookId}-unit-${unit.unitNumber}.json`);
 try{
  let prior=null;try{prior=JSON.parse(await fs.readFile(file,'utf8'));}catch{}
  if(complete(prior,unit)){entry.status='already_generated_needs_review';entry.reason='Complete draft exists; academic review is still required.';summary.results.push({...unit,status:entry.status});await save();continue;}
  if(prior){entry.status='incomplete_draft_needs_regeneration';entry.reason='Earlier draft fails the nine-section quality gate; it is retained and will be regenerated.';}
  const book=index.books.find(b=>b.id===unit.bookId),rows=pages.filter(p=>p.sourceFilename===book?.sourceFile&&p.pdfPage>=unit.start&&p.pdfPage<=unit.end);
  const bad=rows.filter(p=>!p.text||p.text.length<20).map(p=>p.pdfPage);
  if(bad.length){entry.status='blocked_ocr_review';entry.reason=`Source pages require OCR/visual review: ${bad.join(', ')}`;summary.results.push({...unit,status:entry.status,error:entry.reason});await save();continue;}
  console.log(`Generating ${unit.bookId} unit ${unit.unitNumber}: ${unit.title} (PDF ${unit.start}-${unit.end})`);
  await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['scripts/generate-interactive-unit.mjs'],{stdio:'inherit',env:{...process.env,BOOK_ID:unit.bookId,UNIT_NUMBER:String(unit.unitNumber),GEMINI_MODEL:model}});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error(`Generator exited with code ${code}`)));});
  entry.status='generated_needs_review';entry.reason='Draft saved; academic review is required before app release.';summary.results.push({...unit,status:entry.status});
 }catch(error){entry.status='failed_generation';entry.reason=error.message;summary.results.push({...unit,status:entry.status,error:error.message});console.error(`FAILED ${unit.bookId} unit ${unit.unitNumber}: ${error.message}`);}
 await save();
}
for(const unit of candidates){const entry=findUnit(unit);if(entry.status==='queued'&&!selected.some(x=>x.bookId===unit.bookId&&x.unitNumber===unit.unitNumber)){const file=path.join('artifacts/unit-drafts',`${unit.bookId}-unit-${unit.unitNumber}.json`);try{const prior=JSON.parse(await fs.readFile(file,'utf8'));if(complete(prior,unit)){entry.status='already_generated_needs_review';entry.reason='Complete draft exists; academic review is still required.';}else{entry.status='queued_not_in_batch';entry.reason='Eligible, but outside this run’s selected batch.';}}catch{entry.status='queued_not_in_batch';entry.reason='Eligible, but outside this run’s selected batch.';}}}
await save();
const statusCounts=Object.fromEntries([...new Set(units.map(u=>u.status))].map(status=>[status,units.filter(u=>u.status===status).length]));
console.log(JSON.stringify({books:books.length,indexedUnits:units.length,eligibleTotal:candidates.length,selected:summary.selected,statusCounts,progress:'artifacts/unit-drafts/progress.json'},null,2));
if(summary.results.some(result=>result.status==='failed_generation'))process.exitCode=1;
