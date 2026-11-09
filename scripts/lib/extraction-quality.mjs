function normalizeShortText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, '<url>')
    .replace(/[^a-z0-9\u0600-\u06ff<>]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detects pages whose short extracted text is repeated across a large part of
 * the same PDF. This is a common signature of a watermark-only text layer on
 * otherwise scanned pages; those pages must be sent to OCR instead of being
 * treated as successfully extracted curriculum text.
 */
export function findRepeatedShortTextPages(pageRecords, options = {}) {
  if (!Array.isArray(pageRecords) || pageRecords.length === 0) return new Set();

  const maxShortTextLength = Number.isInteger(options.maxShortTextLength)
    ? options.maxShortTextLength : 250;
  const minRepeatCount = Number.isInteger(options.minRepeatCount)
    ? options.minRepeatCount : 8;
  const repeatRatio = Number.isFinite(options.repeatRatio)
    ? options.repeatRatio : 0.25;
  const threshold = Math.max(minRepeatCount, Math.ceil(pageRecords.length * repeatRatio));

  const signatures = new Map();
  for (const page of pageRecords) {
    const text = String(page?.text || '').trim();
    if (text.length < 20 || text.length > maxShortTextLength) continue;
    const signature = normalizeShortText(text);
    if (signature.length < 8) continue;
    signatures.set(signature, (signatures.get(signature) || 0) + 1);
  }

  const repeated = new Set();
  for (const page of pageRecords) {
    const text = String(page?.text || '').trim();
    if (text.length < 20 || text.length > maxShortTextLength) continue;
    const signature = normalizeShortText(text);
    if ((signatures.get(signature) || 0) >= threshold) {
      repeated.add(page.pdfPage);
    }
  }
  return repeated;
}
