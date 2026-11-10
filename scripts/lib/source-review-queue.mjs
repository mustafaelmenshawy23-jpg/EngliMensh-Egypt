const REVIEW_STATUSES = new Set([
  "ocr_empty_needs_manual_review",
  "ocr_unreliable_needs_visual_review"
]);

function statusReason(status) {
  if (status === "ocr_empty_needs_manual_review") return "No usable OCR text after the retry pass";
  if (status === "ocr_unreliable_needs_visual_review") return "OCR text was extracted but flagged as unreliable";
  if (status.startsWith("ocr_error")) return "OCR failed: " + status.slice("ocr_error:".length);
  if (status === "source_pdf_missing") return "Source PDF could not be opened or hydrated";
  if (status === "page_out_of_range") return "Page reference is outside the source PDF";
  return "Manual source review required";
}

export function buildSourceReviewQueue(records = [], manifest = {}) {
  const items = (records || [])
    .filter((record) => {
      const status = String(record?.extractionStatus || "");
      return REVIEW_STATUSES.has(status) || status.startsWith("ocr_error") ||
        status === "source_pdf_missing" || status === "page_out_of_range";
    })
    .map((record) => ({
      source: String(record.source || ""),
      sourceFilename: String(record.sourceFilename || ""),
      pdfPage: Number(record.pdfPage),
      printedPage: Number.isInteger(record.printedPage) ? record.printedPage : null,
      status: String(record.extractionStatus || ""),
      reason: statusReason(String(record.extractionStatus || "")),
      textLength: String(record.text || "").length,
      retry: record.ocrRetry || null
    }))
    .sort((a, b) => a.source.localeCompare(b.source) || a.pdfPage - b.pdfPage);

  const byStatus = {};
  const bySource = {};
  for (const item of items) {
    byStatus[item.status] = (byStatus[item.status] || 0) + 1;
    if (!bySource[item.source]) {
      bySource[item.source] = {
        pages: 0,
        emptyPages: 0,
        unreliablePages: 0,
        errorPages: 0,
        pdfPages: []
      };
    }
    const group = bySource[item.source];
    group.pages++;
    group.pdfPages.push(item.pdfPage);
    if (item.status === "ocr_empty_needs_manual_review") group.emptyPages++;
    else if (item.status === "ocr_unreliable_needs_visual_review") group.unreliablePages++;
    else group.errorPages++;
  }

  const books = Array.isArray(manifest.books) ? manifest.books : [];
  const summary = {
    indexedBooks: books.length,
    processedBooks: books.filter((book) => book.status === "processed").length,
    blockedBooks: books.filter((book) => book.status !== "processed").map((book) => ({
      source: book.source,
      status: book.status
    })),
    pageRecords: (records || []).length,
    pagesNeedingVisualReview: items.length,
    emptyPages: items.filter((item) => item.status === "ocr_empty_needs_manual_review").length,
    unreliablePages: items.filter((item) => item.status === "ocr_unreliable_needs_visual_review").length,
    errorPages: items.filter((item) => item.status.startsWith("ocr_error") || item.status === "source_pdf_missing" || item.status === "page_out_of_range").length
  };

  return {
    generatedAt: new Date().toISOString(),
    policy: "All listed pages remain needs_review. This queue is for visual verification, not automatic approval.",
    summary,
    byStatus,
    bySource,
    items
  };
}

export function renderSourceReviewQueueMarkdown(queue) {
  const summary = queue?.summary || {};
  const rows = Object.entries(queue?.bySource || {}).sort(([a], [b]) => a.localeCompare(b));
  const lines = [
    "# Source PDF visual-review queue",
    "",
    "Generated: " + String(queue?.generatedAt || "unknown"),
    "",
    "- Books indexed: " + Number(summary.indexedBooks || 0),
    "- Books extracted: " + Number(summary.processedBooks || 0),
    "- Books blocked: " + (summary.blockedBooks || []).length,
    "- Extracted page records: " + Number(summary.pageRecords || 0),
    "- Pages requiring visual review: " + Number(summary.pagesNeedingVisualReview || 0),
    "- Empty after OCR retry: " + Number(summary.emptyPages || 0),
    "- OCR text flagged unreliable: " + Number(summary.unreliablePages || 0),
    "- OCR/source errors: " + Number(summary.errorPages || 0),
    "",
    "All entries remain unapproved and must be checked against the original PDF.",
    "",
    "## Review totals by PDF",
    "",
    "| PDF source | Pages | Empty | Unreliable | Errors |",
    "|---|---:|---:|---:|---:|"
  ];
  for (const [source, group] of rows) {
    lines.push("| " + source.replace(/\|/g, "\\|") + " | " + group.pages + " | " + group.emptyPages + " | " + group.unreliablePages + " | " + group.errorPages + " |");
  }
  lines.push("", "## Individual PDF page references", "", "| PDF source | PDF page | Status | Text chars | Reason |", "|---|---:|---|---:|---|");
  for (const item of queue?.items || []) {
    lines.push("| " + item.source.replace(/\|/g, "\\|") + " | " + item.pdfPage + " | " + item.status + " | " + item.textLength + " | " + item.reason.replace(/\|/g, "\\|") + " |");
  }
  lines.push("");
  return lines.join("\n");
}
