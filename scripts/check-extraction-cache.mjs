import fs from "node:fs/promises";
import path from "node:path";
import { assessExtractionCoverage, parsePagesJsonl, formatGithubOutput } from "./lib/extraction-cache-health.mjs";

const root = process.cwd();
const booksRoot = path.join(root, "public", "books");
const extractedRoot = path.join(root, "src", "data", "extracted");

async function walkPdfs(directory) {
  let entries;
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const files = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkPdfs(full));
    else if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".pdf") files.push(full);
  }
  return files.sort();
}

async function readJson(file) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return null;
  }
}

const pdfFiles = await walkPdfs(booksRoot);
const expectedSources = pdfFiles.map((file) => path.relative(root, file).split(path.sep).join("/"));
const manifest = await readJson(path.join(extractedRoot, "manifest.json"));
let pageRows = [];
let pageParseErrors = 0;
try {
  const text = await fs.readFile(path.join(extractedRoot, "pages.jsonl"), "utf8");
  const parsed = parsePagesJsonl(text);
  pageRows = parsed.pageRows;
  pageParseErrors = parsed.pageParseErrors;
  for (const lineNumber of parsed.invalidLines) {
    console.error("Invalid pages.jsonl JSON at line " + lineNumber);
  }
} catch {
  pageParseErrors += 1;
}

const report = assessExtractionCoverage({ expectedSources, manifest, pageRows, pageParseErrors });
const outputLine = formatGithubOutput("needs_full_extraction", report.needsFullExtraction);
if (process.env.GITHUB_OUTPUT) await fs.appendFile(process.env.GITHUB_OUTPUT, outputLine, "utf8");

console.log(JSON.stringify({
  complete: report.complete,
  needsFullExtraction: report.needsFullExtraction,
  expectedBooks: report.expectedBooks,
  manifestBooks: report.manifestBooks,
  processedBooks: report.processedBooks,
  pageRecords: report.pageRecords,
  pageParseErrors: report.pageParseErrors,
  missingSources: report.missingSources,
  unexpectedSources: report.unexpectedSources,
  duplicateManifestSources: report.duplicateManifestSources,
  unprocessedBooks: report.unprocessedBooks,
  pageCoverageIssues: report.pageCoverageIssues.slice(0, 20),
  unexpectedPageSources: report.unexpectedPageSources
}, null, 2));

if (process.argv.includes("--require-complete") && !report.complete) {
  console.error("Source extraction is incomplete. The cache must not be used for curriculum generation.");
  process.exitCode = 1;
}
