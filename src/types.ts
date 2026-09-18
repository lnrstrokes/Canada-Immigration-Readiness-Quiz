export type QuestionOption = 'A' | 'B' | 'C' | 'D';

export interface Milestone {
  id: string;
  name: string;
  description: string;
  startQuestion: number;
  endQuestion: number;
}

export interface QuestionMetadata {
  dateGenerated: string;
  scheduledDate: string;
  topic: string;
  subtopic: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: QuestionOption;
  explanation: string;
  officialSource: string;
  sourceUrl: string;
  sourceDate: string;
  contentVersion: string;
}

export interface Question {
  id: string;
  number: number;
  category: string;
  topic?: string;
  subtopic?: string;
  angle?: 'core_concept' | 'practical_application' | 'common_misconception';
  difficulty: string; // e.g. 'Foundational', 'Practical', 'Scenario-Based'
  streamNumber?: number;
  text: string;
  question?: string; // alias for text
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: QuestionOption;
  reference: string; // Official IRCC citation
  source?: string; // e.g. 'IRCC'
  sourceTitle?: string; // e.g. 'CRS Point Allocation Grid § Age Factor'
  sourceUrl?: string; // e.g. 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html'
  verifiedDate?: string; // e.g. '2026-09-18'
  insight: string; // concise 1-2 lines of official reasoning
  explanation?: string; // alias for insight
  milestoneId?: string;
  metadata?: QuestionMetadata;
}

export interface VerifiedFactPacket {
  topic: string;
  checkedDate: string;
  sourceAuthority: string; // 'Government of Canada / IRCC'
  sourceUrl: string;
  sourceDate: string;
  status: 'VERIFIED' | 'REVIEW_REQUIRED';
  verifiedFacts: string[];
}

export type CalendarDayStatus = 'scheduled' | 'generating' | 'generated' | 'validated' | 'exported';

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  displayDate: string; // e.g. 'Sep 18'
  dayNumber: number; // 1 to 30
  topic: string;
  subtopics: string[];
  angleTypes: [string, string, string];
  status: CalendarDayStatus;
  factPacket: VerifiedFactPacket;
  questions: Question[];
  validationIssues?: string[];
  isReviewRequired?: boolean;
}

export interface ChallengeConfig {
  title: string;
  subtitle: string;
  streamName?: string;
  milestones?: Milestone[];
  questions: Question[];
  activeCalendarDay?: CalendarDay;
}

export interface AssessmentResult {
  score: number;
  total: number;
  level: string;
  readiness: string;
  recommendation: string;
  crsEstimate: string;
}

// Helper to determine if an answer set fits a 2x2 grid (Section 6)
export const isShortAnswerSet = (options: { A: string; B: string; C: string; D: string }): boolean => {
  const allTexts = [options.A, options.B, options.C, options.D];
  return allTexts.every((text) => {
    if (!text) return false;
    const clean = text.trim();
    // Compact card check: <= 24 characters and <= 4 words
    return clean.length <= 24 && clean.split(/\s+/).length <= 4;
  });
};


