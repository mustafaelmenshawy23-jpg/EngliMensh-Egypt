const ORIGIN_VALUES = new Set(["source", "supplementary"]);

export function normalizeProvenanceText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function questionFields(content) {
  return {
    question: content.question,
    options: content.options,
    correctAnswer: content.correctAnswer,
    reason: content.reason
  };
}

function fieldsFor(sectionType, content) {
  if (sectionType === "vocabulary") {
    return { word: content.word, arabicMeaning: content.arabicMeaning, example: content.example };
  }
  if (sectionType === "grammar") {
    return { rule: content.rule, explanation: content.explanation, example: content.example };
  }
  if (sectionType === "reading") {
    return content.passage ? { passage: content.passage } : questionFields(content);
  }
  if (sectionType === "listening") {
    return content.script ? { script: content.script } : questionFields(content);
  }
  if (sectionType === "speaking") {
    if (Array.isArray(content.dialogue)) return { dialogue: content.dialogue.map((turn) => turn?.text || "") };
    if (content.instruction) return { instruction: content.instruction };
  }
  if (sectionType === "games") {
    return {
      gameName: content.gameName,
      description: content.description,
      question: content.question,
      options: content.options,
      correctAnswer: content.correctAnswer,
      reason: content.reason
    };
  }
  if (["vocabulary_questions", "grammar_questions", "comprehensive_test"].includes(sectionType) || content.question) {
    return questionFields(content);
  }
  return {};
}

function isEveryFieldSource(value) {
  if (Array.isArray(value)) return value.length > 0 && value.every((entry) => entry === "source");
  return value === "source";
}

function hasSourceField(value) {
  if (Array.isArray(value)) return value.includes("source");
  return value === "source";
}

function primaryCitationValue(sectionType, content) {
  if (sectionType === "vocabulary") return content.word;
  if (sectionType === "grammar") return content.rule;
  if (sectionType === "reading") return content.passage || content.question;
  if (sectionType === "listening") return content.script || content.question;
  if (sectionType === "speaking") return content.dialogue?.[0]?.text || content.instruction;
  if (sectionType === "games") return null;
  return content.question;
}

function fieldOrigin(value, sourceText, forceSupplementary = false) {
  if (Array.isArray(value)) {
    return value.map((entry) => {
      const normalized = normalizeProvenanceText(entry);
      return !forceSupplementary && normalized.length >= 2 && sourceText.includes(normalized)
        ? "source"
        : "supplementary";
    });
  }
  const normalized = normalizeProvenanceText(value);
  return !forceSupplementary && normalized.length >= 2 && sourceText.includes(normalized)
    ? "source"
    : "supplementary";
}

export function auditDraftProvenance(draft, sourcePageRows = []) {
  const rows = Array.isArray(sourcePageRows) ? sourcePageRows : [];
  const sourceText = normalizeProvenanceText(rows.map((row) => row?.text || "").join(" "));
  const pageText = new Map(rows.map((row) => [Number(row?.pdfPage), normalizeProvenanceText(row?.text || "")]));
  const items = [];

  for (const section of draft?.sections || []) {
    for (const item of section?.items || []) {
      const content = item?.content || {};
      const declaredOrigin = content.origin;
      if (!ORIGIN_VALUES.has(declaredOrigin)) continue;

      const fields = fieldsFor(section.type, content);
      const forceSupplementary = section.type === "games";
      const fieldOrigins = {};
      for (const [field, value] of Object.entries(fields)) {
        fieldOrigins[field] = fieldOrigin(value, sourceText, forceSupplementary);
      }

      const fieldNames = Object.keys(fieldOrigins);
      const verifiedSource = !forceSupplementary &&
        fieldNames.length > 0 &&
        fieldNames.every((field) => isEveryFieldSource(fieldOrigins[field]));
      const unmatchedFields = fieldNames.filter((field) => !isEveryFieldSource(fieldOrigins[field]));
      const primaryValue = primaryCitationValue(section.type, content);
      const normalizedPrimary = normalizeProvenanceText(primaryValue);
      const citedText = pageText.get(Number(content.sourcePdfPage)) || "";
      const citationPrefix = normalizedPrimary.slice(0, Math.min(80, normalizedPrimary.length));
      const citationMatch = Boolean(citationPrefix && citedText.includes(citationPrefix));
      const citationWarning = declaredOrigin === "source" && !citationMatch;

      items.push({
        sectionType: section.type,
        itemId: item?.itemId || "",
        declaredOrigin,
        finalOrigin: declaredOrigin === "source" && !verifiedSource ? "supplementary" : declaredOrigin,
        fieldOrigins,
        verifiedSource,
        unmatchedFields,
        citationWarning,
        sourcePdfPage: Number.isInteger(content.sourcePdfPage) ? content.sourcePdfPage : null,
        item
      });
    }
  }

  const sourceClaims = items.filter((entry) => entry.declaredOrigin === "source");
  return {
    summary: {
      itemsAudited: items.length,
      sourceClaims: sourceClaims.length,
      verifiedSourceClaims: sourceClaims.filter((entry) => entry.verifiedSource).length,
      unverifiableSourceClaims: sourceClaims.filter((entry) => !entry.verifiedSource).length,
      citationWarnings: sourceClaims.filter((entry) => entry.citationWarning).length,
      itemsWithSourceSubfields: items.filter((entry) => Object.values(entry.fieldOrigins).some(hasSourceField)).length
    },
    items
  };
}

export function reclassifyUnverifiableSourceClaims(draft, sourcePageRows = []) {
  const audit = auditDraftProvenance(draft, sourcePageRows);
  let reclassifiedCount = 0;

  for (const entry of audit.items) {
    const item = entry.item;
    if (!item?.content) continue;
    item.content.fieldOrigins = entry.fieldOrigins;

    if (entry.declaredOrigin === "source" && !entry.verifiedSource) {
      item.content.origin = "supplementary";
      item.notes = "Conservatively labelled supplementary because one or more fields could not be verified verbatim in the extracted source. Teacher review required.";
      entry.finalOrigin = "supplementary";
      reclassifiedCount += 1;
    } else if (entry.declaredOrigin === "supplementary" && !item.notes) {
      item.notes = "AI-generated supplementary content; source-matched subfields are identified in fieldOrigins. Teacher review required.";
    }
  }

  return { ...audit, reclassifiedCount };
}
