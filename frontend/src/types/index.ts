export type UserRole = 'USER' | 'TRAINER' | 'ADMIN';

export type DisasterType =
  | 'EARTHQUAKE'
  | 'FLOOD'
  | 'FIRE'
  | 'TSUNAMI'
  | 'CYCLONE'
  | 'LANDSLIDE'
  | 'CHEMICAL_SPILL'
  | 'OTHER';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';

export type AttemptStatus = 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'ABANDONED';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName?: string | null;
  role: UserRole;
  totalPoints?: number;
  level?: number;
  badges?: string[];
  createdAt?: string;
}

export interface QuestionOption {
  optionId: string;
  text: string;
}

export interface ScenarioQuestion {
  questionId: string;
  question: string;
  options: QuestionOption[];
  points: number;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  disasterType: DisasterType;
  difficulty: Difficulty;
  estimatedDuration: number | null;
  passingScore: number;
  maxScore: number;
  instructions?: string;
  questions?: ScenarioQuestion[];
}

export interface AnswerChoice {
  questionId: string;
  selectedOptionId: string;
}

export interface QuestionEvaluation {
  questionId: string;
  selectedOptionId: string;
  correctOptionId: string;
  isCorrect: boolean;
  points: number;
  explanation: string;
}

export interface AttemptSubmissionResult {
  id: string;
  scenarioId: string;
  score: number;
  maxScore: number;
  correctAnswers: number;
  totalQuestions: number;
  passed: boolean;
  results: QuestionEvaluation[];
}

export interface AttemptHistoryItem {
  id: string;
  userId: string;
  scenarioId: string;
  score: number;
  status: AttemptStatus;
  userChoices: AnswerChoice[] | null;
  timeSpent: number | null;
  startedAt: string;
  completedAt: string | null;
  scenario?: {
    title: string;
    disasterType: DisasterType;
    difficulty: Difficulty;
  };
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  fullName?: string | null;
  totalPoints: number;
  level: number;
  badges: string[];
}

export interface HealthStatus {
  status: string;
  service: string;
  uptime: number;
  timestamp: string;
  environment: string;
}
