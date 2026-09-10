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
  difficulty: string;
  streamNumber: number;
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: QuestionOption;
  reference: string;
  insight: string;
  milestoneId: string;
}

export interface ChallengeConfig {
  title: string;
  subtitle: string;
  streamName: string;
  milestones: Milestone[];
  questions: Question[];
}
