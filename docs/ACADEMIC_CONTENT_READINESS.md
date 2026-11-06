# Academic Content Readiness — Draft Audit

**Audit scope:** current `main` branch; source-book index and lesson/module draft datasets.  
**Source-book boundary:** 33 indexed PDF books and 118 indexed units. This audit does not add books, run OCR, or approve extracted content.

## Current coverage

| Measure | Current result |
|---|---:|
| Indexed books | 33 |
| Indexed units | 118 |
| Required modules per unit | 8 |
| Required module slots | 944 |
| Candidate lesson records | 26 |
| Candidate records academically approved | 0 |
| Candidate records awaiting review | 26 |
| Candidate items across all lesson sections | 145 |

The 944 module slots are structural placeholders, not populated lessons. All eight module slots are currently empty/not populated in the unit-module scaffold.

## Candidate item inventory

These are transcribed/recovered candidates only. Their presence in the repository does **not** mean that the content is approved for students or suitable for official answer keys.

| Section type | Candidate items |
|---|---:|
| Vocabulary | 92 |
| Vocabulary questions | 0 |
| Grammar | 3 |
| Grammar questions | 1 |
| Reading | 2 |
| Listening | 2 |
| Games | 0 |
| Speaking | 1 |
| Phonics | 14 |
| Exercises | 30 |
| **Total** | **145** |

The section inventory above includes supplementary section types (speaking, phonics, exercises) found in candidate records. The learner-facing unit workspace is intentionally limited to the eight required core modules.

## Academic release rules

1. Keep every current candidate at `needs_review` until a qualified academic review checks the original PDF page and the accuracy of the transcription.
2. Preserve the exact source filename and 1-based physical PDF page for every imported item.
3. Do not infer listening answer mappings when the audio or printed key is absent.
4. Do not transform candidate exercise prompts into official answer keys.
5. Keep teacher-created or AI-generated explanations, examples, distractors, and practice questions separately marked as `generated`; never present them as printed book content.
6. Keep the Comprehensive Test module unavailable as an official ministry-aligned test until a verified grade/stage assessment blueprint is attached. A module placeholder is not evidence of ministry alignment.
7. Do not treat vocabulary or grammar metadata in the curriculum index as a complete lesson or as source-page-verified content.

## Recommended first academic pilot

Use **Primary 3 — Unit 4: How We Feel** as the first review candidate because the current draft has a compact source-linked vocabulary/dialogue record:

- Source: `English_language_prim3_t1 (1).pdf`
- Physical PDF page: 69
- Candidate vocabulary: `shy`, `tired`, `bored`, `scared`
- Candidate pair dialogue: “How do you feel?” / “I feel so happy!”
- Candidate follow-up prompt: “How do you feel when you play with your friends?”

The source review notes associate physical PDF page 69 with the printed Unit 4 heading. The lesson transcription itself is still `needs_review`; this audit does not approve it. After academic review, this pilot can be expanded only with additional content supported by the source book. Generated practice can be added as a separate, clearly labeled layer.

## Not yet established

- No complete unit currently has all eight modules populated with approved material.
- No official, verified Comprehensive Test blueprint is registered in the current draft.
- The current 145 candidate items are not an approved question bank.
- The presence of 118 unit records does not mean 118 units are ready for teaching or assessment.

## Next implementation gate

Before broad content population, review and approve one source-linked pilot unit, then run the lesson-content and unit-module validators. Only after that gate should the same evidence and review process be applied to the remaining indexed units.
