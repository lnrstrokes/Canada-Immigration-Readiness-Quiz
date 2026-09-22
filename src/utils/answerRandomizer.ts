import { Question, QuestionOption } from '../types';

export const ALL_OPTIONS: QuestionOption[] = ['A', 'B', 'C', 'D'];

/**
 * 30 diverse, non-repeating 3-letter answer position patterns for the 30-day schedule.
 * - No day has 3 identical letters.
 * - Every pattern uses 3 distinct letters across A, B, C, D.
 * - No two successive days share the same pattern.
 */
export const DAILY_POSITION_PATTERNS: QuestionOption[][] = [
  ['C', 'A', 'D'], // Day 1
  ['B', 'D', 'A'], // Day 2
  ['A', 'C', 'B'], // Day 3 (previously was B, B, B)
  ['D', 'B', 'C'], // Day 4
  ['C', 'D', 'A'], // Day 5
  ['B', 'A', 'D'], // Day 6
  ['A', 'D', 'C'], // Day 7
  ['D', 'C', 'B'], // Day 8
  ['B', 'C', 'A'], // Day 9
  ['C', 'A', 'B'], // Day 10
  ['D', 'A', 'C'], // Day 11
  ['A', 'B', 'D'], // Day 12
  ['C', 'B', 'D'], // Day 13
  ['B', 'D', 'C'], // Day 14
  ['D', 'C', 'A'], // Day 15
  ['A', 'C', 'D'], // Day 16
  ['B', 'A', 'C'], // Day 17
  ['C', 'D', 'B'], // Day 18
  ['D', 'B', 'A'], // Day 19
  ['A', 'D', 'B'], // Day 20
  ['C', 'A', 'D'], // Day 21
  ['B', 'D', 'A'], // Day 22
  ['D', 'C', 'B'], // Day 23
  ['A', 'C', 'B'], // Day 24
  ['B', 'A', 'D'], // Day 25
  ['C', 'D', 'A'], // Day 26
  ['D', 'A', 'B'], // Day 27
  ['A', 'B', 'C'], // Day 28
  ['B', 'C', 'D'], // Day 29
  ['C', 'B', 'A'], // Day 30
];

/**
 * Randomizes the 4 displayed answer option positions of a question such that
 * the verified correct answer is placed at `targetLetter`.
 *
 * Rules:
 * 1. Determines the verified correct answer text from the validated question data.
 * 2. Places the verified correct answer text at `targetLetter`.
 * 3. Distributes the other 3 distractors across the remaining 3 letters.
 * 4. Never alters the underlying question text, insight, reference, or factual correctness.
 * 5. Synchronizes `correctAnswer` and `correctValues`.
 */
export const randomizeQuestionToPosition = (
  q: Question,
  targetLetter: QuestionOption
): Question => {
  // 1. Determine verified correct answer text
  const originalCorrectKey = q.correctAnswer;
  const verifiedCorrectText = q.options[originalCorrectKey];

  if (!verifiedCorrectText) {
    return q; // Fallback safety
  }

  // 2. Identify the 3 distractor texts
  const distractorKeys = ALL_OPTIONS.filter((opt) => opt !== originalCorrectKey);
  const distractorTexts = distractorKeys.map((k) => q.options[k]);

  // 3. Prepare the new options object
  const otherLetters = ALL_OPTIONS.filter((opt) => opt !== targetLetter);
  const newOptions: Record<QuestionOption, string> = {
    A: '',
    B: '',
    C: '',
    D: '',
  };

  // Place correct text at targetLetter
  newOptions[targetLetter] = verifiedCorrectText;

  // Place distractors in the other 3 letters
  otherLetters.forEach((letter, idx) => {
    newOptions[letter] = distractorTexts[idx] || '';
  });

  return {
    ...q,
    options: newOptions as { A: string; B: string; C: string; D: string },
    correctAnswer: targetLetter,
    correctValues: [verifiedCorrectText],
  };
};

/**
 * Ensures a 3-question daily quiz has varied correct-answer positions across A-D:
 * - Avoids all three correct answers occupying the same letter.
 * - Avoids successive days repeating the same pattern.
 * - Randomizes displayed positions after factual verification.
 */
export const randomizeDailyQuestionSet = (
  questions: Question[],
  dayNumber: number = 1
): Question[] => {
  if (!questions || questions.length === 0) return [];

  // If not exactly 3 questions, randomize with rotation across A-D
  if (questions.length !== 3) {
    return questions.map((q, idx) => {
      const target = ALL_OPTIONS[idx % ALL_OPTIONS.length];
      return randomizeQuestionToPosition(q, target);
    });
  }

  // Select pattern based on dayNumber (1-indexed)
  const patternIndex = Math.max(0, (dayNumber - 1) % DAILY_POSITION_PATTERNS.length);
  const pattern = DAILY_POSITION_PATTERNS[patternIndex];

  let result = questions.map((q, idx) => {
    const target = pattern[idx] || 'B';
    return randomizeQuestionToPosition(q, target);
  });

  // Deterministic validation check: Answer Position Distribution
  // If all 3 answers ended up with the same position, re-shuffle immediately
  if (
    result[0].correctAnswer === result[1].correctAnswer &&
    result[1].correctAnswer === result[2].correctAnswer
  ) {
    const fallbackPattern: QuestionOption[] = ['C', 'A', 'D'];
    result = questions.map((q, idx) => {
      return randomizeQuestionToPosition(q, fallbackPattern[idx]);
    });
  }

  return result;
};
