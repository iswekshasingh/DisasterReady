import { DifficultyLevel, DisasterType } from './scenario.types';

export type AttemptStatus = 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'ABANDONED';

export interface SubmittedAnswer {
  questionId: string;
  selectedOptionId: string;
}

export interface SubmitAttemptPayload {
  scenarioId: string;
  answers: SubmittedAnswer[];
  timeSpent?: number;
}

export interface QuestionEvaluationResult {
  questionId: string;
  selectedOptionId: string;
  correctOptionId: string;
  isCorrect: boolean;
  points: number;
  explanation: string;
}

export interface SubmitAttemptResponse {
  success: boolean;
  message: string;
  attempt: {
    id: string;
    scenarioId: string;
    score: number;
    maxScore: number;
    correctAnswers: number;
    totalQuestions: number;
    passed: boolean;
    results: QuestionEvaluationResult[];
  };
}

export interface AttemptHistoryItem {
  id: string;
  userId: string;
  scenarioId: string;
  score: number;
  status: AttemptStatus;
  userChoices: SubmittedAnswer[] | null;
  timeSpent: number | null;
  startedAt: string;
  completedAt: string | null;
  scenario: {
    title: string;
    disasterType: DisasterType;
    difficulty: DifficultyLevel;
  };
}

export interface AttemptHistoryResponse {
  success: boolean;
  count: number;
  attempts: AttemptHistoryItem[];
}
