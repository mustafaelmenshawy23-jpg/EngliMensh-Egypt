const normalize = (value) => String(value || "").replace(/\\\\/g, "/");

export function assessExtractionCoverage({
  expectedSources = [],
  manifest = null,
  pageRows = [],
  pageParseErrors = 0
} = {}) {
  const expected = [...new Set(expectedSources.map(normalize))].sort();
  const expectedSet = new Set(expected);
  const books = Array.isArray(manifest?.books) ? manifest.books : [];
  const manifestSources = books.map((book) => normalize(book?.source));
  const sourceCounts = new Map();
  for (const source of manifestSources) sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);

  const missingSources = expected.filter((source) => !sourceCounts.has(source));
  const unexpectedSources = [...new Set(manifestSources.filter((source) => source && !expectedSet.has(source)))];
  const duplicateManifestSources = [...sourceCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([source]) => source);
  const unprocessedBooks = books
    .filter((book) => book?.status !== "processed")
    .map((book) => ({ source: normalize(book?.source), status: book?.status || "missing_status" }));

  const pagesBySource = new Map();
  const unexpectedPageSources = new Set();
  for (const row of pageRows) {
    const source = normalize(row?.source || (row?.sourceFilename ? "public/books/" + row.sourceFilename : ""));
    if (!source) continue;
    if (!expectedSet.has(source)) unexpectedPageSources.add(source);
    if (!pagesBySource.has(source)) pagesBySource.set(source, new Map());
    const pageNumber = Number(row?.pdfPage);
    if (!Number.isInteger(pageNumber) || pageNumber < 1) continue;
    const pageMap = pagesBySource.get(source);
    pageMap.set(pageNumber, (pageMap.get(pageNumber) || 0) + 1);
  }

  const pageCoverageIssues = [];
  for (const book of books) {
    const source = normalize(book?.source);
    if (!expectedSet.has(source) || book?.status !== "processed") continue;
    const totalPages = Number(book?.pages);
    if (!Number.isInteger(totalPages) || totalPages < 1) {
      pageCoverageIssues.push({ source, reason: "invalid_page_count", pages: book?.pages ?? null });
      continue;
    }
    const pageMap = pagesBySource.get(source) || new Map();
    const missingPages = [];
    const duplicatePages = [];
    for (let page = 1; page <= totalPages; page += 1) {
      const count = pageMap.get(page) || 0;
      if (count === 0) missingPages.push(page);
      else if (count > 1) duplicatePages.push(page);
    }
    if (missingPages.length || duplicatePages.length) {
      pageCoverageIssues.push({
        source,
        expectedPages: totalPages,
        actualUniquePages: pageMap.size,
        missingPages,
        duplicatePages
      });
    }
  }

  const complete = expected.length > 0
    && books.length === expected.length
    && missingSources.length === 0
    && unexpectedSources.length === 0
    && duplicateManifestSources.length === 0
    && unprocessedBooks.length === 0
    && pageCoverageIssues.length === 0
    && unexpectedPageSources.size === 0
    && Number(pageParseErrors) === 0;

  return {
    complete,
    needsFullExtraction: !complete,
    expectedBooks: expected.length,
    manifestBooks: books.length,
    processedBooks: books.filter((book) => book?.status === "processed").length,
    pageRecords: pageRows.length,
    pageParseErrors: Number(pageParseErrors) || 0,
    missingSources,
    unexpectedSources,
    duplicateManifestSources,
    unprocessedBooks,
    pageCoverageIssues,
    unexpectedPageSources: [...unexpectedPageSources]
  };
}
