import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const BOOKS_DIR = path.join(ROOT, 'public', 'books');
const OUTPUT_DIR = path.join(ROOT, 'src', 'data', 'extracted');

async function walk(dir) {
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); }
  catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) files.push(full);
  }
  return files.sort((a, b) => a.localeCompare(b));
}

function isLfsPointer(buffer) {
  return buffer.subarray(0, 120).toString('utf8').startsWith('version https://git-lfs.github.com/spec/v1');
}

async function main() {
  const pdfs = await walk(BOOKS_DIR);
  if (!pdfs.length) {
    console.error('No PDF files found in public/books/.');
    process.exitCode = 1;
    return;
  }

  let pdfjs;
  try {
    pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  } catch {
    console.error('PDF.js is not installed. Run: npm install');
    process.exitCode = 1;
    return;
  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const pagesFile = path.join(OUTPUT_DIR, 'pages.jsonl');
  const manifestFile = path.join(OUTPUT_DIR, 'manifest.json');
  const pageLines = [];
  const books = [];

  for (const file of pdfs) {
    const filename = path.basename(file);
    const relativePath = path.relative(ROOT, file).split(path.sep).join('/');
    const buffer = await fs.readFile(file);

    if (isLfsPointer(buffer)) {
      books.push({ source: relativePath, status: 'lfs_pointer_not_downloaded', pages: 0, extractedPages: 0 });
      console.error(`SKIP LFS pointer (download the real file first): ${filename}`);
      continue;
    }

    if (buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
      books.push({ source: relativePath, status: 'not_a_valid_pdf', pages: 0, extractedPages: 0 });
      console.error(`SKIP invalid PDF: ${filename}`);
      continue;
    }

    try {
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer), useSystemFonts: true }).promise;
      let extractedPages = 0;
      let emptyPages = 0;

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        const text = content.items
          .filter((item) => typeof item.str === 'string')
          .map((item) => item.str)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (text.length >= 20) extractedPages += 1;
        else emptyPages += 1;

        pageLines.push(JSON.stringify({
          source: relativePath,
          sourceFilename: filename,
          pdfPage: pageNumber,
          printedPage: null,
          text,
          extractionStatus: text.length >= 20 ? 'extracted_needs_review' : 'empty_or_scanned_needs_ocr',
          reviewStatus: 'needs_review'
        }));
      }

      books.push({
        source: relativePath,
        status: 'processed',
        pages: pdf.numPages,
        extractedPages,
        emptyOrScannedPages: emptyPages
      });
      console.log(`OK ${filename}: ${pdf.numPages} pages, ${extractedPages} with extractable text, ${emptyPages} need OCR/review`);
      await pdf.destroy();
    } catch (error) {
      books.push({ source: relativePath, status: 'pdf_read_error', pages: 0, extractedPages: 0, error: error.message });
      console.error(`ERROR ${filename}: ${error.message}`);
    }
  }

  await fs.writeFile(pagesFile, pageLines.length ? pageLines.join('\n') + '\n' : '', 'utf8');
  const manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    sourceDirectory: 'public/books/',
    sourceOfTruth: 'original_uploaded_pdf_files',
    pageReferencePolicy: 'pdfPage is the 1-based PDF page index; printedPage remains null unless separately verified',
    contentPolicy: 'No inferred or generated curriculum content. Every page remains needs_review.',
    books,
    totals: {
      books: books.length,
      processed: books.filter((book) => book.status === 'processed').length,
      pages: books.reduce((sum, book) => sum + book.pages, 0),
      extractedPages: books.reduce((sum, book) => sum + book.extractedPages, 0),
      pagesNeedingOcrOrReview: books.reduce((sum, book) => sum + (book.emptyOrScannedPages || 0), 0)
    }
  };
  await fs.writeFile(manifestFile, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log('\nExtraction finished. Review manifest.json before using any extracted content.');
  console.log(JSON.stringify(manifest.totals, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
