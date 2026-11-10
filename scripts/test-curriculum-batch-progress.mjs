import assert from "node:assert/strict";
import {
  isTransientGenerationError,
  summarizeCandidateProgress,
  hasFatalBatchFailures
} from "./lib/curriculum-batch-progress.mjs";

const now = Date.parse("2026-11-10T08:00:00.000Z");
assert.equal(isTransientGenerationError("Gemini API 503: UNAVAILABLE"), true);
assert.equal(isTransientGenerationError("The operation was aborted due to timeout"), true);
assert.equal(isTransientGenerationError("Invalid API key"), false);

const candidates = [
  { unitId: "unit-a" },
  { unitId: "unit-b" },
  { unitId: "unit-c" },
  { unitId: "unit-d" }
];
const attempts = {
  "unit-a": { status: "generated_needs_review" },
  "unit-b": { status: "failed", retryAfter: new Date(now + 5 * 60 * 1000).toISOString() },
  "unit-c": { status: "blocked_source_review" }
};
assert.deepEqual(
  summarizeCandidateProgress(candidates, attempts, now),
  { pendingCandidates: 1, waitingForRetry: 1 }
);

assert.equal(hasFatalBatchFailures([{ status: "failed", error: "Gemini API 503: UNAVAILABLE" }]), false);
assert.equal(hasFatalBatchFailures([{ status: "failed", error: "Invalid API key" }]), true);
assert.equal(hasFatalBatchFailures([{ status: "failed_validation", error: "Wrong answer key" }]), true);
assert.equal(hasFatalBatchFailures([{ status: "generated_needs_review" }]), false);

console.log("Curriculum batch retry and pending-candidate tests passed.");
