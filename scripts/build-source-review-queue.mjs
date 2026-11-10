import fs from "node:fs/promises";
import path from "node:path";
import { buildSourceReviewQueue, renderSourceReviewQueueMarkdown } from "./lib/source-review-queue.mjs";

const dataDir = path.join(process.cwd(), "src", "data", "extracted");
const pagesText = await fs.readFile(path.join(dataDir, "pages.jsonl"), "utf8");
const records = pagesText.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
const manifest = JSON.parse(await fs.readFile(path.join(dataDir, "manifest.json"), "utf8"));
const queue = buildSourceReviewQueue(records, manifest);
await fs.mkdir("artifacts", { recursive: true });
await fs.writeFile("artifacts/source-review-queue.json", JSON.stringify(queue, null, 2) + "\n", "utf8");
await fs.writeFile("artifacts/source-review-queue.md", renderSourceReviewQueueMarkdown(queue), "utf8");
console.log(JSON.stringify(queue.summary, null, 2));
