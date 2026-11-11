export type DisasterType =
  | 'EARTHQUAKE'
  | 'FLOOD'
  | 'FIRE'
  | 'TSUNAMI'
  | 'CYCLONE'
  | 'LANDSLIDE'
  | 'CHEMICAL_SPILL'
  | 'OTHER';

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';

export interface ScenarioListItem {
  id: string;
  title: string;
  description: string;
  disasterType: DisasterType;
  difficulty: DifficultyLevel;
  estimatedDuration: number | null;
  passingScore: number;
  maxScore: number;
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

export interface ScenarioDetail extends ScenarioListItem {
  instructions?: string;
  questions: ScenarioQuestion[];
}

export interface ScenariosListResponse {
  success: boolean;
  count: number;
  scenarios: ScenarioListItem[];
}

export interface ScenarioDetailResponse {
  success: boolean;
  scenario: ScenarioDetail;
}

