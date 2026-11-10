import assert from "node:assert/strict";
import fs from "node:fs";
import {
  assessExtractionCoverage,
  parsePagesJsonl,
  formatGithubOutput
} from "./lib/extraction-cache-health.mjs";

const rows = [
  { source: "public/books/sample.pdf", pdfPage: 1, reviewStatus: "needs_review" },
  { source: "public/books/sample.pdf", pdfPage: 2, reviewStatus: "needs_review" }
];
const parsed = parsePagesJsonl(rows.map((row) => JSON.stringify(row)).join("\r\n") + "\r\n");
assert.equal(parsed.pageParseErrors, 0);
assert.deepEqual(parsed.pageRows.map((row) => row.pdfPage), [1, 2]);

const malformed = parsePagesJsonl(
  JSON.stringify(rows[0]) + "\nnot-json\n" + JSON.stringify(rows[1])
);
assert.equal(malformed.pageParseErrors, 1);
assert.deepEqual(malformed.invalidLines, [2]);
assert.equal(malformed.pageRows.length, 2);

const complete = assessExtractionCoverage({
  expectedSources: ["public/books/sample.pdf"],
  manifest: {
    books: [{ source: "public/books/sample.pdf", status: "processed", pages: 2 }]
  },
  pageRows: parsed.pageRows,
  pageParseErrors: parsed.pageParseErrors
});
assert.equal(complete.complete, true);
assert.equal(complete.needsFullExtraction, false);

const missingPage = assessExtractionCoverage({
  expectedSources: ["public/books/sample.pdf"],
  manifest: {
    books: [{ source: "public/books/sample.pdf", status: "processed", pages: 3 }]
  },
  pageRows: parsed.pageRows,
  pageParseErrors: 0
});
assert.equal(missingPage.complete, false);
assert.equal(missingPage.needsFullExtraction, true);
assert.deepEqual(missingPage.pageCoverageIssues[0].missingPages, [3]);

assert.equal(
  formatGithubOutput("needs_full_extraction", true),
  "needs_full_extraction=true\n"
);
assert.throws(() => formatGithubOutput("invalid name", true), /Invalid GitHub Actions output name/);

console.log("Extraction-cache JSONL parsing, coverage checks, and GitHub output tests passed.");

const checkScript = fs.readFileSync(new URL("./check-extraction-cache.mjs", import.meta.url), "utf8");
assert.match(checkScript, /import \\{[^}]*parsePagesJsonl[^}]*formatGithubOutput[^}]*\\} from ["']\\.\\/lib\\/extraction-cache-health\\.mjs["']/);
assert.ok(checkScript.includes("parsePagesJsonl(text)"), "check-cache script must use the shared JSONL parser");
assert.ok(checkScript.includes("formatGithubOutput("), "check-cache script must write a real newline to GITHUB_OUTPUT");
