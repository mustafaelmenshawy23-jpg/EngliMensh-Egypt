# Primary Connect / Connect Plus 2026–2027 import audit

## Source package
User-supplied archive: `englimensh_primary_full_75_units_2026_2027.zip`

The archive contains:
- `index.html`
- `js/data.js`
- `js/app.js`
- `css/style.css`

The data object parses as valid JSON after removing its JavaScript declaration. It contains two tracks and 12 grade/path combinations.

## Inventory
- Connect: 39 units across Primary 1–6 (9 + 6 + 6 + 6 + 6 + 6).
- Connect Plus: 36 units across Primary 1–6 (6 per grade).
- Total: 75 units.
- Vocabulary entries: 750 (10 per unit).
- Vocabulary quiz items: 750 (10 per unit).
- Dialogue lines: 150 (2 per unit).
- Phonics records: 75.
- Reading passages: 75.
- Grammar records: 75.
- Grammar quiz items: 75 (1 per unit).
- Speaking quiz records: 75.
- Scramble-word activities: 150.
- Exam questions: 150 (2 per unit).

## Import and quality requirements
1. Preserve the user's source material and the Connect / Connect Plus separation.
2. Sort unit numbers numerically. In the supplied data, Primary 5 and Primary 6 list Unit 2 before Unit 1.
3. Do not treat generated practice questions as printed textbook questions. Label new questions as supplementary practice.
4. Keep the imported package identified as user-supplied HTML/JS content. The package does not provide per-item PDF page citations, so do not fabricate source page references or mark those fields as source-verified.
5. Validate all question option arrays and answer keys before publishing.
6. Add varied question formats and difficulty levels across vocabulary, grammar, reading, listening, phonics, and unit review.
7. Preserve all existing application flows, progress storage, and other stages.

## Confirmed quality issue requiring correction
Every one of the 750 vocabulary quiz items and all 150 supplied exam questions stores its correct answer at option index 0. The current option ordering therefore exposes a predictable answer-position pattern. The app must randomize option order per question while preserving the correct answer, and new question banks must use varied correct-answer positions.

## Repository integration status
This audit is prepared on branch `feature/primary-connect-connect-plus-2026-2027`. It is not an assertion that the curriculum has already been integrated into the student application or academically verified.
