const COMPLETED_STATUSES = new Set([
  "generated_needs_review",
  "complete_draft_needs_review",
  "approved_preserved",
  "blocked_source_review"
]);

export function isTransientGenerationError(error) {
  const message = String(error?.message || error || "");
  return /Gemini API\s+(?:429|500|502|503|504)\b|HTTP\s+(?:429|500|502|503|504)\b|rate limit|temporarily unavailable|timeout|ECONNRESET|ETIMEDOUT/i.test(message);
}

export function summarizeCandidateProgress(candidates, attempts = {}, now = Date.now()) {
  let pendingCandidates = 0;
  let waitingForRetry = 0;
  for (const candidate of candidates || []) {
    const unitId = candidate.unitId || (candidate.bookId + "-unit-" + candidate.unitNumber);
    const attempt = attempts[unitId];
    if (COMPLETED_STATUSES.has(attempt?.status)) continue;
    const retryAt = attempt?.retryAfter ? Date.parse(attempt.retryAfter) : 0;
    if (Number.isFinite(retryAt) && retryAt > now) {
      waitingForRetry++;
      continue;
    }
    pendingCandidates++;
  }
  return { pendingCandidates, waitingForRetry };
}

export function hasFatalBatchFailures(results = []) {
  return (results || []).some((result) =>
    result.status === "failed_validation" ||
    (result.status === "failed" && !isTransientGenerationError(result.error))
  );
}

export function shouldAutoContinueBatch(results = [], pendingCandidates = 0, chainDepth = 0, maxChainDepth = 3) {
  const hasValidatedDraft = (results || []).some((result) =>
    result.status === "generated_needs_review" ||
    result.status === "complete_draft_needs_review"
  );
  return Number(pendingCandidates) > 0 &&
    Number.isInteger(Number(chainDepth)) &&
    Number(chainDepth) < Number(maxChainDepth) &&
    hasValidatedDraft;
}
