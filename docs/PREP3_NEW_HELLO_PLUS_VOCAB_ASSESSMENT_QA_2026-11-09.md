# Prep 3 New Hello Plus — vocabulary and assessment content integrity
Date: 9 November 2026
Branch: `content-import/prep-new-hello-hello-plus`

## Scope
Static review of all six `Prep_3_New_Hello_Plus_Unit_1.html` through `Unit_6.html` files. This is not an official-source approval.

## Confirmed per-unit defects
Each of the six units declares 22 vocabulary entries. However:
- Unit 1: 21/22 Arabic fields are the same placeholder `مفردة دراسية`; 21/22 definitions are the generic phrase “An essential curriculum term relating to [unit theme]”; all 22 examples use the same generic template.
- Units 2–6: all 22/22 Arabic fields are `مفردة دراسية`; all 22/22 definitions are generic theme placeholders; all 22/22 examples use the same generic template.
- The vocabulary quiz contains 30 entries per unit, but has only 1–2 distinct question stems. The stem asks generically which term matches a visual illustration; its choices include placeholder distractors such as “incorrect choice”, “false term”, and “distractor”. It is not a valid 30-item vocabulary assessment.
- The grammar quiz contains 30 entries but only 10 distinct question stems in each unit (20 repeated stems). The same 10-item grammar bank is repeated across all six units, despite their different grammar topic map.
- The 20-item unit exam contains only 6–7 distinct question stems per unit. Generic “Identify the word illustrated” items recur with placeholder distractors.
- Reading and listening data objects each contain five MCQs, but the reading passage is generic curriculum/skills prose rather than a clearly unit-specific informational passage. The listening dialogue in Unit 1 discusses illustrations and quiz practice; no native audio asset is supplied. This requires source alignment review before acceptance.

## Data integrity interpretation
The vocabulary words themselves are present as strings, but placeholder Arabic translations, definitions, and examples mean the bank is not ready for learners. An option count or valid correct-index does not establish that a question is educationally meaningful or has one defensible answer.

## Required remediation
1. Obtain readable official unit source pages, then map each target word to an accurate Arabic meaning, learner-level English definition, and contextual example.
2. Replace placeholder vocabulary quiz stems and distractors with word-specific MCQs based on the actual unit bank.
3. Rebuild each grammar quiz to the grammar focus of its own unit, with distinct questions and checked answer keys.
4. Rebuild the comprehensive exam so it samples distinct unit learning objectives rather than repeating generic vocabulary prompts.
5. Cross-check reading passages and listening scripts against the official source; obtain authorized recordings if required. If unavailable, label speech synthesis accurately and keep transcript optional.
6. Add real speaking tasks and unit-linked games in the learner flow; do not count TTS or a generic quiz as those activities.
7. Keep every learner question multiple-choice, as requested.

## Status
No original HTML was changed. No content here is marked approved. Official-source cross-check remains blocked while the repository's book PDFs are only accessible as Git LFS pointer metadata in this workflow.
