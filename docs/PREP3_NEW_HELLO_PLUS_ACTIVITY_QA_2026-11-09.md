# Prep 3 New Hello Plus — activity and source QA follow-up
Date: 9 November 2026
Branch: `content-import/prep-new-hello-hello-plus`

## Scope
Inspected all six source files registered for Preparatory 3 New Hello Plus:
`Prep_3_New_Hello_Plus_Unit_1.html` through `Unit_6.html`.

## Results
- All six files contain the expected data declarations for `vocabData`, `vocabQuizData`, `grammarQuizData`, `readingData`, `listeningData`, and `examData`.
- The visible section headings include vocabulary bank, vocabulary practice, grammar mastery, listening comprehension, and comprehensive unit evaluation. The sampled headings do not expose a distinct speaking-task section or a game section.
- None of the six files contains a native `<audio>` element, `getUserMedia`, or `MediaRecorder`. Their speech controls use browser speech synthesis. This is TTS/read-aloud, not a recording or listening-audio asset.
- In Unit 1, the vocabulary quiz prompt is generic (“Which term best matches the visual illustration…”) while the options contain one curriculum word and placeholder distractors such as “distractor term”, “false choice”, and “unrelated word”. The unit exam similarly uses a generic “Identify the word illustrated…” prompt with placeholder choices. This confirms that the repeated-prompt issue is not merely cosmetic duplication: the question stem and distractors do not provide a reliable assessment of a specific target word.
- The listening dialogue in Unit 1 is a short teacher/student exchange about looking at illustrations and completing quizzes; it is not evidence of a recorded listening passage or a distinct oral production task.

## Required action
Do not convert these placeholder questions into “approved” practice by simply shuffling options or changing their wording. Replace them only after the official unit vocabulary, grammar scope, reading/listening material, and answer keys are available for source checking. Keep all learner questions multiple-choice. Add a real unit-linked speaking prompt/task and a game mapped to the unit learning objectives; do not count TTS playback or a generic quiz as either.

## Status
This is a source-structure QA note, not academic approval. The original six HTML files remain unchanged. No APK was built or shared, and no merge to `main` was performed.
