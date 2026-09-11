export type QuestionOption = 'A' | 'B' | 'C' | 'D';

export interface Milestone {
  id: string;
  name: string;
  description: string;
  startQuestion: number;
  endQuestion: number;
}

export interface Question {
  id: string;
  number: number;
  category: string;
  difficulty: string; // e.g. 'Standard IRCC', 'Advanced CRS', 'Complex Case'
  streamNumber: number;
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: QuestionOption;
  reference: string; // Official IRCC Regulation / Ministerial Instruction / Operational Instruction
  insight: string; // Strategic immigration advice & compliance guidance
  milestoneId: string;
}

export interface ChallengeConfig {
  title: string;
  subtitle: string;
  streamName: string;
  milestones: Milestone[];
  questions: Question[];
}

export interface AssessmentResult {
  score: number;
  total: number;
  level: string;
  readiness: string;
  recommendation: string;
  crsEstimate: string;
}
