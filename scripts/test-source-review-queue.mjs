import assert from "node:assert/strict";
import { buildSourceReviewQueue, renderSourceReviewQueueMarkdown } from "./lib/source-review-queue.mjs";

const queue = buildSourceReviewQueue([
  { source: "public/books/a.pdf", sourceFilename: "a.pdf", pdfPage: 4, extractionStatus: "ocr_empty_needs_manual_review", text: "" },
  { source: "public/books/a.pdf", sourceFilename: "a.pdf", pdfPage: 8, extractionStatus: "ocr_unreliable_needs_visual_review", text: "unclear OCR text" },
  { source: "public/books/b.pdf", sourceFilename: "b.pdf", pdfPage: 2, extractionStatus: "ocr_error:page_timeout", text: "" },
  { source: "public/books/b.pdf", sourceFilename: "b.pdf", pdfPage: 3, extractionStatus: "ocr_extracted_needs_review", text: "clear text" }
], {
  books: [
    { source: "public/books/a.pdf", status: "processed" },
    { source: "public/books/b.pdf", status: "processed" },
    { source: "public/books/c.pdf", status: "lfs_pointer_not_downloaded" }
  ]
});
assert.equal(queue.summary.indexedBooks, 3);
assert.equal(queue.summary.processedBooks, 2);
assert.equal(queue.summary.blockedBooks.length, 1);
assert.equal(queue.summary.pagesNeedingVisualReview, 3);
assert.equal(queue.summary.emptyPages, 1);
assert.equal(queue.summary.unreliablePages, 1);
assert.equal(queue.summary.errorPages, 1);
assert.deepEqual(queue.items.map((item) => item.pdfPage), [4, 8, 2].sort((a,b)=>a-b).length ? [4,8,2].sort((a,b)=>a-b) : []);
assert.match(renderSourceReviewQueueMarkdown(queue), /Individual PDF page references/);
assert.match(renderSourceReviewQueueMarkdown(queue), /lfs_pointer_not_downloaded|Books blocked/);

console.log("Source visual-review queue tests passed.");
